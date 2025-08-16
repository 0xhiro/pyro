import { ObjectId } from 'mongodb';
import { connectToDatabase } from '../lib/mongo.js';
import { CommunityDoc, CreatorContribution, UserContribution, TokenDoc } from '../types/index.js';
import { CreatorService } from './CreatorService.js';
import { UserService } from './UserService.js';

export class CommunityService {
  private static async getCollection() {
    const db = await connectToDatabase();
    return db.collection<CommunityDoc>('communities');
  }

  // Create or get existing community for a token
  static async getOrCreateCommunity(token: TokenDoc): Promise<CommunityDoc> {
    const communities = await this.getCollection();
    
    // Try to find existing community by mint address (using mint as _id)
    let community = await communities.findOne({ _id: token.mint });
    
    if (!community) {
      // Ensure token has addedAt if not present
      const tokenWithAddedAt = {
        ...token,
        addedAt: token.addedAt || new Date()
      };
      
      // Create new community using mint as _id
      const newCommunity: CommunityDoc = {
        _id: token.mint,                    // Use mint address as ID
        name: token.name,                   // Add name field
        token: tokenWithAddedAt,
        totalAmountBurned: 0,
        totalBurnCount: 0,
        creatorContributions: [],
        userContributions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      };
      
      await communities.insertOne(newCommunity);
      community = newCommunity;
    }
    
    return community;
  }

  // Update community when a burn happens for token promotion
  static async updateCommunityFromBurn(
    promotedToken: TokenDoc,
    burnData: {
      userId: ObjectId;
      wallet: string;
      creatorMint: string;
      amount: number;
      burnedAt: Date;
    }
  ): Promise<void> {
    console.log('CommunityService: Starting updateCommunityFromBurn');
    console.log('Promoted token:', promotedToken);
    console.log('Burn data:', burnData);
    
    const communities = await this.getCollection();
    
    // Get or create the community
    console.log('Getting or creating community...');
    const community = await this.getOrCreateCommunity(promotedToken);
    console.log('Community:', community._id);
    
    // Get creator info
    console.log('Getting creator info for mint:', burnData.creatorMint);
    const creator = await CreatorService.getCreatorByMint(burnData.creatorMint);
    if (!creator) {
      console.error('Creator not found for mint:', burnData.creatorMint);
      throw new Error('Creator not found');
    }
    console.log('Creator found:', creator.tokenInfo.name);
    
    // Re-fetch the community to get the latest data including arrays
    const latestCommunity = await communities.findOne({ _id: community._id });
    if (!latestCommunity) {
      throw new Error('Community not found after creation');
    }
    
    // Prepare updates
    const now = new Date();
    
    // Update community totals
    console.log('Updating community totals...');
    const totalUpdateResult = await communities.updateOne(
      { _id: community._id },
      {
        $inc: {
          totalAmountBurned: burnData.amount,
          totalBurnCount: 1
        },
        $set: {
          updatedAt: now
        }
      }
    );
    console.log('Community totals update result:', totalUpdateResult.modifiedCount);
    
    // Update or add creator contribution
    const existingCreatorIndex = latestCommunity.creatorContributions.findIndex(
      c => c.creatorMint === burnData.creatorMint
    );
    
    console.log('Existing creator index:', existingCreatorIndex);
    console.log('Current creatorContributions:', JSON.stringify(latestCommunity.creatorContributions));
    
    if (existingCreatorIndex >= 0) {
      // Update existing creator contribution
      await communities.updateOne(
        { 
          _id: community._id,
          'creatorContributions.creatorMint': burnData.creatorMint
        },
        {
          $inc: {
            'creatorContributions.$.totalBurned': burnData.amount,
            'creatorContributions.$.burnCount': 1
          },
          $set: {
            'creatorContributions.$.lastBurnAt': burnData.burnedAt
          }
        }
      );
    } else {
      // Add new creator contribution
      const newCreatorContribution: CreatorContribution = {
        creatorMint: burnData.creatorMint,
        creatorName: creator.tokenInfo.name,
        creatorSymbol: creator.tokenInfo.symbol || creator.tokenInfo.ticker,
        totalBurned: burnData.amount,
        burnCount: 1,
        lastBurnAt: burnData.burnedAt
      };
      
      const creatorUpdateResult = await communities.updateOne(
        { _id: community._id },
        {
          $push: { creatorContributions: newCreatorContribution }
        }
      );
      console.log('Creator contribution added. Update result:', creatorUpdateResult.modifiedCount);
    }
    
    // Update or add user contribution
    const existingUserIndex = latestCommunity.userContributions.findIndex(
      u => u.userId.equals(burnData.userId)
    );
    
    console.log('Existing user index:', existingUserIndex);
    console.log('Current userContributions:', JSON.stringify(latestCommunity.userContributions));
    
    if (existingUserIndex >= 0) {
      // Update existing user contribution
      await communities.updateOne(
        { 
          _id: community._id,
          'userContributions.userId': burnData.userId
        },
        {
          $inc: {
            'userContributions.$.totalBurned': burnData.amount,
            'userContributions.$.burnCount': 1
          },
          $set: {
            'userContributions.$.lastBurnAt': burnData.burnedAt
          }
        }
      );
    } else {
      // Add new user contribution
      const newUserContribution: UserContribution = {
        userId: burnData.userId,
        wallet: burnData.wallet,
        totalBurned: burnData.amount,
        burnCount: 1,
        lastBurnAt: burnData.burnedAt
      };
      
      const userUpdateResult = await communities.updateOne(
        { _id: community._id },
        {
          $push: { userContributions: newUserContribution }
        }
      );
      console.log('User contribution added. Update result:', userUpdateResult.modifiedCount);
    }
    
    console.log('CommunityService: updateCommunityFromBurn completed successfully');
  }

  // Get all active communities
  static async getAllCommunities(limit?: number): Promise<CommunityDoc[]> {
    const communities = await this.getCollection();
    const options: any = {
      sort: { totalAmountBurned: -1 } // Sort by most burned
    };
    
    if (limit) {
      options.limit = limit;
    }
    
    return await communities.find({ isActive: true }, options).toArray();
  }

  // Get community by token mint
  static async getCommunityByTokenMint(tokenMint: string): Promise<CommunityDoc | null> {
    const communities = await this.getCollection();
    return await communities.findOne({ _id: tokenMint });
  }

  // Get community with detailed contributor info
  static async getCommunityDetails(tokenMint: string): Promise<{
    community: CommunityDoc;
    topCreators: CreatorContribution[];
    topUsers: (UserContribution & { user?: any })[];
  } | null> {
    const community = await this.getCommunityByTokenMint(tokenMint);
    if (!community) return null;
    
    // Sort contributors
    const topCreators = community.creatorContributions
      .sort((a, b) => b.totalBurned - a.totalBurned)
      .slice(0, 10);
    
    const topUserContributions = community.userContributions
      .sort((a, b) => b.totalBurned - a.totalBurned)
      .slice(0, 20);
    
    // Enhance user contributions with user data
    const topUsers = await Promise.all(
      topUserContributions.map(async (contribution) => {
        try {
          const user = await UserService.getUserById(contribution.userId.toString());
          return { ...contribution, user };
        } catch {
          return contribution;
        }
      })
    );
    
    return {
      community,
      topCreators,
      topUsers
    };
  }

  // Get communities where a specific creator has contributed
  static async getCommunitiesByCreator(creatorMint: string): Promise<CommunityDoc[]> {
    const communities = await this.getCollection();
    return await communities.find({
      'creatorContributions.creatorMint': creatorMint,
      isActive: true
    }).sort({ updatedAt: -1 }).toArray();
  }

  // Get communities where a specific user has contributed
  static async getCommunitiesByUser(userId: string): Promise<CommunityDoc[]> {
    if (!ObjectId.isValid(userId)) {
      return [];
    }
    
    const communities = await this.getCollection();
    return await communities.find({
      'userContributions.userId': new ObjectId(userId),
      isActive: true
    }).sort({ updatedAt: -1 }).toArray();
  }

  // Get leaderboard for a specific community
  static async getCommunityLeaderboard(tokenMint: string): Promise<{
    creators: CreatorContribution[];
    users: (UserContribution & { user?: any })[];
  } | null> {
    const community = await this.getCommunityByTokenMint(tokenMint);
    if (!community) return null;
    
    const creators = community.creatorContributions
      .sort((a, b) => b.totalBurned - a.totalBurned);
    
    const userContributions = community.userContributions
      .sort((a, b) => b.totalBurned - a.totalBurned);
    
    // Enhance with user data
    const users = await Promise.all(
      userContributions.map(async (contribution) => {
        try {
          const user = await UserService.getUserById(contribution.userId.toString());
          return { ...contribution, user };
        } catch {
          return contribution;
        }
      })
    );
    
    return { creators, users };
  }

  // Deactivate a community
  static async deactivateCommunity(tokenMint: string): Promise<boolean> {
    const communities = await this.getCollection();
    const result = await communities.updateOne(
      { _id: tokenMint },
      { 
        $set: { 
          isActive: false,
          updatedAt: new Date()
        } 
      }
    );
    
    return result.modifiedCount > 0;
  }

  // Get community statistics
  static async getCommunityStats(): Promise<{
    totalCommunities: number;
    totalTokensBurned: number;
    totalBurns: number;
    activeUsers: number;
    activeCreators: number;
  }> {
    const communities = await this.getCollection();
    
    const stats = await communities.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalCommunities: { $sum: 1 },
          totalTokensBurned: { $sum: '$totalAmountBurned' },
          totalBurns: { $sum: '$totalBurnCount' },
          allUsers: { $push: '$userContributions' },
          allCreators: { $push: '$creatorContributions' }
        }
      },
      {
        $project: {
          totalCommunities: 1,
          totalTokensBurned: 1,
          totalBurns: 1,
          activeUsers: {
            $size: {
              $setUnion: {
                $reduce: {
                  input: '$allUsers',
                  initialValue: [],
                  in: {
                    $concatArrays: [
                      '$$value',
                      { $map: { input: '$$this', as: 'user', in: '$$user.userId' } }
                    ]
                  }
                }
              }
            }
          },
          activeCreators: {
            $size: {
              $setUnion: {
                $reduce: {
                  input: '$allCreators',
                  initialValue: [],
                  in: {
                    $concatArrays: [
                      '$$value',
                      { $map: { input: '$$this', as: 'creator', in: '$$creator.creatorMint' } }
                    ]
                  }
                }
              }
            }
          }
        }
      }
    ]).toArray();
    
    return stats[0] || {
      totalCommunities: 0,
      totalTokensBurned: 0,
      totalBurns: 0,
      activeUsers: 0,
      activeCreators: 0
    };
  }
}