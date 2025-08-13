import { ObjectId } from 'mongodb';
import { connectToDatabase } from '../lib/mongo.js';
import { CreatorDoc } from '../types/index.js';

export class CreatorService {
  private static async getCollection() {
    const db = await connectToDatabase();
    return db.collection<CreatorDoc>('creators');
  }

  static async getAllCreators(): Promise<CreatorDoc[]> {
    const creators = await this.getCollection();
    return creators.find({}).toArray();
  }
  
  static async getCreatorById(mint: string): Promise<CreatorDoc | null> {
    const creators = await this.getCollection();
    return creators.findOne({ _id: mint });
  }

  static async createCreator(creatorData: {
    mint: string;
    name: string;
    iconUrl?: string;
    decimals?: number;
    symbol?: string;
    streamerUsername?: string;
    streamUrl?: string;
    ticker?: string;
    marketCap?: number;
    dexUrl?: string;
  }): Promise<CreatorDoc> {
    const creators = await this.getCollection();
    
    const doc: CreatorDoc = {
      _id: creatorData.mint,
      name: creatorData.name,
      iconUrl: creatorData.iconUrl,
      decimals: creatorData.decimals,
      symbol: creatorData.symbol,
      isLive: false,
      createdAt: new Date(),
      streamerUsername: creatorData.streamerUsername,
      streamUrl: creatorData.streamUrl,
      ticker: creatorData.ticker,
      marketCap: creatorData.marketCap,
      dexUrl: creatorData.dexUrl,
      totalTokensBurned: 0,
    };

    await creators.insertOne(doc);
    return doc;
  }

  static async updateCreatorStatus(mint: string, isLive: boolean): Promise<void> {
    const creators = await this.getCollection();
    const sessions = (await connectToDatabase()).collection('sessions');

    const creator = await creators.findOne({ _id: mint });
    if (!creator) {
      throw new Error('Creator not found');
    }

    const updateDoc: Partial<CreatorDoc> = { isLive };

    // If going offline, end current session
    if (!isLive && creator.currentSessionId) {
      await sessions.updateOne(
        { _id: creator.currentSessionId },
        { 
          $set: { 
            isActive: false, 
            endTime: new Date() 
          } 
        }
      );
      updateDoc.currentSessionId = undefined;
    }

    await creators.updateOne(
      { _id: mint },
      { 
        $set: updateDoc,
        ...(updateDoc.currentSessionId === undefined ? { $unset: { currentSessionId: "" } } : {})
      }
    );
  }

  static async setCurrentSession(mint: string, sessionId: ObjectId): Promise<void> {
    const creators = await this.getCollection();
    await creators.updateOne(
      { _id: mint },
      { 
        $set: { 
          isLive: true,
          currentSessionId: sessionId
        } 
      }
    );
  }

  static async clearCurrentSession(mint: string): Promise<void> {
    const creators = await this.getCollection();
    await creators.updateOne(
      { _id: mint },
      { 
        $set: { isLive: false },
        $unset: { currentSessionId: "" }
      }
    );
  }

  static async updateCreatorInfo(mint: string, updateData: {
    name?: string;
    iconUrl?: string;
    streamerUsername?: string;
    streamUrl?: string;
    ticker?: string;
    marketCap?: number;
    dexUrl?: string;
  }): Promise<void> {
    const creators = await this.getCollection();
    await creators.updateOne(
      { _id: mint },
      { $set: updateData }
    );
  }

  static async updateTotalTokensBurned(mint: string): Promise<void> {
    const db = await connectToDatabase();
    const burns = db.collection('burns');
    const creators = await this.getCollection();

    // Calculate total tokens burned for this creator
    const result = await burns.aggregate([
      { $match: { creatorMint: mint } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]).toArray();

    const totalBurned = result.length > 0 ? result[0].total : 0;

    await creators.updateOne(
      { _id: mint },
      { $set: { totalTokensBurned: totalBurned } }
    );
  }

  static async incrementTotalTokensBurned(mint: string, amount: number): Promise<void> {
    const creators = await this.getCollection();
    await creators.updateOne(
      { _id: mint },
      { $inc: { totalTokensBurned: amount } }
    );
  }
}