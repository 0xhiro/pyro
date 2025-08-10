import { ObjectId } from 'mongodb';
import { connectToDatabase } from '../lib/mongo';
import { SessionDoc } from '../types';
import { CreatorService } from './CreatorService';

export class SessionService {
  private static async getCollection() {
    const db = await connectToDatabase();
    return db.collection<SessionDoc>('sessions');
  }

  static async getActiveSession(creatorMint: string): Promise<SessionDoc | null> {
    const sessions = await this.getCollection();
    return sessions.findOne({
      creatorMint,
      isActive: true
    });
  }

  static async getSessionById(sessionId: string): Promise<SessionDoc | null> {
    const sessions = await this.getCollection();
    return sessions.findOne({ _id: new ObjectId(sessionId) });
  }

  static async startSession(creatorMint: string): Promise<SessionDoc> {
    const sessions = await this.getCollection();

    // Verify creator exists
    const creator = await CreatorService.getCreatorById(creatorMint);
    if (!creator) {
      throw new Error('Creator not found');
    }

    // End any existing active sessions for this creator
    await sessions.updateMany(
      { creatorMint, isActive: true },
      { 
        $set: { 
          isActive: false, 
          endTime: new Date() 
        } 
      }
    );

    // Create new session
    const sessionDoc: SessionDoc = {
      creatorMint,
      startTime: new Date(),
      isActive: true,
      totalBurns: 0,
      participantCount: 0
    };

    const result = await sessions.insertOne(sessionDoc);
    const createdSession = { ...sessionDoc, _id: result.insertedId };
    
    // Update creator status
    await CreatorService.setCurrentSession(creatorMint, result.insertedId);

    return createdSession;
  }

  static async endSession(sessionId: string): Promise<void> {
    const sessions = await this.getCollection();

    const session = await sessions.findOne({ _id: new ObjectId(sessionId) });
    if (!session) {
      throw new Error('Session not found');
    }

    if (!session.isActive) {
      throw new Error('Session is already ended');
    }

    // End the session
    await sessions.updateOne(
      { _id: new ObjectId(sessionId) },
      { 
        $set: { 
          isActive: false, 
          endTime: new Date() 
        } 
      }
    );

    // Update creator status
    await CreatorService.clearCurrentSession(session.creatorMint);
  }

  static async updateSessionStats(sessionId: ObjectId, burnAmount: number): Promise<void> {
    const sessions = await this.getCollection();
    await sessions.updateOne(
      { _id: sessionId },
      { 
        $inc: { 
          totalBurns: burnAmount,
          participantCount: 1 
        } 
      }
    );
  }
}