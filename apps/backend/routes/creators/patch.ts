import { Router } from 'express';
import { CreatorService } from '../../services/index.js';
import { validateCreatorUpdateBody } from '../../middleware/validation.js';

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

// PATCH /creators/:mint - Update creator information
router.patch('/:mint', validateCreatorUpdateBody, async (req, res) => {
  const { mint } = req.params;
  const { name, iconUrl, streamerUsername, streamUrl, ticker, marketCap, dexUrl } = req.body;

  try {
    // Check if creator exists
    const existingCreator = await CreatorService.getCreatorById(mint);
    if (!existingCreator) {
      return res.status(404).json({ error: 'Creator not found' });
    }

    // Update creator info with provided fields
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (iconUrl !== undefined) updateData.iconUrl = iconUrl;
    if (streamerUsername !== undefined) updateData.streamerUsername = streamerUsername;
    if (streamUrl !== undefined) updateData.streamUrl = streamUrl;
    if (ticker !== undefined) updateData.ticker = ticker;
    if (marketCap !== undefined) updateData.marketCap = marketCap;
    if (dexUrl !== undefined) updateData.dexUrl = dexUrl;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No valid fields provided for update' });
    }

    await CreatorService.updateCreatorInfo(mint, updateData);

    res.status(200).json({ 
      message: 'Creator information updated',
      mint,
      updatedFields: Object.keys(updateData)
    });
  } catch (err: any) {
    console.error('Error updating creator info:', err);
    res.status(500).json({ error: 'Failed to update creator information' });
  }
});

export default router;