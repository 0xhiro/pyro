import { Router } from 'express';
import { CommunityService } from '../../services/index.js';

const router = Router();

// GET /communities - Get all active communities
router.get('/', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const communities = await CommunityService.getAllCommunities(limit);
    
    res.json({
      success: true,
      data: communities
    });
  } catch (error) {
    console.error('Error fetching communities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch communities'
    });
  }
});

// GET /communities/stats - Get community statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await CommunityService.getCommunityStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching community stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch community stats'
    });
  }
});

// GET /communities/token/:tokenMint - Get community by token mint
router.get('/token/:tokenMint', async (req, res) => {
  try {
    const { tokenMint } = req.params;
    const community = await CommunityService.getCommunityByTokenMint(tokenMint);
    
    if (!community) {
      return res.status(404).json({
        success: false,
        error: 'Community not found'
      });
    }
    
    res.json({
      success: true,
      data: community
    });
  } catch (error) {
    console.error('Error fetching community:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch community'
    });
  }
});

// GET /communities/token/:tokenMint/details - Get detailed community info
router.get('/token/:tokenMint/details', async (req, res) => {
  try {
    const { tokenMint } = req.params;
    const details = await CommunityService.getCommunityDetails(tokenMint);
    
    if (!details) {
      return res.status(404).json({
        success: false,
        error: 'Community not found'
      });
    }
    
    res.json({
      success: true,
      data: details
    });
  } catch (error) {
    console.error('Error fetching community details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch community details'
    });
  }
});

// GET /communities/token/:tokenMint/leaderboard - Get community leaderboard
router.get('/token/:tokenMint/leaderboard', async (req, res) => {
  try {
    const { tokenMint } = req.params;
    const leaderboard = await CommunityService.getCommunityLeaderboard(tokenMint);
    
    if (!leaderboard) {
      return res.status(404).json({
        success: false,
        error: 'Community not found'
      });
    }
    
    res.json({
      success: true,
      data: leaderboard
    });
  } catch (error) {
    console.error('Error fetching community leaderboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch community leaderboard'
    });
  }
});

// GET /communities/creator/:creatorMint - Get communities where creator contributed
router.get('/creator/:creatorMint', async (req, res) => {
  try {
    const { creatorMint } = req.params;
    const communities = await CommunityService.getCommunitiesByCreator(creatorMint);
    
    res.json({
      success: true,
      data: communities
    });
  } catch (error) {
    console.error('Error fetching creator communities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch creator communities'
    });
  }
});

// GET /communities/user/:userId - Get communities where user contributed
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const communities = await CommunityService.getCommunitiesByUser(userId);
    
    res.json({
      success: true,
      data: communities
    });
  } catch (error) {
    console.error('Error fetching user communities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user communities'
    });
  }
});

export { router as getRoutes };