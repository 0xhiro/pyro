import { Router } from 'express';
import { LeaderboardService, BlockchainLeaderboardService } from '../../services/index.js';

const router = Router();

router.get('/:creatorMint', async (req, res) => {
  const { creatorMint } = req.params;
  const { sessionId, useBlockchain } = req.query;
  const limit = parseInt(req.query.limit as string, 10) || 10;
  // Default to blockchain unless explicitly disabled
  const shouldUseBlockchain = useBlockchain !== 'false' && useBlockchain !== '0';

  console.log(`🚀 Leaderboard request for ${creatorMint}:`, {
    sessionId,
    useBlockchain,
    shouldUseBlockchain,
    limit
  });

  try {
    const result = await BlockchainLeaderboardService.getLeaderboard(creatorMint, {
      limit,
      sessionId: sessionId as string,
      useBlockchain: shouldUseBlockchain
    });
    
    console.log(`📊 Leaderboard result:`, {
      dataSource: result.dataSource,
      entryCount: result.leaderboard.length
    });
    
    res.status(200).json(result);
  } catch (err: any) {
    if (err.message === 'Invalid sessionId format') {
      return res.status(400).json({ error: 'Invalid sessionId format' });
    }
    if (err.message === 'Session not found') {
    return res.status(404).json({ error: 'Session not found' });
    }
    console.error('Failed to load leaderboard:', err);
    res.status(500).json({ error: 'Failed to load leaderboard' });
  }
});



export default router;