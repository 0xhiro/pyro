import { ObjectId } from 'mongodb';
import { connectToDatabase } from '../lib/mongo';
import { SessionDoc, CreatorDoc } from '../types';
import { SolanaService } from './SolanaService';

interface LeaderboardEntry {
  rank: number;
  wallet: string;
  totalBurned: number;
}

interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  session: {
    id: string;
    startTime: string;
    endTime?: string;
    isActive: boolean;
    totalBurns: number;
    participantCount: number;
  } | null;
  creatorMint: string;
  dataSource: 'blockchain' | 'database';
}

export class BlockchainLeaderboardService {
  private static solanaService = new SolanaService();
  private static cache = new Map<string, { data: LeaderboardResponse; timestamp: number }>();
  private static readonly CACHE_TTL = 30000; // 30 seconds

  static async getLeaderboard(
    creatorMint: string, 
    options: { limit?: number; sessionId?: string; useBlockchain?: boolean } = {}
  ): Promise<LeaderboardResponse> {
    const { limit = 10, sessionId, useBlockchain = true } = options;
    
    // Check cache first
    const cacheKey = `${creatorMint}_${sessionId || 'all'}_${limit}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    const db = await connectToDatabase();
    const sessions = db.collection<SessionDoc>('sessions');
    const creators = db.collection<CreatorDoc>('creators');

    let sessionInfo = null;
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

    let leaderboardData: { wallet: string; totalBurned: number }[] = [];
    let dataSource: 'blockchain' | 'database' = 'database';

    if (useBlockchain) {
      try {
        console.log(`🔍 Fetching blockchain data for mint: ${creatorMint}`);
        // Fetch leaderboard data from blockchain
        leaderboardData = await this.solanaService.getLeaderboardData(creatorMint, {
          limit: limit * 2, // Get more data to account for filtering
          timeWindow
        });
        dataSource = 'blockchain';
        console.log(`✅ Blockchain data fetched: ${leaderboardData.length} entries`);
        console.log('Raw blockchain data:', leaderboardData);
      } catch (error) {
        console.error('❌ Failed to fetch blockchain data, falling back to database:', error);
        // Fallback to original database-based approach
        const fallbackResult = await this.getDatabaseLeaderboard(creatorMint, { limit, sessionId });
        return { ...fallbackResult, dataSource: 'database_fallback' };
      }
    } else {
      const result = await this.getDatabaseLeaderboard(creatorMint, { limit, sessionId });
      return { ...result, dataSource: 'database' };
    }

    // Rank the leaderboard
    const rankedLeaderboard: LeaderboardEntry[] = leaderboardData
      .slice(0, limit)
      .map((entry, index) => ({
        rank: index + 1,
        wallet: entry.wallet,
        totalBurned: entry.totalBurned
      }));

    // Format session info
    const formattedSession = sessionInfo ? {
      id: sessionInfo._id!.toString(),
      startTime: sessionInfo.startTime.toISOString(),
      endTime: sessionInfo.endTime?.toISOString(),
      isActive: sessionInfo.isActive,
      totalBurns: sessionInfo.totalBurns,
      participantCount: sessionInfo.participantCount
    } : null;

    const result: LeaderboardResponse = {
      leaderboard: rankedLeaderboard,
      session: formattedSession,
      creatorMint,
      dataSource
    };

    // Cache the result
    this.cache.set(cacheKey, { data: result, timestamp: Date.now() });

    return result;
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

    // Build match condition
    const matchCondition: any = { creatorMint };
    let sessionInfo = null;
    
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

    // Get leaderboard data from database
    const leaderboard = await burns.aggregate([
      { $match: matchCondition },
      { $group: { _id: '$wallet', totalBurned: { $sum: '$amount' } } },
      { $project: { wallet: '$_id', totalBurned: 1, _id: 0 } },
      { $sort: { totalBurned: -1 } },
      { $limit: limit },
    ]).toArray();

    const rankedLeaderboard = leaderboard.map((entry, index) => ({
      rank: index + 1,
      wallet: entry.wallet,
      totalBurned: entry.totalBurned
    }));

    // Format session info
    const formattedSession = sessionInfo ? {
      id: sessionInfo._id!.toString(),
      startTime: sessionInfo.startTime.toISOString(),
      endTime: sessionInfo.endTime?.toISOString(),
      isActive: sessionInfo.isActive,
      totalBurns: sessionInfo.totalBurns,
      participantCount: sessionInfo.participantCount
    } : null;

    return {
      leaderboard: rankedLeaderboard,
      session: formattedSession,
      creatorMint,
      dataSource: 'database'
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
}