import { ObjectId } from 'mongodb';
import { connectToDatabase } from '../lib/mongo';
import { UserDoc, UserTokenDoc, UserFollowDoc, UserBurnStatsDoc } from '../types';

export class UserService {
  private static async getCollection() {
    const db = await connectToDatabase();
    return db.collection<UserDoc>('users');
  }

  private static async getFollowsCollection() {
    const db = await connectToDatabase();
    return db.collection<UserFollowDoc>('user_follows');
  }

  private static async getBurnStatsCollection() {
    const db = await connectToDatabase();
    return db.collection<UserBurnStatsDoc>('user_burn_stats');
  }

  // User CRUD operations
  static async createUser(userData: {
    wallet: string;
    username?: string;
    displayName?: string;
    bio?: string;
    profileImageUrl?: string;
    websiteUrl?: string;
    twitterHandle?: string;
    telegramHandle?: string;
    discordHandle?: string;
  }): Promise<UserDoc> {
    const users = await this.getCollection();
    
    // Check if user already exists
    const existingUser = await users.findOne({ wallet: userData.wallet });
    if (existingUser) {
      throw new Error('User already exists with this wallet');
    }

    // Check if username is taken (if provided)
    if (userData.username) {
      const usernameExists = await users.findOne({ username: userData.username });
      if (usernameExists) {
        throw new Error('Username already taken');
      }
    }

    const user: UserDoc = {
      wallet: userData.wallet,
      username: userData.username,
      displayName: userData.displayName || userData.username || 'Anonymous',
      bio: userData.bio || '',
      profileImageUrl: userData.profileImageUrl,
      websiteUrl: userData.websiteUrl,
      twitterHandle: userData.twitterHandle,
      telegramHandle: userData.telegramHandle,
      discordHandle: userData.discordHandle,
      tokens: [],
      following: [],
      followers: [],
      totalTokensBurned: 0,
      totalBurns: 0,
      joinedAt: new Date(),
      lastActiveAt: new Date(),
      isPublic: true,
      allowDirectMessages: true,
    };

    const result = await users.insertOne(user);
    return { ...user, _id: result.insertedId };
  }

  static async getUserByWallet(wallet: string): Promise<UserDoc | null> {
    const users = await this.getCollection();
    return users.findOne({ wallet });
  }

  static async getUserById(userId: string): Promise<UserDoc | null> {
    if (!ObjectId.isValid(userId)) {
      return null;
    }
    const users = await this.getCollection();
    return users.findOne({ _id: new ObjectId(userId) });
  }

  static async getUserByUsername(username: string): Promise<UserDoc | null> {
    const users = await this.getCollection();
    return users.findOne({ username });
  }

  static async updateUser(userId: string, updateData: Partial<UserDoc>): Promise<UserDoc | null> {
    if (!ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }

    const users = await this.getCollection();
    
    // Check if username is being updated and if it's available
    if (updateData.username) {
      const existingUser = await users.findOne({ 
        username: updateData.username,
        _id: { $ne: new ObjectId(userId) }
      });
      if (existingUser) {
        throw new Error('Username already taken');
      }
    }

    const updateDoc = {
      ...updateData,
      lastActiveAt: new Date()
    };
    
    const result = await users.updateOne(
      { _id: new ObjectId(userId) },
      { $set: updateDoc }
    );
    
    if (result.matchedCount === 0) {
      throw new Error('User not found');
    }
    
    return this.getUserById(userId);
  }

  static async deleteUser(userId: string): Promise<boolean> {
    if (!ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }

    const users = await this.getCollection();
    const follows = await this.getFollowsCollection();
    const burnStats = await this.getBurnStatsCollection();
    
    // Delete user and all related data
    const userObjectId = new ObjectId(userId);
    
    await follows.deleteMany({
      $or: [
        { followerId: userObjectId },
        { followingId: userObjectId }
      ]
    });
    
    await burnStats.deleteMany({ userId: userObjectId });
    
    const result = await users.deleteOne({ _id: userObjectId });
    return result.deletedCount > 0;
  }

  // User discovery and search
  static async getAllUsers(page: number = 1, limit: number = 20, searchQuery?: string): Promise<UserDoc[]> {
    const users = await this.getCollection();
    const skip = (page - 1) * limit;
    
    let filter: any = { isPublic: true };
    
    if (searchQuery) {
      filter = {
        ...filter,
        $or: [
          { username: { $regex: searchQuery, $options: 'i' } },
          { displayName: { $regex: searchQuery, $options: 'i' } },
          { bio: { $regex: searchQuery, $options: 'i' } }
        ]
      };
    }
    
    return users.find(filter)
      .sort({ lastActiveAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
  }

  static async getTopUsers(limit: number = 10): Promise<UserDoc[]> {
    const users = await this.getCollection();
    
    return users.find({ isPublic: true })
      .sort({ totalTokensBurned: -1, totalBurns: -1 })
      .limit(limit)
      .toArray();
  }

  // User token management
  static async addToken(userId: string, tokenData: Omit<UserTokenDoc, '_id' | 'addedAt'>): Promise<void> {
    if (!ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }

    const users = await this.getCollection();
    
    // Check if token already exists for this user
    const user = await users.findOne({
      _id: new ObjectId(userId),
      'tokens.mint': tokenData.mint
    });
    
    if (user) {
      throw new Error('Token already added to user profile');
    }

    const token: UserTokenDoc = {
      _id: new ObjectId(),
      ...tokenData,
      addedAt: new Date()
    };

    await users.updateOne(
      { _id: new ObjectId(userId) },
      { 
        $push: { tokens: token },
        $set: { lastActiveAt: new Date() }
      }
    );
  }

  static async updateToken(userId: string, tokenMint: string, updateData: Partial<UserTokenDoc>): Promise<void> {
    if (!ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }

    const users = await this.getCollection();
    
    const updateFields: any = {};
    Object.keys(updateData).forEach(key => {
      if (key !== '_id' && key !== 'mint' && key !== 'addedAt') {
        updateFields[`tokens.$.${key}`] = (updateData as any)[key];
      }
    });

    const result = await users.updateOne(
      { 
        _id: new ObjectId(userId),
        'tokens.mint': tokenMint
      },
      { 
        $set: {
          ...updateFields,
          lastActiveAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      throw new Error('User or token not found');
    }
  }

  static async removeToken(userId: string, tokenMint: string): Promise<void> {
    if (!ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }

    const users = await this.getCollection();
    
    const result = await users.updateOne(
      { _id: new ObjectId(userId) },
      { 
        $pull: { tokens: { mint: tokenMint } },
        $set: { lastActiveAt: new Date() }
      }
    );

    if (result.matchedCount === 0) {
      throw new Error('User not found');
    }
  }

  static async getUserTokens(userId: string): Promise<UserTokenDoc[]> {
    if (!ObjectId.isValid(userId)) {
      return [];
    }

    const users = await this.getCollection();
    const user = await users.findOne({ _id: new ObjectId(userId) });
    
    return user?.tokens || [];
  }

  // Follow system
  static async followUser(followerId: string, followingId: string): Promise<void> {
    if (!ObjectId.isValid(followerId) || !ObjectId.isValid(followingId)) {
      throw new Error('Invalid user ID');
    }

    if (followerId === followingId) {
      throw new Error('Cannot follow yourself');
    }

    const users = await this.getCollection();
    const follows = await this.getFollowsCollection();
    
    // Check if both users exist
    const [follower, following] = await Promise.all([
      users.findOne({ _id: new ObjectId(followerId) }),
      users.findOne({ _id: new ObjectId(followingId) })
    ]);

    if (!follower || !following) {
      throw new Error('One or both users not found');
    }

    // Check if already following
    const existingFollow = await follows.findOne({
      followerId: new ObjectId(followerId),
      followingId: new ObjectId(followingId)
    });

    if (existingFollow) {
      throw new Error('Already following this user');
    }

    // Create follow relationship
    const followDoc: UserFollowDoc = {
      followerId: new ObjectId(followerId),
      followingId: new ObjectId(followingId),
      createdAt: new Date()
    };

    await follows.insertOne(followDoc);

    // Update users' following/followers arrays
    await Promise.all([
      users.updateOne(
        { _id: new ObjectId(followerId) },
        { 
          $addToSet: { following: new ObjectId(followingId) },
          $set: { lastActiveAt: new Date() }
        }
      ),
      users.updateOne(
        { _id: new ObjectId(followingId) },
        { $addToSet: { followers: new ObjectId(followerId) } }
      )
    ]);
  }

  static async unfollowUser(followerId: string, followingId: string): Promise<void> {
    if (!ObjectId.isValid(followerId) || !ObjectId.isValid(followingId)) {
      throw new Error('Invalid user ID');
    }

    const users = await this.getCollection();
    const follows = await this.getFollowsCollection();
    
    // Remove follow relationship
    const result = await follows.deleteOne({
      followerId: new ObjectId(followerId),
      followingId: new ObjectId(followingId)
    });

    if (result.deletedCount === 0) {
      throw new Error('Follow relationship not found');
    }

    // Update users' following/followers arrays
    await Promise.all([
      users.updateOne(
        { _id: new ObjectId(followerId) },
        { 
          $pull: { following: new ObjectId(followingId) },
          $set: { lastActiveAt: new Date() }
        }
      ),
      users.updateOne(
        { _id: new ObjectId(followingId) },
        { $pull: { followers: new ObjectId(followerId) } }
      )
    ]);
  }

  static async getFollowers(userId: string, page: number = 1, limit: number = 20): Promise<UserDoc[]> {
    if (!ObjectId.isValid(userId)) {
      return [];
    }

    const users = await this.getCollection();
    const user = await users.findOne({ _id: new ObjectId(userId) });
    
    if (!user || !user.followers.length) {
      return [];
    }

    const skip = (page - 1) * limit;
    const followerIds = user.followers.slice(skip, skip + limit);
    
    return users.find({
      _id: { $in: followerIds },
      isPublic: true
    }).toArray();
  }

  static async getFollowing(userId: string, page: number = 1, limit: number = 20): Promise<UserDoc[]> {
    if (!ObjectId.isValid(userId)) {
      return [];
    }

    const users = await this.getCollection();
    const user = await users.findOne({ _id: new ObjectId(userId) });
    
    if (!user || !user.following.length) {
      return [];
    }

    const skip = (page - 1) * limit;
    const followingIds = user.following.slice(skip, skip + limit);
    
    return users.find({
      _id: { $in: followingIds },
      isPublic: true
    }).toArray();
  }

  static async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    if (!ObjectId.isValid(followerId) || !ObjectId.isValid(followingId)) {
      return false;
    }

    const follows = await this.getFollowsCollection();
    const follow = await follows.findOne({
      followerId: new ObjectId(followerId),
      followingId: new ObjectId(followingId)
    });

    return !!follow;
  }

  // User statistics and burn tracking
  static async updateUserBurnStats(userId: string, creatorMint: string, amount: number): Promise<void> {
    if (!ObjectId.isValid(userId)) {
      return;
    }

    const users = await this.getCollection();
    const burnStats = await this.getBurnStatsCollection();
    const userObjectId = new ObjectId(userId);

    // Update user's overall stats
    await users.updateOne(
      { _id: userObjectId },
      { 
        $inc: { 
          totalTokensBurned: amount,
          totalBurns: 1
        },
        $set: { lastActiveAt: new Date() }
      }
    );

    // Update or create user burn stats for this creator
    const existingStats = await burnStats.findOne({
      userId: userObjectId,
      creatorMint
    });

    if (existingStats) {
      await burnStats.updateOne(
        { _id: existingStats._id },
        { 
          $inc: { 
            tokensBurned: amount,
            burnCount: 1
          },
          $set: { lastBurnAt: new Date() }
        }
      );
    } else {
      const statsDoc: UserBurnStatsDoc = {
        userId: userObjectId,
        creatorMint,
        tokensBurned: amount,
        burnCount: 1,
        firstBurnAt: new Date(),
        lastBurnAt: new Date()
      };
      await burnStats.insertOne(statsDoc);
    }
  }

  static async getUserBurnStats(userId: string): Promise<UserBurnStatsDoc[]> {
    if (!ObjectId.isValid(userId)) {
      return [];
    }

    const burnStats = await this.getBurnStatsCollection();
    return burnStats.find({ userId: new ObjectId(userId) })
      .sort({ tokensBurned: -1 })
      .toArray();
  }

  static async getUserCreatorStats(userId: string, creatorMint: string): Promise<UserBurnStatsDoc | null> {
    if (!ObjectId.isValid(userId)) {
      return null;
    }

    const burnStats = await this.getBurnStatsCollection();
    return burnStats.findOne({
      userId: new ObjectId(userId),
      creatorMint
    });
  }

  // User discovery by tokens
  static async getUsersByToken(tokenMint: string, page: number = 1, limit: number = 20): Promise<UserDoc[]> {
    const users = await this.getCollection();
    const skip = (page - 1) * limit;
    
    return users.find({
      'tokens.mint': tokenMint,
      isPublic: true
    })
      .sort({ lastActiveAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
  }

  // Get all creator tokens burned by a user with details
  static async getUserCreatorTokensBurned(userId: string): Promise<{
    creatorMint: string;
    creatorInfo: {
      name: string;
      symbol?: string;
      iconUrl?: string;
      ticker?: string;
      decimals?: number;
    };
    totalBurned: number;
    burnCount: number;
    firstBurnAt: Date;
    lastBurnAt: Date;
  }[]> {
    if (!ObjectId.isValid(userId)) {
      return [];
    }

    const db = await connectToDatabase();
    const burns = db.collection('burns');
    const creators = db.collection('creators');
    
    // Get all burns by this user aggregated by creator
    const userBurns = await burns.aggregate([
      { 
        $match: { 
          userId: new ObjectId(userId) 
        } 
      },
      {
        $group: {
          _id: '$creatorMint',
          totalBurned: { $sum: '$amount' },
          burnCount: { $sum: 1 },
          firstBurnAt: { $min: '$ts' },
          lastBurnAt: { $max: '$ts' }
        }
      },
      {
        $project: {
          creatorMint: '$_id',
          totalBurned: 1,
          burnCount: 1,
          firstBurnAt: 1,
          lastBurnAt: 1,
          _id: 0
        }
      },
      {
        $sort: { totalBurned: -1 }
      }
    ]).toArray();

    // Get creator information for each burned creator token
    const creatorMints = userBurns.map(burn => burn.creatorMint);
    const creatorsInfo = await creators.find({
      _id: { $in: creatorMints }
    }).toArray();

    // Create a map for quick creator lookup
    const creatorMap = new Map();
    creatorsInfo.forEach(creator => {
      creatorMap.set(creator._id, {
        name: creator.name,
        symbol: creator.symbol,
        iconUrl: creator.iconUrl,
        ticker: creator.ticker,
        decimals: creator.decimals
      });
    });

    // Combine burn data with creator information
    return userBurns
      .filter(burn => creatorMap.has(burn.creatorMint)) // Only include creator tokens
      .map(burn => ({
        creatorMint: burn.creatorMint,
        creatorInfo: creatorMap.get(burn.creatorMint),
        totalBurned: burn.totalBurned,
        burnCount: burn.burnCount,
        firstBurnAt: burn.firstBurnAt,
        lastBurnAt: burn.lastBurnAt
      }));
  }

  // Get creator tokens burned by a user with optional filtering and pagination
  static async getUserCreatorTokensBurnedDetailed(
    userId: string, 
    options: {
      creatorMint?: string;
      page?: number;
      limit?: number;
      sortBy?: 'totalBurned' | 'burnCount' | 'lastBurnAt';
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<{
    data: {
      creatorMint: string;
      creatorInfo: {
        name: string;
        symbol?: string;
        iconUrl?: string;
        ticker?: string;
        decimals?: number;
        totalTokensBurned?: number;
      };
      totalBurned: number;
      burnCount: number;
      firstBurnAt: Date;
      lastBurnAt: Date;
      burnHistory: {
        amount: number;
        timestamp: Date;
        sessionId?: string;
        promotedTokenMint?: string;
      }[];
    }[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      hasMore: boolean;
    };
  }> {
    if (!ObjectId.isValid(userId)) {
      return {
        data: [],
        pagination: { page: 1, limit: 20, total: 0, hasMore: false }
      };
    }

    const { 
      creatorMint, 
      page = 1, 
      limit = 20, 
      sortBy = 'totalBurned', 
      sortOrder = 'desc' 
    } = options;

    const db = await connectToDatabase();
    const burns = db.collection('burns');
    const creators = db.collection('creators');
    
    // Build match condition
    const matchCondition: any = { userId: new ObjectId(userId) };
    if (creatorMint) {
      matchCondition.creatorMint = creatorMint;
    }

    // Get aggregated burn data
    const pipeline = [
      { $match: matchCondition },
      {
        $group: {
          _id: '$creatorMint',
          totalBurned: { $sum: '$amount' },
          burnCount: { $sum: 1 },
          firstBurnAt: { $min: '$ts' },
          lastBurnAt: { $max: '$ts' },
          burns: {
            $push: {
              amount: '$amount',
              timestamp: '$ts',
              sessionId: '$sessionId',
              promotedTokenMint: '$promotedTokenMint'
            }
          }
        }
      },
      {
        $project: {
          creatorMint: '$_id',
          totalBurned: 1,
          burnCount: 1,
          firstBurnAt: 1,
          lastBurnAt: 1,
          burns: 1,
          _id: 0
        }
      }
    ];

    // Add sorting
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const sortStage: any = { $sort: { [sortBy]: sortDirection } };
    pipeline.push(sortStage);

    // Execute aggregation
    const allResults = await burns.aggregate(pipeline).toArray();
    
    // Filter to only include creator tokens
    const allCreatorMints = allResults.map(result => result.creatorMint);
    const creatorsInfo = await creators.find({
      _id: { $in: allCreatorMints }
    }).toArray();

    const creatorMap = new Map();
    creatorsInfo.forEach(creator => {
      creatorMap.set(creator._id, {
        name: creator.name,
        symbol: creator.symbol,
        iconUrl: creator.iconUrl,
        ticker: creator.ticker,
        decimals: creator.decimals,
        totalTokensBurned: creator.totalTokensBurned
      });
    });

    // Filter results to only include creator tokens
    const filteredResults = allResults.filter(result => 
      creatorMap.has(result.creatorMint)
    );

    // Apply pagination
    const total = filteredResults.length;
    const skip = (page - 1) * limit;
    const paginatedResults = filteredResults.slice(skip, skip + limit);

    // Format response
    const data = paginatedResults.map(result => ({
      creatorMint: result.creatorMint,
      creatorInfo: creatorMap.get(result.creatorMint),
      totalBurned: result.totalBurned,
      burnCount: result.burnCount,
      firstBurnAt: result.firstBurnAt,
      lastBurnAt: result.lastBurnAt,
      burnHistory: result.burns.sort((a: any, b: any) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
    }));

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        hasMore: skip + limit < total
      }
    };
  }

  // Get creator tokens burned by wallet address (for non-registered users)
  static async getWalletCreatorTokensBurned(
    wallet: string,
    options: {
      creatorMint?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{
    data: {
      creatorMint: string;
      creatorInfo: {
        name: string;
        symbol?: string;
        iconUrl?: string;
        ticker?: string;
        decimals?: number;
        totalTokensBurned?: number;
      };
      totalBurned: number;
      burnCount: number;
      firstBurnAt: Date;
      lastBurnAt: Date;
    }[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      hasMore: boolean;
    };
  }> {
    const { creatorMint, page = 1, limit = 20 } = options;

    const db = await connectToDatabase();
    const burns = db.collection('burns');
    const creators = db.collection('creators');
    
    // Build match condition
    const matchCondition: any = { wallet };
    if (creatorMint) {
      matchCondition.creatorMint = creatorMint;
    }

    // Get aggregated burn data for this wallet
    const allResults = await burns.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: '$creatorMint',
          totalBurned: { $sum: '$amount' },
          burnCount: { $sum: 1 },
          firstBurnAt: { $min: '$ts' },
          lastBurnAt: { $max: '$ts' }
        }
      },
      {
        $project: {
          creatorMint: '$_id',
          totalBurned: 1,
          burnCount: 1,
          firstBurnAt: 1,
          lastBurnAt: 1,
          _id: 0
        }
      },
      {
        $sort: { totalBurned: -1 }
      }
    ]).toArray();

    // Filter to only include creator tokens
    const allCreatorMints = allResults.map(result => result.creatorMint);
    const creatorsInfo = await creators.find({
      _id: { $in: allCreatorMints }
    }).toArray();

    const creatorMap = new Map();
    creatorsInfo.forEach(creator => {
      creatorMap.set(creator._id, {
        name: creator.name,
        symbol: creator.symbol,
        iconUrl: creator.iconUrl,
        ticker: creator.ticker,
        decimals: creator.decimals,
        totalTokensBurned: creator.totalTokensBurned
      });
    });

    // Filter results to only include creator tokens
    const filteredResults = allResults.filter(result => 
      creatorMap.has(result.creatorMint)
    );

    // Apply pagination
    const total = filteredResults.length;
    const skip = (page - 1) * limit;
    const paginatedResults = filteredResults.slice(skip, skip + limit);

    // Format response
    const data = paginatedResults.map(result => ({
      creatorMint: result.creatorMint,
      creatorInfo: creatorMap.get(result.creatorMint),
      totalBurned: result.totalBurned,
      burnCount: result.burnCount,
      firstBurnAt: result.firstBurnAt,
      lastBurnAt: result.lastBurnAt
    }));

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        hasMore: skip + limit < total
      }
    };
  }

  // Legacy method for backward compatibility
  static async updateTotalTokensBurnt(userId: string, amount: number): Promise<void> {
    if (!ObjectId.isValid(userId)) {
      return;
    }

    const users = await this.getCollection();
    await users.updateOne(
      { _id: new ObjectId(userId) },
      { 
        $inc: { totalTokensBurned: amount },
        $set: { lastActiveAt: new Date() }
      }
    );
  }
}