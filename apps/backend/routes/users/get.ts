import { Router } from 'express';
import { UserService } from '../../services/UserService';

const router = Router();

// GET /users - Get all users with pagination and search
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const search = req.query.search as string;

    const users = await UserService.getAllUsers(page, limit, search);
    
    res.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        hasMore: users.length === limit
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users'
    });
  }
});

// GET /users/top - Get top users by burn stats
router.get('/top', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    const users = await UserService.getTopUsers(limit);
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error fetching top users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch top users'
    });
  }
});

// GET /users/wallet/:wallet - Get user by wallet address
router.get('/wallet/:wallet', async (req, res) => {
  try {
    const { wallet } = req.params;
    const user = await UserService.getUserByWallet(wallet);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error fetching user by wallet:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user'
    });
  }
});

// GET /users/username/:username - Get user by username
router.get('/username/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const user = await UserService.getUserByUsername(username);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error fetching user by username:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user'
    });
  }
});

// GET /users/:id - Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await UserService.getUserById(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user'
    });
  }
});

// GET /users/:id/tokens - Get user's tokens
router.get('/:id/tokens', async (req, res) => {
  try {
    const { id } = req.params;
    const tokens = await UserService.getUserTokens(id);
    
    res.json({
      success: true,
      data: tokens
    });
  } catch (error) {
    console.error('Error fetching user tokens:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user tokens'
    });
  }
});

// GET /users/:id/followers - Get user's followers
router.get('/:id/followers', async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    
    const followers = await UserService.getFollowers(id, page, limit);
    
    res.json({
      success: true,
      data: followers,
      pagination: {
        page,
        limit,
        hasMore: followers.length === limit
      }
    });
  } catch (error) {
    console.error('Error fetching followers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch followers'
    });
  }
});

// GET /users/:id/following - Get users that this user follows
router.get('/:id/following', async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    
    const following = await UserService.getFollowing(id, page, limit);
    
    res.json({
      success: true,
      data: following,
      pagination: {
        page,
        limit,
        hasMore: following.length === limit
      }
    });
  } catch (error) {
    console.error('Error fetching following:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch following'
    });
  }
});

// GET /users/:id/burn-stats - Get user's burn statistics
router.get('/:id/burn-stats', async (req, res) => {
  try {
    const { id } = req.params;
    const burnStats = await UserService.getUserBurnStats(id);
    
    res.json({
      success: true,
      data: burnStats
    });
  } catch (error) {
    console.error('Error fetching burn stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch burn stats'
    });
  }
});

// GET /users/:id/burn-stats/:creatorMint - Get user's burn stats for specific creator
router.get('/:id/burn-stats/:creatorMint', async (req, res) => {
  try {
    const { id, creatorMint } = req.params;
    const stats = await UserService.getUserCreatorStats(id, creatorMint);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching creator burn stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch creator burn stats'
    });
  }
});

// GET /users/by-token/:tokenMint - Get users who promote a specific token
router.get('/by-token/:tokenMint', async (req, res) => {
  try {
    const { tokenMint } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    
    const users = await UserService.getUsersByToken(tokenMint, page, limit);
    
    res.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        hasMore: users.length === limit
      }
    });
  } catch (error) {
    console.error('Error fetching users by token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users by token'
    });
  }
});

// GET /users/:id/creator-burns - Get all creator tokens burned by a user (simple)
router.get('/:id/creator-burns', async (req, res) => {
  try {
    const { id } = req.params;
    const creatorTokensBurned = await UserService.getUserCreatorTokensBurned(id);
    
    res.json({
      success: true,
      data: creatorTokensBurned,
      summary: {
        totalCreators: creatorTokensBurned.length,
        totalBurned: creatorTokensBurned.reduce((sum, item) => sum + item.totalBurned, 0),
        totalBurns: creatorTokensBurned.reduce((sum, item) => sum + item.burnCount, 0)
      }
    });
  } catch (error) {
    console.error('Error fetching user creator burns:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user creator burns'
    });
  }
});

// GET /users/:id/creator-burns/detailed - Get detailed creator tokens burned by a user
router.get('/:id/creator-burns/detailed', async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const creatorMint = req.query.creatorMint as string;
    const sortBy = req.query.sortBy as 'totalBurned' | 'burnCount' | 'lastBurnAt' || 'totalBurned';
    const sortOrder = req.query.sortOrder as 'asc' | 'desc' || 'desc';
    
    const result = await UserService.getUserCreatorTokensBurnedDetailed(id, {
      creatorMint,
      page,
      limit,
      sortBy,
      sortOrder
    });
    
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      summary: {
        totalCreators: result.pagination.total,
        totalBurned: result.data.reduce((sum, item) => sum + item.totalBurned, 0),
        totalBurns: result.data.reduce((sum, item) => sum + item.burnCount, 0)
      }
    });
  } catch (error) {
    console.error('Error fetching detailed user creator burns:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch detailed user creator burns'
    });
  }
});

// GET /users/wallet/:wallet/creator-burns - Get creator burns by wallet address (for non-registered users)
router.get('/wallet/:wallet/creator-burns', async (req, res) => {
  try {
    const { wallet } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const creatorMint = req.query.creatorMint as string;
    
    const creatorTokensBurned = await UserService.getWalletCreatorTokensBurned(wallet, {
      creatorMint,
      page,
      limit
    });
    
    res.json({
      success: true,
      data: creatorTokensBurned.data,
      pagination: creatorTokensBurned.pagination,
      summary: {
        totalCreators: creatorTokensBurned.pagination.total,
        totalBurned: creatorTokensBurned.data.reduce((sum, item) => sum + item.totalBurned, 0),
        totalBurns: creatorTokensBurned.data.reduce((sum, item) => sum + item.burnCount, 0)
      }
    });
  } catch (error) {
    console.error('Error fetching wallet creator burns:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch wallet creator burns'
    });
  }
});

export { router as getRoutes };
