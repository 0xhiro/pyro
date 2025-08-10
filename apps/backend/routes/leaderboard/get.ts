import { Router } from 'express';
import { LeaderboardService } from '../../services';

const router = Router();

router.get('/:creatorMint', async (req, res) => {
  const { creatorMint } = req.params;
  const { sessionId } = req.query;
  const limit = parseInt(req.query.limit as string, 10) || 10;

  try {
    const result = await LeaderboardService.getLeaderboard(creatorMint, {
      limit,
      sessionId: sessionId as string
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