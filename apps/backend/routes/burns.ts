import { Router } from 'express';
import { connectToDatabase } from '../lib/mongo';

const router = Router();

router.post('/', async (req, res) => {
  const { creatorMint, wallet, amount } = req.body;

  if (!creatorMint || !wallet || amount === undefined) {
    return res.status(400).json({ error: 'Missing required fields: creatorMint, wallet, amount' });
  }
  const amt = Number(amount);
  if (!Number.isFinite(amt) || amt <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  try {
    const db = await connectToDatabase();
    const burns = db.collection('burns');

    const doc = {
      creatorMint: String(creatorMint),
      wallet: String(wallet),
      amount: amt,       // (Decimal128 coming in Patch 2)
      ts: new Date(),
    };

    await burns.insertOne(doc);
    res.status(200).json({ message: 'Burn logged' });
  } catch (err) {
    console.error('Error inserting burn:', err);
    res.status(500).json({ error: 'Failed to log burn' });
  }
});

export default router;
