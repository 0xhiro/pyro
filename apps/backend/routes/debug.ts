import { Router } from 'express';
import { SolanaService } from '../services';

const router = Router();

// Debug endpoint to test blockchain burn detection
router.get('/burns/:mintAddress', async (req, res) => {
  const { mintAddress } = req.params;
  
  console.log(`🔍 Debug: Testing burn detection for mint: ${mintAddress}`);
  
  try {
    const solanaService = new SolanaService();
    const burns = await solanaService.getBurnTransactions(mintAddress, { limit: 50 });
    
    console.log(`🔥 Debug: Found ${burns.length} burn transactions`);
    
    res.json({
      mint: mintAddress,
      burns,
      count: burns.length,
      message: 'Debug burn detection results'
    });
  } catch (error) {
    console.error('❌ Debug endpoint error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
      mint: mintAddress
    });
  }
});

export default router;