import { Router } from 'express';
import { BurnService } from '../../services';
import { validateBurnBody } from '../../middleware/validation';

const router = Router();

router.post('/', validateBurnBody, async (req, res) => {
  const { creatorMint, wallet, amount, sessionId } = req.body;

  try {
    const result = await BurnService.createBurn({
      creatorMint,
      wallet,
      amount,
      sessionId
    });

    res.status(200).json({ 
      message: 'Burn logged',
      burnId: result.burnId,
      protocolFee: result.protocolFee
    });
  } catch (err: any) {
    console.error('Error inserting burn:', err);
    res.status(500).json({ error: err.message || 'Failed to log burn' });
  }
});

export default router;