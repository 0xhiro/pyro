import { Router } from 'express';
import { TokenService } from '../../services/index.js';

const router = Router();

// POST /tokens - Create a new token
router.post('/', async (req, res) => {
  try {
    const { icon, ticker, dex, url, name, mint_address } = req.body;

    // Validate required fields
    if (!icon || !ticker || !dex || !url || !name || !mint_address) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required: icon, ticker, dex, url, name, mint_address'
      });
    }

    const token = await TokenService.createToken({
      icon,
      ticker,
      dex,
      url,
      name,
      mint_address
    });

    res.status(201).json({
      success: true,
      data: token,
      message: 'Token created successfully'
    });
  } catch (error: any) {
    console.error('Error creating token:', error);
    
    if (error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create token'
    });
  }
});

export { router as postRoutes };