import { Router } from 'express';
import { BurnService } from '../../services/index.js';
import { validateNewBurnBody } from '../../middleware/validation.js';

const router = Router();

router.post('/', validateNewBurnBody, async (req, res) => {
  const { 
    userId, 
    wallet,
    creatorMint, 
    amount, 
    promotedToken,       // Full token object they want to promote
    advertisingMetadata, 
    sessionId, 
    txSignature
  } = req.body;

  try {
    console.log('=== BURN ROUTE DEBUG ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('promotedToken exists:', !!promotedToken);
    console.log('promotedToken value:', JSON.stringify(promotedToken, null, 2));
    
    // Validate required fields
    if (!wallet) {
      return res.status(400).json({ error: 'wallet address is required' });
    }
    if (!txSignature) {
      return res.status(400).json({ error: 'txSignature is required' });
    }

    console.log('About to call BurnService.createBurn...');
    // Create burn record
    const result = await BurnService.createBurn({
      userId,
      wallet,
      creatorMint,
      amount,
      promotedToken,
      advertisingMetadata,
      sessionId,
      txSignature
    });

    console.log('BurnService.createBurn completed successfully');
    console.log('Result:', JSON.stringify(result.burnDoc, null, 2));

    res.status(200).json({ 
      message: 'Burn logged successfully',
      burnId: result.burnDoc._id,
      protocolFee: result.protocolFee,
      burn: result.burnDoc
    });
  } catch (err: any) {
    console.error('Error creating burn:', err);
    res.status(500).json({ error: err.message || 'Failed to log burn' });
  }
});

export default router;