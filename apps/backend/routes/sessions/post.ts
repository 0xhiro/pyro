import { Router } from 'express';
import { SessionService } from '../../services';
import { validateSessionStart, validateObjectId } from '../../middleware/validation';

const router = Router();

// POST /sessions/start - Start new session for creator
router.post('/start', validateSessionStart, async (req, res) => {
  const { creatorMint } = req.body;

  try {
    const session = await SessionService.startSession(creatorMint);
    res.status(201).json(session);
  } catch (err: any) {
    if (err.message === 'Creator not found') {
      return res.status(404).json({ error: 'Creator not found' });
    }
    console.error('Error starting session:', err);
    res.status(500).json({ error: 'Failed to start session' });
  }
});

// POST /sessions/:id/end - End active session
router.post('/:id/end', validateObjectId('id'), async (req, res) => {
  const { id } = req.params;

  try {
    await SessionService.endSession(id);
    res.status(200).json({ message: 'Session ended successfully' });
  } catch (err: any) {
    if (err.message === 'Session not found') {
      return res.status(404).json({ error: 'Session not found' });
    }
    if (err.message === 'Session is already ended') {
      return res.status(400).json({ error: 'Session is already ended' });
    }
    console.error('Error ending session:', err);
    res.status(500).json({ error: 'Failed to end session' });
  }
});

export default router;