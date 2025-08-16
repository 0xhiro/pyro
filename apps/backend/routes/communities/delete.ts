import { Router } from 'express';
import { CommunityService } from '../../services/index.js';

const router = Router();

// DELETE /communities/:id - Delete community
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const success = await CommunityService.deleteCommunity(id);
    
    if (success) {
      res.json({
        success: true,
        message: 'Community deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Community not found'
      });
    }
  } catch (error: any) {
    console.error('Error deleting community:', error);
    
    if (error.message.includes('Invalid community ID')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to delete community'
    });
  }
});

export { router as deleteRoutes };