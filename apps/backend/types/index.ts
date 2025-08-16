import { ObjectId } from 'mongodb';

export interface TokenInfo {
  name: string;
  icon: string;
  ticker: string;
  symbol?: string;
  decimals?: number;
  mint_address: string;
}

export interface CreatorDoc {
  _id: string;            // mint as string
  tokenInfo: TokenInfo;   // embedded token object
  streamerUsername?: string;
  streamUrl?: string;
  dexUrl?: string;
  isLive?: boolean;
  currentSessionId?: ObjectId;
  createdAt: Date;
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

// Token information for promoted tokens (full token object)
export interface TokenDoc {
  _id?: ObjectId;
  mint: string;                       // Token mint address
  name: string;
  symbol: string;
  ticker?: string;
  iconUrl?: string;
  decimals: number;
  marketCap?: number;
  dexUrl?: string;
  websiteUrl?: string;
  description?: string;
  addedAt?: Date;                     // When token was added to system
  createdAt?: Date;
  updatedAt?: Date;
}

// Individual burn record - each burn transaction gets its own record
export interface BurnDoc {
  _id?: ObjectId;
  userId: ObjectId;                    // User performing the burn
  wallet: string;                      // Wallet address of the burner (for easy lookup)
  creatorMint: string;                 // Creator they are burning for
  promotedToken?: TokenDoc;            // Full token object they are trying to promote (optional)
  amount: number;                      // Amount of tokens burnt
  protocolFee: number;                // Protocol fee (calculated automatically)
  sessionId?: ObjectId;               // Session ID if applicable
  advertisingMetadata?: AdvertisingMetadata; // Optional advertising message
  burnedAt: Date;                     // Timestamp of burn
  txSignature: string;                // Solana transaction signature (required)
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

// Reference to a burn - stored in user's burns array
export interface UserBurnRef {
  burnId: ObjectId;                   // Reference to BurnDoc
  creatorMint: string;                // Creator they burned for
  amount: number;                     // Amount burnt
  burnedAt: Date;                     // When the burn happened
}

// Creator contribution to a community (token promotion)
export interface CreatorContribution {
  creatorMint: string;                // Creator who helped promote
  creatorName: string;                // Creator's name for easy display
  creatorSymbol: string;              // Creator's token symbol
  totalBurned: number;                // Total amount burned on their stream
  burnCount: number;                  // Number of burns on their stream
  lastBurnAt: Date;                   // Most recent burn
}

// User contribution to a community (token promotion)
export interface UserContribution {
  userId: ObjectId;                   // User who burned
  wallet: string;                     // User's wallet address
  totalBurned: number;                // Total amount they burned
  burnCount: number;                  // Number of burns they made
  lastBurnAt: Date;                   // Most recent burn
}

// Community document - tracks token promotion across all creators
export interface CommunityDoc {
  _id?: string;                       // Uses token mint address as ID
  name: string;                       // Token name for easy reference
  token: TokenDoc;                    // The token being promoted
  totalAmountBurned: number;          // Total amount burned to promote this token
  totalBurnCount: number;             // Total number of burns for this token
  creatorContributions: CreatorContribution[];  // Creators who helped promote
  userContributions: UserContribution[];        // Users who burned to promote
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
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
  
  // Burns performed by user
  burns: UserBurnRef[];
  
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