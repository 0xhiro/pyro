import { Router } from 'express';
import { CreatorService } from '../../services/index.js';
import { validateCreatorBody } from '../../middleware/validation.js';

const router = Router();

// POST /creators  body: { mint, tokenInfo: { name, icon, ticker, symbol?, decimals?, mint_address }, streamerUsername?, streamUrl?, dexUrl? }
router.post('/', validateCreatorBody, async (req, res) => {
  const { mint, tokenInfo, streamerUsername, streamUrl, dexUrl } = req.body;

  if (!tokenInfo || !tokenInfo.name || !tokenInfo.icon || !tokenInfo.ticker || !tokenInfo.mint_address) {
    return res.status(400).json({ 
      error: 'tokenInfo with name, icon, ticker, and mint_address is required' 
    });
  }

  try {
    const creator = await CreatorService.createCreator({
      mint,
      tokenInfo,
      streamerUsername,
      streamUrl,
      dexUrl
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

// POST /creators/:mint/token-info  body: { tokenInfo }
router.post('/:mint/token-info', async (req, res) => {
  const { mint } = req.params;
  const { tokenInfo } = req.body;

  if (!tokenInfo) {
    return res.status(400).json({ error: 'tokenInfo is required' });
  }

  try {
    await CreatorService.updateTokenInfo(mint, tokenInfo);
    res.json({ success: true, message: 'Token info updated successfully' });
  } catch (err: any) {
    console.error('Update token info error:', err);
    res.status(500).json({ error: 'Failed to update token info' });
  }
});

export default router;