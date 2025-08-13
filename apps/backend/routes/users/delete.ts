import { Router } from 'express';
import { UserService } from '../../services/UserService';

const router = Router();

// DELETE /users/:id - Delete user account
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deleted = await UserService.deleteUser(id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    
    if (error.message.includes('Invalid user ID')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to delete user'
    });
  }
});

// DELETE /users/:id/tokens/:tokenMint - Remove a token from user's portfolio
router.delete('/:id/tokens/:tokenMint', async (req, res) => {
  try {
    const { id, tokenMint } = req.params;
    
    await UserService.removeToken(id, tokenMint);
    
    res.json({
      success: true,
      message: 'Token removed successfully'
    });
  } catch (error: any) {
    console.error('Error removing token:', error);
    
    if (error.message.includes('Invalid user ID') || 
        error.message.includes('not found')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to remove token'
    });
  }
});

export { router as deleteRoutes };
