import { Router } from 'express';
import { connectToDatabase } from '../lib/mongo';

const router = Router();

// GET /creators
router.get('/', async (_, res) => {
  try {
    const db = await connectToDatabase();
    const creators = await db.collection('creators').find({}).toArray();
    res.json(creators);
  } catch (err) {
    console.error('Fetch creators error:', err);
    res.status(500).json({ error: 'Failed to fetch creators' });
  }
});

// POST /creators
router.post('/', async (req, res) => {
  const { id, name, tokenMint } = req.body;
  if (!id || !name || !tokenMint) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const db = await connectToDatabase();
    await db.collection('creators').insertOne({ id, name, tokenMint });
    res.status(200).json({ message: 'Creator added' });
  } catch (err) {
    console.error('Insert creator error:', err);
    res.status(500).json({ error: 'Failed to add creator' });
  }
});

export default router;
