import { Router } from 'express';
import { CommunityService } from '../../services/index.js';

const router = Router();

// PATCH /communities/:id - Update community
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    const { _id, tokenId, promotingUsers, createdAt, memberCount, ...allowedUpdates } = updateData;

    if (Object.keys(allowedUpdates).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields provided for update'
      });
    }

    const updatedCommunity = await CommunityService.updateCommunity(id, allowedUpdates);
    
    res.json({
      success: true,
      data: updatedCommunity,
      message: 'Community updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating community:', error);
    
    if (error.message.includes('Invalid community ID')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to update community'
    });
  }
});

// PATCH /communities/:id/status - Update community status (active/inactive)
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'isActive must be a boolean'
      });
    }

    await CommunityService.setCommunityStatus(id, isActive);
    
    res.json({
      success: true,
      message: `Community ${isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error: any) {
    console.error('Error updating community status:', error);
    
    if (error.message.includes('Invalid community ID')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to update community status'
    });
  }
});

// PATCH /communities/:id/sync-member-count - Sync member count with actual promoting users
router.patch('/:id/sync-member-count', async (req, res) => {
  try {
    const { id } = req.params;
    
    await CommunityService.updateMemberCount(id);
    
    res.json({
      success: true,
      message: 'Member count synchronized successfully'
    });
  } catch (error: any) {
    console.error('Error syncing member count:', error);
    
    if (error.message.includes('Invalid community ID')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to sync member count'
    });
  }
});

export { router as patchRoutes };