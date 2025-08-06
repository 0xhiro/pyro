import { Router } from 'express';
import { connectToDatabase } from '../lib/mongo';

const router = Router();

router.post('/', async (req, res) => {
  const { creatorId, wallet, amount } = req.body;

  if (!creatorId || !wallet || !amount) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const db = await connectToDatabase();
    const burns = db.collection('burns');

    const doc = {
      creatorId,
      wallet,
      amount: parseFloat(amount),
      timestamp: new Date(),
    };

    await burns.insertOne(doc);

    res.status(200).json({ message: 'Burn logged' });
  } catch (err) {
    console.error('Error inserting burn:', err);
    res.status(500).json({ error: 'Failed to log burn' });
  }
});

export default router;
