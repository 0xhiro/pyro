import { Router } from 'express';
import { CreatorService } from '../../services';
import { validateCreatorBody } from '../../middleware/validation';

const router = Router();

// POST /creators  body: { mint, name, iconUrl?, decimals?, symbol? }
router.post('/', validateCreatorBody, async (req, res) => {
  const { mint, name, iconUrl, decimals, symbol } = req.body;

  try {
    const creator = await CreatorService.createCreator({
      mint,
      name,
      iconUrl,
      decimals,
      symbol
    });
    
    res.status(201).json(creator);
  } catch (err: any) {
    if (err?.code === 11000) {
      return res.status(409).json({ error: 'Creator already exists' });
    }
    console.error('Insert creator error:', err);
    res.status(500).json({ error: 'Failed to add creator' });
  }
});

export default router;