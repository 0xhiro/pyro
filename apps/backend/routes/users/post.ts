import { Router } from 'express';
import { UserService } from '../../services/UserService.js';
import { validateUserCreation, validateTokenAddition } from '../../middleware/validation.js';

const router = Router();

// POST /users - Create a new user
router.post('/', validateUserCreation, async (req, res) => {
  try {
    const userData = req.body;
    const user = await UserService.createUser(userData);
    
    res.status(201).json({
      success: true,
      data: user,
      message: 'User created successfully'
    });
  } catch (error: any) {
    console.error('Error creating user:', error);
    
    if (error.message.includes('already exists') || error.message.includes('already taken')) {
      return res.status(409).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create user'
    });
  }
});

// POST /users/:id/tokens - Add a token to user's portfolio
router.post('/:id/tokens', validateTokenAddition, async (req, res) => {
  try {
    const { id } = req.params;
    const tokenData = req.body;
    
    await UserService.addToken(id, tokenData);
    
    res.status(201).json({
      success: true,
      message: 'Token added successfully'
    });
  } catch (error: any) {
    console.error('Error adding token:', error);
    
    if (error.message.includes('Invalid user ID')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    if (error.message.includes('already added')) {
      return res.status(409).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to add token'
    });
  }
});

// POST /users/:id/follow/:targetId - Follow a user
router.post('/:id/follow/:targetId', async (req, res) => {
  try {
    const { id, targetId } = req.params;
    
    await UserService.followUser(id, targetId);
    
    res.json({
      success: true,
      message: 'User followed successfully'
    });
  } catch (error: any) {
    console.error('Error following user:', error);
    
    if (error.message.includes('Invalid user ID') || 
        error.message.includes('Cannot follow yourself') ||
        error.message.includes('not found') ||
        error.message.includes('Already following')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to follow user'
    });
  }
});

// POST /users/:id/unfollow/:targetId - Unfollow a user
router.post('/:id/unfollow/:targetId', async (req, res) => {
  try {
    const { id, targetId } = req.params;
    
    await UserService.unfollowUser(id, targetId);
    
    res.json({
      success: true,
      message: 'User unfollowed successfully'
    });
  } catch (error: any) {
    console.error('Error unfollowing user:', error);
    
    if (error.message.includes('Invalid user ID') || 
        error.message.includes('not found')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to unfollow user'
    });
  }
});

// POST /users/:id/is-following/:targetId - Check if user is following another user
router.post('/:id/is-following/:targetId', async (req, res) => {
  try {
    const { id, targetId } = req.params;
    
    const isFollowing = await UserService.isFollowing(id, targetId);
    
    res.json({
      success: true,
      data: { isFollowing }
    });
  } catch (error) {
    console.error('Error checking follow status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check follow status'
    });
  }
});

export { router as postRoutes };
