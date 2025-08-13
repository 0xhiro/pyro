import { Router } from 'express';
import { SessionService } from '../../services/index.js';

const router = Router();

// GET /sessions/:creatorMint/active - Get current active session
router.get('/:creatorMint/active', async (req, res) => {
  const { creatorMint } = req.params;

  try {
    const activeSession = await SessionService.getActiveSession(creatorMint);

    if (!activeSession) {
      return res.status(404).json({ error: 'No active session found' });
    }

    res.status(200).json(activeSession);
  } catch (err) { 
    console.error('Error fetching active session:', err);
    res.status(500).json({ error: 'Failed to fetch active session' });
  }
});

export default router;