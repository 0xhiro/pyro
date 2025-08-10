import { ObjectId } from 'mongodb';

export interface CreatorDoc {
  _id: string;            // mint as string
  name: string;
  iconUrl?: string;
  decimals?: number;
  symbol?: string;
  isLive?: boolean;
  currentSessionId?: ObjectId;
  createdAt: Date;
}

export interface SessionDoc {
  _id?: ObjectId;
  creatorMint: string;
  startTime: Date;
  endTime?: Date;
  isActive: boolean;
  totalBurns: number;
  participantCount: number;
}

export interface BurnDoc {
  _id?: ObjectId;
  creatorMint: string;
  wallet: string;
  amount: number;
  protocolFee: number;
  sessionId?: ObjectId;
  ts: Date;
}