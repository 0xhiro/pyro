import { ObjectId } from 'mongodb';
import { connectToDatabase } from '../lib/mongo';
import { BurnDoc, AdvertisingMetadata } from '../types';
import { SessionService } from './SessionService';
import { CreatorService } from './CreatorService';
import { UserService } from './UserService';

export class BurnService {
  private static readonly PROTOCOL_FEE_PERCENT = Number(process.env.PROTOCOL_FEE_PERCENT) || 2;

  private static async getCollection() {
    const db = await connectToDatabase();
    return db.collection<BurnDoc>('burns');
  }

  static async createBurn(burnData: {
    creatorMint: string;
    wallet: string;
    amount: number;
    sessionId?: string;
    advertisingMetadata?: AdvertisingMetadata;
    userId?: string;
    promotedTokenMint?: string;
  }): Promise<{ burnId: ObjectId; protocolFee: number }> {
    const burns = await this.getCollection();

    // Calculate protocol fee
    const protocolFee = (burnData.amount * this.PROTOCOL_FEE_PERCENT) / 100;

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

    // Validate userId if provided
    let validUserId = null;
    if (burnData.userId) {
      if (!ObjectId.isValid(burnData.userId)) {
        throw new Error('Invalid userId format');
      }
      
      const user = await UserService.getUserById(burnData.userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      validUserId = new ObjectId(burnData.userId);
    }

    // Validate promoted token if provided
    if (burnData.promotedTokenMint && !burnData.userId) {
      throw new Error('userId is required when promoting a token');
    }

    if (burnData.promotedTokenMint && burnData.userId) {
      const userTokens = await UserService.getUserTokens(burnData.userId);
      const hasToken = userTokens.some(token => token.mint === burnData.promotedTokenMint);
      if (!hasToken) {
        throw new Error('User does not have the promoted token in their portfolio');
      }
    }

    const doc: BurnDoc = {
      creatorMint: burnData.creatorMint,
      wallet: burnData.wallet,
      amount: burnData.amount,
      protocolFee,
      sessionId: validSessionId || undefined,
      ts: new Date(),
      advertisingMetadata: burnData.advertisingMetadata,
      userId: validUserId || undefined,
      promotedTokenMint: burnData.promotedTokenMint,
    };

    const result = await burns.insertOne(doc);

    // Update session stats if sessionId provided
    if (validSessionId) {
      await SessionService.updateSessionStats(validSessionId, burnData.amount);
    }

    // Update creator's total tokens burned
    await CreatorService.incrementTotalTokensBurned(burnData.creatorMint, burnData.amount);

    // Update user burn stats if userId provided
    if (validUserId) {
      await UserService.updateUserBurnStats(burnData.userId!, burnData.creatorMint, burnData.amount);
    }

    return {
      burnId: result.insertedId,
      protocolFee
    };
  }

  static async getBurnsByCreator(creatorMint: string, sessionId?: string) {
    const burns = await this.getCollection();
    
    const matchCondition: any = { creatorMint };
    if (sessionId && ObjectId.isValid(sessionId)) {
      matchCondition.sessionId = new ObjectId(sessionId);
    }

    return burns.find(matchCondition).toArray();
  }
}