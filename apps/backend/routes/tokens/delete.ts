import { Router } from 'express';
import { TokenService } from '../../services/index.js';

const router = Router();

// DELETE /tokens/:id - Delete token
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const success = await TokenService.deleteToken(id);
    
    if (success) {
      res.json({
        success: true,
        message: 'Token deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Token not found'
      });
    }
  } catch (error: any) {
    console.error('Error deleting token:', error);
    
    if (error.message.includes('Invalid token ID')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to delete token'
    });
  }
});

export { router as deleteRoutes };