import { ObjectId } from 'mongodb';
import { connectToDatabase } from '../lib/mongo.js';
import { BurnDoc, SessionDoc, CreatorDoc, AdvertisingMetadata } from '../types/index.js';
import { BurnService } from './BurnService.js';

interface LeaderboardEntry {
  rank: number;
  wallet: string;
  userId?: string;
  user?: any;
  totalBurned: number;
  burnCount?: number;
  lastBurnAt?: Date;
  advertisingMetadata?: AdvertisingMetadata;
  tokenSymbol?: string;
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
}

export class LeaderboardService {
  static async getLeaderboard(
    creatorMint: string, 
    options: { limit?: number; sessionId?: string } = {}
  ): Promise<LeaderboardResponse> {
    const { limit = 10, sessionId } = options;
    
    // Use the new BurnService to get the leaderboard
    const leaderboardEntries = await BurnService.getCreatorLeaderboard(creatorMint);
    
    // Apply limit if specified
    const limitedEntries = limit ? leaderboardEntries.slice(0, limit) : leaderboardEntries;
    
    // Convert to the expected format
    const rankedLeaderboard: LeaderboardEntry[] = limitedEntries.map(entry => ({
      rank: entry.rank,
      wallet: entry.wallet,
      userId: entry.userId?.toString(),
      user: entry.user,
      totalBurned: entry.totalBurned,
      burnCount: entry.burnCount,
      lastBurnAt: entry.lastBurnAt,
      advertisingMetadata: entry.advertisingMetadata,
      tokenSymbol: entry.tokenSymbol
    }));

    // Get session info if sessionId is provided
    let sessionInfo = null;
    if (sessionId) {
      const db = await connectToDatabase();
      const sessions = db.collection<SessionDoc>('sessions');
      
      if (!ObjectId.isValid(sessionId)) {
        throw new Error('Invalid sessionId format');
      }

      const sessionObjectId = new ObjectId(sessionId);
      sessionInfo = await sessions.findOne({ _id: sessionObjectId });
      if (!sessionInfo) {
        throw new Error('Session not found');
      }
    }

    // Format session info
    const formattedSession = sessionInfo ? {
      id: sessionInfo._id.toString(),
      startTime: sessionInfo.startTime.toISOString(),
      endTime: sessionInfo.endTime?.toISOString(),
      isActive: sessionInfo.isActive,
      totalBurns: sessionInfo.totalBurns,
      participantCount: sessionInfo.participantCount
    } : null;

    return {
      leaderboard: rankedLeaderboard,
      session: formattedSession,
      creatorMint
    };
  }

  // Legacy method for backwards compatibility
  static async getLegacyLeaderboard(
    creatorMint: string, 
    options: { limit?: number; sessionId?: string } = {}
  ): Promise<LeaderboardResponse> {
    const { limit = 10, sessionId } = options;
    
    const db = await connectToDatabase();
    const burns = db.collection<BurnDoc>('burns');
    const sessions = db.collection<SessionDoc>('sessions');
    const creators = db.collection<CreatorDoc>('creators');

    // Build match condition - for legacy compatibility, aggregate by wallet instead of userId
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
      const creator = await creators.findOne({ _id: creatorMint });
      if (creator?.currentSessionId) {
        matchCondition.sessionId = creator.currentSessionId;
        sessionInfo = await sessions.findOne({ _id: creator.currentSessionId });
      }
    }

    // Get legacy format leaderboard
    const legacyEntries = await BurnService.getLegacyLeaderboard(creatorMint, sessionId);
    
    const rankedLeaderboard = legacyEntries.slice(0, limit).map((entry, index) => ({
      rank: index + 1,
      wallet: entry.wallet,
      userId: entry.userId,
      user: entry.user,
      totalBurned: entry.totalBurned,
      advertisingMetadata: entry.advertisingMetadata
    }));

    const formattedSession = sessionInfo ? {
      id: sessionInfo._id.toString(),
      startTime: sessionInfo.startTime.toISOString(),
      endTime: sessionInfo.endTime?.toISOString(),
      isActive: sessionInfo.isActive,
      totalBurns: sessionInfo.totalBurns,
      participantCount: sessionInfo.participantCount
    } : null;

    return {
      leaderboard: rankedLeaderboard,
      session: formattedSession,
      creatorMint
    };
  }
}