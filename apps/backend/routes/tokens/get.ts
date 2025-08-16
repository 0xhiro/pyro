import { Router } from 'express';
import { TokenService } from '../../services/index.js';

const router = Router();

// GET /tokens - Get all tokens with pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    
    const tokens = await TokenService.getAllTokens(page, limit);
    
    res.json({
      success: true,
      data: tokens,
      pagination: {
        page,
        limit,
        hasMore: tokens.length === limit
      }
    });
  } catch (error) {
    console.error('Error fetching tokens:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tokens'
    });
  }
});

// GET /tokens/search - Search tokens
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }
    
    const tokens = await TokenService.searchTokens(query, page, limit);
    
    res.json({
      success: true,
      data: tokens,
      pagination: {
        page,
        limit,
        hasMore: tokens.length === limit
      }
    });
  } catch (error) {
    console.error('Error searching tokens:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search tokens'
    });
  }
});

// GET /tokens/:id - Get token by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const token = await TokenService.getTokenById(id);
    
    if (!token) {
      return res.status(404).json({
        success: false,
        error: 'Token not found'
      });
    }
    
    res.json({
      success: true,
      data: token
    });
  } catch (error) {
    console.error('Error fetching token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch token'
    });
  }
});

// GET /tokens/mint/:mint_address - Get token by mint address
router.get('/mint/:mint_address', async (req, res) => {
  try {
    const { mint_address } = req.params;
    const token = await TokenService.getTokenByMintAddress(mint_address);
    
    if (!token) {
      return res.status(404).json({
        success: false,
        error: 'Token not found'
      });
    }
    
    res.json({
      success: true,
      data: token
    });
  } catch (error) {
    console.error('Error fetching token by mint address:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch token'
    });
  }
});

export { router as getRoutes };