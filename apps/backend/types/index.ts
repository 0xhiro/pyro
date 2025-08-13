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
  // Enhanced streamer fields
  streamerUsername?: string;
  streamUrl?: string;
  ticker?: string;
  marketCap?: number;
  dexUrl?: string;
  totalTokensBurned?: number;
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

export interface AdvertisingMetadata {
  message?: string;
  websiteUrl?: string;
  imageUrl?: string;
  contact?: string;
}

export interface BurnDoc {
  _id?: ObjectId;
  creatorMint: string;
  wallet: string;
  amount: number;
  protocolFee: number;
  sessionId?: ObjectId;
  ts: Date;
  // Advertising metadata for leaderboard winners
  advertisingMetadata?: AdvertisingMetadata;
  // User promotion when burning
  userId?: ObjectId;
  promotedTokenMint?: string;
}

// User-related interfaces
export interface UserTokenDoc {
  _id?: ObjectId;
  mint: string;
  name: string;
  symbol: string;
  iconUrl?: string;
  decimals: number;
  ticker?: string;
  marketCap?: number;
  dexUrl?: string;
  websiteUrl?: string;
  description?: string;
  addedAt: Date;
}

export interface UserDoc {
  _id?: ObjectId;
  wallet: string;
  username?: string;
  displayName?: string;
  bio?: string;
  profileImageUrl?: string;
  websiteUrl?: string;
  twitterHandle?: string;
  telegramHandle?: string;
  discordHandle?: string;
  
  // User tokens for promotion
  tokens: UserTokenDoc[];
  
  // Social features
  following: ObjectId[];
  followers: ObjectId[];
  
  // Statistics
  totalTokensBurned: number;
  totalBurns: number;
  joinedAt: Date;
  lastActiveAt: Date;
  
  // Settings
  isPublic: boolean;
  allowDirectMessages: boolean;
}

export interface UserFollowDoc {
  _id?: ObjectId;
  followerId: ObjectId;
  followingId: ObjectId;
  createdAt: Date;
}

export interface UserBurnStatsDoc {
  _id?: ObjectId;
  userId: ObjectId;
  creatorMint: string;
  tokensBurned: number;
  burnCount: number;
  firstBurnAt: Date;
  lastBurnAt: Date;
}