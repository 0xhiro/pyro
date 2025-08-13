import { ObjectId } from 'mongodb';
import { connectToDatabase } from '../lib/mongo';
import { SessionDoc, CreatorDoc, AdvertisingMetadata } from '../types';
import { SolanaService } from './SolanaService';

interface LeaderboardEntry {
  rank: number;
  wallet: string;
  totalBurned: number;
  advertisingMetadata?: AdvertisingMetadata;
  userId?: string;
  user?: {
    _id: string;
    username?: string;
    displayName?: string;
    profileImageUrl?: string;
  };
}

interface SessionInfo {
  id: string;
  startTime: string;
  endTime?: string;
  isActive: boolean;
  totalBurns: number;
  participantCount: number;
}

interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  session: SessionInfo | null;
  creatorMint: string;
  dataSource: 'blockchain' | 'database' | 'database_fallback';
}

interface LeaderboardOptions {
  limit?: number;
  sessionId?: string;
  useBlockchain?: boolean;
}

interface CacheEntry {
  data: LeaderboardResponse;
  timestamp: number;
}

export class BlockchainLeaderboardService {
  private static solanaService = new SolanaService();
  private static cache = new Map<string, CacheEntry>();
  private static readonly CACHE_TTL = 30000; // 30 seconds

  static async getLeaderboard(
    creatorMint: string, 
    options: LeaderboardOptions = {}
  ): Promise<LeaderboardResponse> {
    const { limit = 10, sessionId, useBlockchain = true } = options;
    
    // Validate inputs
    if (!creatorMint || typeof creatorMint !== 'string') {
      throw new Error('Valid creatorMint is required');
    }

    if (limit < 1 || limit > 100) {
      throw new Error('Limit must be between 1 and 100');
    }

    // Check cache first
    const cacheKey = `${creatorMint}_${sessionId || 'all'}_${limit}_${useBlockchain}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    try {
      const db = await connectToDatabase();
      const sessions = db.collection<SessionDoc>('sessions');
      const creators = db.collection<CreatorDoc>('creators');

      let sessionInfo: SessionDoc | null = null;
      let timeWindow: number | undefined;

      // Get session info if provided
      if (sessionId) {
        if (!ObjectId.isValid(sessionId)) {
          throw new Error('Invalid sessionId format');
        }

        const sessionObjectId = new ObjectId(sessionId);
        sessionInfo = await sessions.findOne({ _id: sessionObjectId });
        if (!sessionInfo) {
          throw new Error('Session not found');
        }

        // Calculate time window for session
        const startTime = sessionInfo.startTime.getTime() / 1000;
        const endTime = sessionInfo.endTime ? sessionInfo.endTime.getTime() / 1000 : undefined;
        timeWindow = endTime ? endTime - startTime : Date.now() / 1000 - startTime;
      } else {
        // Try to get current active session
        const creator = await creators.findOne({ _id: creatorMint });
        if (creator?.currentSessionId) {
          sessionInfo = await sessions.findOne({ _id: creator.currentSessionId });
          if (sessionInfo) {
            const startTime = sessionInfo.startTime.getTime() / 1000;
            timeWindow = Date.now() / 1000 - startTime;
          }
        }
      }

      let result: LeaderboardResponse;

      if (useBlockchain) {
        try {
          console.log(`🔍 Fetching blockchain data for mint: ${creatorMint}`);
          
          // Fetch leaderboard data from blockchain
          const leaderboardData = await this.solanaService.getLeaderboardData(creatorMint, {
            limit: limit * 2, // Get more data to account for filtering
            timeWindow
          });
          
          console.log(`✅ Blockchain data fetched: ${leaderboardData.length} entries`);
          
          // Enhance with database data (advertising metadata and user info)
          const enhancedLeaderboard = await this.enhanceLeaderboardWithDatabaseData(
            leaderboardData.slice(0, limit),
            creatorMint,
            sessionId
          );

          result = {
            leaderboard: enhancedLeaderboard,
            session: this.formatSessionInfo(sessionInfo),
            creatorMint,
            dataSource: 'blockchain'
          };
        } catch (error) {
          console.error('❌ Failed to fetch blockchain data, falling back to database:', error);
          
          // Fallback to database-based approach
          result = await this.getDatabaseLeaderboard(creatorMint, { limit, sessionId });
          result.dataSource = 'database_fallback';
        }
      } else {
        result = await this.getDatabaseLeaderboard(creatorMint, { limit, sessionId });
      }

      // Cache the result
      this.cache.set(cacheKey, { data: result, timestamp: Date.now() });

      return result;
    } catch (error) {
      console.error('Error in getLeaderboard:', error);
      throw error instanceof Error ? error : new Error('Failed to fetch leaderboard');
    }
  }

  private static async enhanceLeaderboardWithDatabaseData(
    blockchainData: { wallet: string; totalBurned: number }[],
    creatorMint: string,
    sessionId?: string
  ): Promise<LeaderboardEntry[]> {
    try {
      const db = await connectToDatabase();
      const burns = db.collection('burns');
      const users = db.collection('users');

      // Build match condition for database lookup
      const matchCondition: Record<string, unknown> = { creatorMint };
      if (sessionId && ObjectId.isValid(sessionId)) {
        matchCondition.sessionId = new ObjectId(sessionId);
      }

      // Get advertising metadata and user info for these wallets
      const wallets = blockchainData.map(entry => entry.wallet);
      
      // Get burn data with advertising metadata
      const burnDataMap = new Map<string, AdvertisingMetadata>();
      const burnData = await burns.aggregate([
        { 
          $match: { 
            ...matchCondition,
            wallet: { $in: wallets }
          }
        },
        {
          $sort: { wallet: 1, amount: -1 } // Get highest burn per wallet for ad metadata
        },
        {
          $group: {
            _id: '$wallet',
            advertisingMetadata: { $first: '$advertisingMetadata' },
            userId: { $first: '$userId' }
          }
        }
      ]).toArray();

      // Create maps for quick lookup
      const userIdMap = new Map<string, string>();
      burnData.forEach(entry => {
        if (entry.advertisingMetadata) {
          burnDataMap.set(entry._id, entry.advertisingMetadata);
        }
        if (entry.userId) {
          userIdMap.set(entry._id, entry.userId);
        }
      });

      // Get user data for wallets that have userIds
      const userIds = Array.from(userIdMap.values()).filter(Boolean);
      const userData = await users.find(
        { _id: { $in: userIds.map(id => new ObjectId(id)) } },
        { projection: { username: 1, displayName: 1, profileImageUrl: 1 } }
      ).toArray();

      const userDataMap = new Map(userData.map(user => [user._id.toString(), user]));

      // Enhance blockchain data with database metadata
      return blockchainData.map((entry, index) => {
        const userId = userIdMap.get(entry.wallet);
        const user = userId ? userDataMap.get(userId) : undefined;

        return {
          rank: index + 1,
          wallet: entry.wallet,
          totalBurned: entry.totalBurned,
          advertisingMetadata: burnDataMap.get(entry.wallet),
          userId,
          user: user ? {
            _id: user._id.toString(),
            username: user.username,
            displayName: user.displayName,
            profileImageUrl: user.profileImageUrl
          } : undefined
        };
      });
    } catch (error) {
      console.error('Error enhancing leaderboard data:', error);
      
      // Return basic data if enhancement fails
      return blockchainData.map((entry, index) => ({
        rank: index + 1,
        wallet: entry.wallet,
        totalBurned: entry.totalBurned
      }));
    }
  }

  private static async getDatabaseLeaderboard(
    creatorMint: string,
    options: { limit?: number; sessionId?: string }
  ): Promise<LeaderboardResponse> {
    const { limit = 10, sessionId } = options;
    
    const db = await connectToDatabase();
    const burns = db.collection('burns');
    const sessions = db.collection<SessionDoc>('sessions');
    const creators = db.collection<CreatorDoc>('creators');
    const users = db.collection('users');

    // Build match condition
    const matchCondition: Record<string, unknown> = { creatorMint };
    let sessionInfo: SessionDoc | null = null;
    
    if (sessionId) {
      if (!ObjectId.isValid(sessionId)) {
        throw new Error('Invalid sessionId format');
      }

      const sessionObjectId = new ObjectId(sessionId);
      matchCondition.sessionId = sessionObjectId;

      sessionInfo = await sessions.findOne({ _id: sessionObjectId });
      if (!sessionInfo) {
        throw new Error('Session not found');
      }
    } else {
      // Try to get current active session
      const creator = await creators.findOne({ _id: creatorMint });
      if (creator?.currentSessionId) {
        matchCondition.sessionId = creator.currentSessionId;
        sessionInfo = await sessions.findOne({ _id: creator.currentSessionId });
      }
    }

    // Get leaderboard data from database with advertising metadata and user info
    const leaderboard = await burns.aggregate([
      { $match: matchCondition },
      { 
        $sort: { wallet: 1, amount: -1 } // Sort by wallet then by amount descending
      },
      {
        $group: { 
          _id: '$wallet', 
          totalBurned: { $sum: '$amount' },
          advertisingMetadata: { $first: '$advertisingMetadata' },
          userId: { $first: '$userId' }
        }
      },
      { 
        $project: { 
          wallet: '$_id', 
          totalBurned: 1, 
          advertisingMetadata: 1,
          userId: 1,
          _id: 0 
        } 
      },
      { $sort: { totalBurned: -1 } },
      { $limit: limit },
    ]).toArray();

    // Get user data for entries that have userIds
    const userIds = leaderboard
      .map(entry => entry.userId)
      .filter((id): id is string => Boolean(id))
      .map(id => new ObjectId(id));

    const userData = userIds.length > 0 
      ? await users.find(
          { _id: { $in: userIds } },
          { projection: { username: 1, displayName: 1, profileImageUrl: 1 } }
        ).toArray()
      : [];

    const userDataMap = new Map(userData.map(user => [user._id.toString(), user]));

    // Create final leaderboard with user data
    const rankedLeaderboard: LeaderboardEntry[] = leaderboard.map((entry, index) => {
      const user = entry.userId ? userDataMap.get(entry.userId) : undefined;
      
      return {
        rank: index + 1,
        wallet: entry.wallet,
        totalBurned: entry.totalBurned,
        advertisingMetadata: entry.advertisingMetadata,
        userId: entry.userId,
        user: user ? {
          _id: user._id.toString(),
          username: user.username,
          displayName: user.displayName,
          profileImageUrl: user.profileImageUrl
        } : undefined
      };
    });

    return {
      leaderboard: rankedLeaderboard,
      session: this.formatSessionInfo(sessionInfo),
      creatorMint,
      dataSource: 'database'
    };
  }

  private static formatSessionInfo(sessionInfo: SessionDoc | null): SessionInfo | null {
    if (!sessionInfo || !sessionInfo._id) {
      return null;
    }

    return {
      id: sessionInfo._id.toString(),
      startTime: sessionInfo.startTime.toISOString(),
      endTime: sessionInfo.endTime?.toISOString(),
      isActive: sessionInfo.isActive,
      totalBurns: sessionInfo.totalBurns,
      participantCount: sessionInfo.participantCount
    };
  }

  /**
   * Clear cache for a specific creator mint
   */
  static clearCache(creatorMint: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(creatorMint)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  static clearAllCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}