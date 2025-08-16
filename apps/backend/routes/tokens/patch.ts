import { Router } from 'express';
import { TokenService } from '../../services/index.js';

const router = Router();

// PATCH /tokens/:id - Update token
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated
    const { _id, mint_address, createdAt, ...allowedUpdates } = updateData;

    if (Object.keys(allowedUpdates).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields provided for update'
      });
    }

    const updatedToken = await TokenService.updateToken(id, allowedUpdates);
    
    res.json({
      success: true,
      data: updatedToken,
      message: 'Token updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating token:', error);
    
    if (error.message.includes('Invalid token ID')) {
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
      error: 'Failed to update token'
    });
  }
});

export { router as patchRoutes };