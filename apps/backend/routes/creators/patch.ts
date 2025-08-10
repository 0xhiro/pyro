import { Router } from 'express';
import { CreatorService } from '../../services';

const router = Router();

// PATCH /creators/:mint/status - Update live status
router.patch('/:mint/status', async (req, res) => {
  const { mint } = req.params;
  const { isLive } = req.body;

  if (typeof isLive !== 'boolean') {
    return res.status(400).json({ error: 'isLive must be a boolean' });
  }

  try {
    await CreatorService.updateCreatorStatus(mint, isLive);

    res.status(200).json({ 
      message: 'Creator status updated',
      mint,
      isLive 
    });
  } catch (err: any) {
    if (err.message === 'Creator not found') {
      return res.status(404).json({ error: 'Creator not found' });
    }
    console.error('Error updating creator status:', err);
    res.status(500).json({ error: 'Failed to update creator status' });
  }
});

export default router;