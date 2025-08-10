import { ObjectId } from 'mongodb';
import { connectToDatabase } from '../lib/mongo';
import { BurnDoc, SessionDoc, CreatorDoc } from '../types';

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
}

export class LeaderboardService {
  static async getLeaderboard(
    creatorMint: string, 
    options: { limit?: number; sessionId?: string } = {}
  ): Promise<LeaderboardResponse> {
    const { limit = 10, sessionId } = options;
    
    const db = await connectToDatabase();
    const burns = db.collection<BurnDoc>('burns');
    const sessions = db.collection<SessionDoc>('sessions');
    const creators = db.collection<CreatorDoc>('creators');

    // Build match condition
    const matchCondition: any = { creatorMint };
    let sessionInfo = null;
    
    if (sessionId) {
      // Validate sessionId format
      if (!ObjectId.isValid(sessionId)) {
        throw new Error('Invalid sessionId format');
      }

      const sessionObjectId = new ObjectId(sessionId);
      matchCondition.sessionId = sessionObjectId;

      // Get session info
      sessionInfo = await sessions.findOne({ _id: sessionObjectId });
      if (!sessionInfo) {
        throw new Error('Session not found');
      }
    } else {
      // If no sessionId provided, try to get the current active session
      const creator = await creators.findOne({ _id: creatorMint });
      if (creator?.currentSessionId) {
        matchCondition.sessionId = creator.currentSessionId;
        sessionInfo = await sessions.findOne({ _id: creator.currentSessionId });
      }
    }

    // Get leaderboard data
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