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

export default router;