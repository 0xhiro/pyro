import { Router } from 'express';
import { CreatorService } from '../../services/index.js';

const router = Router();

// GET /creators
router.get('/', async (_req, res) => {
  try {
    const creators = await CreatorService.getAllCreators();
    res.json(creators);
  } catch (err) {
    console.error('Fetch creators error:', err);
    res.status(500).json({ error: 'Failed to fetch creators' });
  }
});

// GET /creators/:mint
router.get('/:mint', async (req, res) => {
  const { mint } = req.params;
  
  try {
    const creator = await CreatorService.getCreatorById(mint);
    if (!creator) {
      return res.status(404).json({ error: 'Creator not found' });
    }
    res.json(creator);
  } catch (err) {
    console.error('Fetch creator error:', err);
    res.status(500).json({ error: 'Failed to fetch creator' });
  }
});

// GET /creators/:mint/with-token
router.get('/:mint/with-token', async (req, res) => {
  const { mint } = req.params;
  
  try {
    const creatorWithToken = await CreatorService.getCreatorWithToken(mint);
    if (!creatorWithToken) {
      return res.status(404).json({ error: 'Creator not found' });
    }
    res.json(creatorWithToken);
  } catch (err) {
    console.error('Fetch creator with token error:', err);
    res.status(500).json({ error: 'Failed to fetch creator with token details' });
  }
});

export default router;