import { ObjectId } from 'mongodb';
import { connectToDatabase } from '../lib/mongo.js';
import { BurnDoc, UserBurnRef, TokenDoc, AdvertisingMetadata } from '../types/index.js';
import { SessionService } from './SessionService.js';
import { CreatorService } from './CreatorService.js';
import { UserService } from './UserService.js';
import { CommunityService } from './CommunityService.js';

export class BurnService {
  private static readonly PROTOCOL_FEE_PERCENT = Number(process.env.PROTOCOL_FEE_PERCENT) || 2;

  private static async getBurnsCollection() {
    const db = await connectToDatabase();
    return db.collection<BurnDoc>('burns');
  }

  private static async getUsersCollection() {
    const db = await connectToDatabase();
    return db.collection('users');
  }

  private static async getCreatorsCollection() {
    const db = await connectToDatabase();
    return db.collection('creators');
  }

  // Create a new burn record
  static async createBurn(burnData: {
    userId: string;
    wallet: string;
    creatorMint: string;
    amount: number;
    promotedToken?: TokenDoc;       // Full token object they want to promote
    advertisingMetadata?: AdvertisingMetadata;
    sessionId?: string;
    txSignature: string;            // Required transaction signature
  }): Promise<{ burnDoc: BurnDoc; protocolFee: number }> {
    const burns = await this.getBurnsCollection();
    const users = await this.getUsersCollection();
    const creators = await this.getCreatorsCollection();

    // Calculate protocol fee
    const protocolFee = (burnData.amount * this.PROTOCOL_FEE_PERCENT) / 100;
    const now = new Date();

    // Validate userId
    if (!ObjectId.isValid(burnData.userId)) {
      throw new Error('Invalid userId format');
    }
    
    const user = await UserService.getUserById(burnData.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Validate sessionId if provided
    let validSessionId = null;
    if (burnData.sessionId) {
      if (!ObjectId.isValid(burnData.sessionId)) {
        throw new Error('Invalid sessionId format');
      }
      
      const session = await SessionService.getSessionById(burnData.sessionId);
      if (!session || !session.isActive || session.creatorMint !== burnData.creatorMint) {
        throw new Error('Session not found or inactive');
      }
      
      validSessionId = new ObjectId(burnData.sessionId);
    }

    // Validate promoted token if provided (basic validation only - no portfolio requirement)
    if (burnData.promotedToken) {
      if (!burnData.promotedToken.mint || !burnData.promotedToken.name || !burnData.promotedToken.symbol) {
        throw new Error('Promoted token must have mint, name, and symbol');
      }
    }

    // Validate transaction signature
    if (!burnData.txSignature || burnData.txSignature.trim().length === 0) {
      throw new Error('Transaction signature is required');
    }

    // Create burn document
    const burnDoc: BurnDoc = {
      userId: new ObjectId(burnData.userId),
      wallet: burnData.wallet,
      creatorMint: burnData.creatorMint,
      amount: burnData.amount,
      promotedToken: burnData.promotedToken,
      advertisingMetadata: burnData.advertisingMetadata,
      sessionId: validSessionId || undefined,
      txSignature: burnData.txSignature,
      protocolFee,
      burnedAt: now
    };

    // Insert the burn record
    const burnResult = await burns.insertOne(burnDoc);
    const burnId = burnResult.insertedId;

    // Create user burn reference
    const userBurnRef: UserBurnRef = {
      burnId: burnId,
      creatorMint: burnData.creatorMint,
      amount: burnData.amount,
      burnedAt: now
    };

    // Update user's burns array and stats
    await users.updateOne(
      { _id: new ObjectId(burnData.userId) },
      {
        $push: { burns: userBurnRef },
        $inc: { 
          totalTokensBurned: burnData.amount,
          totalBurns: 1
        },
        $set: { lastActiveAt: now }
      }
    );

    // Update creator's total tokens burned
    await creators.updateOne(
      { _id: burnData.creatorMint },
      {
        $inc: { totalTokensBurned: burnData.amount }
      }
    );

    // Update session stats if sessionId provided
    if (validSessionId) {
      await SessionService.updateSessionStats(validSessionId, burnData.amount);
    }

    // Update community tracking if promoting a token
    console.log('Checking if burnData.promotedToken exists:', !!burnData.promotedToken);
    if (burnData.promotedToken) {
      try {
        console.log('About to call CommunityService.updateCommunityFromBurn');
        console.log('Promoted token mint:', burnData.promotedToken.mint);
        console.log('Full promoted token:', JSON.stringify(burnData.promotedToken));
        await CommunityService.updateCommunityFromBurn(
          burnData.promotedToken,
          {
            userId: new ObjectId(burnData.userId),
            wallet: burnData.wallet,
            creatorMint: burnData.creatorMint,
            amount: burnData.amount,
            burnedAt: now
          }
        );
        console.log('Community tracking updated successfully');
      } catch (error) {
        console.error('Failed to update community tracking:', error);
        // Don't fail the burn if community tracking fails
      }
    }

    return {
      burnDoc: {
        ...burnDoc,
        _id: burnId
      },
      protocolFee
    };
  }

  // Get all burns for a specific creator (for leaderboard)
  static async getBurnsByCreator(creatorMint: string, limit?: number): Promise<BurnDoc[]> {
    const burns = await this.getBurnsCollection();
    const query = { creatorMint };
    const options = {
      sort: { burnedAt: -1 },
      ...(limit && { limit })
    };

    return await burns.find(query, options).toArray();
  }

  // Get aggregated leaderboard for a creator
  static async getCreatorLeaderboard(creatorMint: string): Promise<Array<{
    userId: ObjectId;
    wallet: string;
    user?: any;
    totalBurned: number;
    burnCount: number;
    rank: number;
    lastBurnAt: Date;
    advertisingMetadata?: AdvertisingMetadata;
    tokenSymbol?: string;
  }>> {
    const burns = await this.getBurnsCollection();
    
    const pipeline = [
      { $match: { creatorMint } },
      {
        $group: {
          _id: '$userId',
          totalBurned: { $sum: '$amount' },
          burnCount: { $sum: 1 },
          lastBurnAt: { $max: '$burnedAt' },
          // Get the most recent advertising metadata
          advertisingMetadata: { $last: '$advertisingMetadata' }
        }
      },
      { $sort: { totalBurned: -1 } },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $addFields: {
          user: { $arrayElemAt: ['$user', 0] }
        }
      },
      {
        $addFields: {
          wallet: '$user.wallet'
        }
      }
    ];

    const results = await burns.aggregate(pipeline).toArray();
    
    // Add rank to each entry and get creator info for token symbol
    const creator = await CreatorService.getCreatorByMint(creatorMint);
    const tokenSymbol = creator?.tokenInfo?.symbol || creator?.tokenInfo?.ticker;
    
    return results.map((entry, index) => ({
      ...entry,
      userId: entry._id,
      rank: index + 1,
      tokenSymbol
    }));
  }

  // Get user's burn history
  static async getUserBurns(userId: string, limit?: number): Promise<BurnDoc[]> {
    const burns = await this.getBurnsCollection();
    const query = { userId: new ObjectId(userId) };
    const options = {
      sort: { burnedAt: -1 },
      ...(limit && { limit })
    };

    return await burns.find(query, options).toArray();
  }

  // Get user's burns for a specific creator
  static async getUserBurnsForCreator(userId: string, creatorMint: string): Promise<BurnDoc[]> {
    const burns = await this.getBurnsCollection();
    const query = { 
      userId: new ObjectId(userId),
      creatorMint 
    };

    return await burns.find(query, { sort: { burnedAt: -1 } }).toArray();
  }

  // Get total burned amount for a creator
  static async getCreatorTotalBurned(creatorMint: string): Promise<number> {
    const burns = await this.getBurnsCollection();
    const pipeline = [
      { $match: { creatorMint } },
      {
        $group: {
          _id: null,
          totalBurned: { $sum: '$amount' }
        }
      }
    ];

    const result = await burns.aggregate(pipeline).toArray();
    return result.length > 0 ? result[0].totalBurned : 0;
  }

  // Get burn statistics
  static async getBurnStats(creatorMint?: string): Promise<{
    totalBurns: number;
    totalAmount: number;
    uniqueUsers: number;
  }> {
    const burns = await this.getBurnsCollection();
    const matchStage = creatorMint ? { $match: { creatorMint } } : { $match: {} };
    
    const pipeline = [
      matchStage,
      {
        $group: {
          _id: null,
          totalBurns: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          uniqueUsers: { $addToSet: '$userId' }
        }
      },
      {
        $addFields: {
          uniqueUsers: { $size: '$uniqueUsers' }
        }
      }
    ];

    const result = await burns.aggregate(pipeline).toArray();
    
    if (result.length === 0) {
      return { totalBurns: 0, totalAmount: 0, uniqueUsers: 0 };
    }

    return {
      totalBurns: result[0].totalBurns,
      totalAmount: result[0].totalAmount,
      uniqueUsers: result[0].uniqueUsers
    };
  }

  // Get recent burns across all creators
  static async getRecentBurns(limit: number = 50): Promise<BurnDoc[]> {
    const burns = await this.getBurnsCollection();
    return await burns
      .find({}, { sort: { burnedAt: -1 }, limit })
      .toArray();
  }

  // Update burn (for adding transaction signature after confirmation)
  static async updateBurn(burnId: string, updates: Partial<BurnDoc>): Promise<void> {
    const burns = await this.getBurnsCollection();
    await burns.updateOne(
      { _id: new ObjectId(burnId) },
      { $set: updates }
    );
  }

  // Delete burn (for cleanup/admin purposes)
  static async deleteBurn(burnId: string): Promise<void> {
    const burns = await this.getBurnsCollection();
    const users = await this.getUsersCollection();
    const creators = await this.getCreatorsCollection();
    
    const burn = await burns.findOne({ _id: new ObjectId(burnId) });
    if (!burn) return;

    // Remove from burns collection
    await burns.deleteOne({ _id: new ObjectId(burnId) });

    // Remove from user's burns array and update stats
    await users.updateOne(
      { _id: burn.userId },
      {
        $pull: { burns: { burnId: new ObjectId(burnId) } },
        $inc: { 
          totalTokensBurned: -burn.amount,
          totalBurns: -1
        }
      }
    );

    // Update creator's total tokens burned
    await creators.updateOne(
      { _id: burn.creatorMint },
      {
        $inc: { totalTokensBurned: -burn.amount }
      }
    );
  }

}