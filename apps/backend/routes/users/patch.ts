import { Router } from 'express';
import { UserService } from '../../services/UserService';
import { validateUserUpdate, validateTokenUpdate } from '../../middleware/validation';

const router = Router();

// PATCH /users/:id - Update user profile
router.patch('/:id', validateUserUpdate, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const user = await UserService.updateUser(id, updateData);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: user,
      message: 'User updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating user:', error);
    
    if (error.message.includes('Invalid user ID')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    if (error.message.includes('already taken')) {
      return res.status(409).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to update user'
    });
  }
});

// PATCH /users/:id/tokens/:tokenMint - Update a specific token in user's portfolio
router.patch('/:id/tokens/:tokenMint', validateTokenUpdate, async (req, res) => {
  try {
    const { id, tokenMint } = req.params;
    const updateData = req.body;
    
    await UserService.updateToken(id, tokenMint, updateData);
    
    res.json({
      success: true,
      message: 'Token updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating token:', error);
    
    if (error.message.includes('Invalid user ID') || 
        error.message.includes('not found')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to update token'
    });
  }
});

export { router as patchRoutes };
