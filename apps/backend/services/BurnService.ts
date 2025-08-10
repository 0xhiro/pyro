import { ObjectId } from 'mongodb';
import { connectToDatabase } from '../lib/mongo';
import { BurnDoc } from '../types';
import { SessionService } from './SessionService';

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

    const doc: BurnDoc = {
      creatorMint: burnData.creatorMint,
      wallet: burnData.wallet,
      amount: burnData.amount,
      protocolFee,
      sessionId: validSessionId,
      ts: new Date(),
    };

    const result = await burns.insertOne(doc);

    // Update session stats if sessionId provided
    if (validSessionId) {
      await SessionService.updateSessionStats(validSessionId, burnData.amount);
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