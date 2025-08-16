import { Router } from 'express';
import { CommunityService } from '../../services/index.js';

const router = Router();

// POST /communities - Create a new community
router.post('/', async (req, res) => {
  try {
    const { name, description, iconUrl, tokenId } = req.body;

    // Validate required fields
    if (!name || !tokenId) {
      return res.status(400).json({
        success: false,
        error: 'name and tokenId are required'
      });
    }

    const community = await CommunityService.createCommunity({
      name,
      description,
      iconUrl,
      tokenId
    });

    res.status(201).json({
      success: true,
      data: community,
      message: 'Community created successfully'
    });
  } catch (error: any) {
    console.error('Error creating community:', error);
    
    if (error.message.includes('already exists') || error.message.includes('Token not found') || error.message.includes('Invalid token ID')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create community'
    });
  }
});

// POST /communities/:id/join - Join a community (add user to promoting users)
router.post('/:id/join', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required'
      });
    }

    await CommunityService.addPromotingUser(id, userId);

    res.json({
      success: true,
      message: 'Successfully joined community'
    });
  } catch (error: any) {
    console.error('Error joining community:', error);
    
    if (error.message.includes('Invalid') || 
        error.message.includes('not found') || 
        error.message.includes('already promoting')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to join community'
    });
  }
});

// POST /communities/:id/leave - Leave a community (remove user from promoting users)
router.post('/:id/leave', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required'
      });
    }

    await CommunityService.removePromotingUser(id, userId);

    res.json({
      success: true,
      message: 'Successfully left community'
    });
  } catch (error: any) {
    console.error('Error leaving community:', error);
    
    if (error.message.includes('Invalid') || 
        error.message.includes('not found') || 
        error.message.includes('not promoting')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to leave community'
    });
  }
});

// POST /communities/:id/check-membership - Check if user is promoting a community
router.post('/:id/check-membership', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required'
      });
    }

    const isPromoting = await CommunityService.isUserPromotingCommunity(id, userId);

    res.json({
      success: true,
      data: { isPromoting }
    });
  } catch (error) {
    console.error('Error checking community membership:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check community membership'
    });
  }
});

export { router as postRoutes };