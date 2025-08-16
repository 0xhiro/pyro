import { ObjectId } from 'mongodb';
import { connectToDatabase } from '../lib/mongo.js';
import { TokenDoc } from '../types/index.js';

export class TokenService {
  private static async getCollection() {
    const db = await connectToDatabase();
    return db.collection<TokenDoc>('tokens');
  }

  static async createToken(tokenData: {
    icon: string;
    ticker: string;
    dex: string;
    url: string;
    name: string;
    mint_address: string;
  }): Promise<TokenDoc> {
    const tokens = await this.getCollection();
    
    // Check if token with this mint address already exists
    const existingToken = await tokens.findOne({ mint_address: tokenData.mint_address });
    if (existingToken) {
      throw new Error('Token with this mint address already exists');
    }

    const token: TokenDoc = {
      ...tokenData,
      createdAt: new Date()
    };

    const result = await tokens.insertOne(token);
    return { ...token, _id: result.insertedId };
  }

  static async getTokenById(tokenId: string): Promise<TokenDoc | null> {
    if (!ObjectId.isValid(tokenId)) {
      return null;
    }
    const tokens = await this.getCollection();
    return tokens.findOne({ _id: new ObjectId(tokenId) });
  }

  static async getTokenByMintAddress(mint_address: string): Promise<TokenDoc | null> {
    const tokens = await this.getCollection();
    return tokens.findOne({ mint_address });
  }

  static async getAllTokens(page: number = 1, limit: number = 20): Promise<TokenDoc[]> {
    const tokens = await this.getCollection();
    const skip = (page - 1) * limit;
    
    return tokens.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
  }

  static async updateToken(tokenId: string, updateData: Partial<TokenDoc>): Promise<TokenDoc | null> {
    if (!ObjectId.isValid(tokenId)) {
      throw new Error('Invalid token ID');
    }

    const tokens = await this.getCollection();
    
    // Remove fields that shouldn't be updated
    const { _id, createdAt, ...allowedUpdates } = updateData;
    
    const result = await tokens.updateOne(
      { _id: new ObjectId(tokenId) },
      { $set: allowedUpdates }
    );
    
    if (result.matchedCount === 0) {
      throw new Error('Token not found');
    }
    
    return this.getTokenById(tokenId);
  }

  static async deleteToken(tokenId: string): Promise<boolean> {
    if (!ObjectId.isValid(tokenId)) {
      throw new Error('Invalid token ID');
    }

    const tokens = await this.getCollection();
    const result = await tokens.deleteOne({ _id: new ObjectId(tokenId) });
    return result.deletedCount > 0;
  }

  static async searchTokens(searchQuery: string, page: number = 1, limit: number = 20): Promise<TokenDoc[]> {
    const tokens = await this.getCollection();
    const skip = (page - 1) * limit;
    
    const filter = {
      $or: [
        { name: { $regex: searchQuery, $options: 'i' } },
        { ticker: { $regex: searchQuery, $options: 'i' } },
        { mint_address: { $regex: searchQuery, $options: 'i' } }
      ]
    };
    
    return tokens.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
  }
}