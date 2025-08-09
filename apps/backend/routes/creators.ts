import { Router } from 'express';
import { connectToDatabase } from '../lib/mongo';

const router = Router();

type CreatorDoc = {
  _id: string;            // mint as string
  name: string;
  iconUrl?: string;
  decimals?: number;
  symbol?: string;
  createdAt: Date;
};

// GET /creators
router.get('/', async (_req, res) => {
  try {
    const db = await connectToDatabase();
    const creators = db.collection<CreatorDoc>('creators');
    const all = await creators.find({}).toArray();
    res.json(all);
  } catch (err) {
    console.error('Fetch creators error:', err);
    res.status(500).json({ error: 'Failed to fetch creators' });
  }
});

// POST /creators  body: { mint, name, iconUrl?, decimals?, symbol? }
router.post('/', async (req, res) => {
  const { mint, name, iconUrl, decimals, symbol } = req.body || {};
  if (!mint || !name) {
    return res.status(400).json({ error: 'Missing required fields: mint, name' });
  }

  try {
    const db = await connectToDatabase();
    const creators = db.collection<CreatorDoc>('creators');

    const doc: CreatorDoc = {
      _id: String(mint),
      name: String(name),
      iconUrl: iconUrl ? String(iconUrl) : undefined,
      decimals: Number.isFinite(decimals) ? Number(decimals) : undefined,
      symbol: symbol ? String(symbol) : undefined,
      createdAt: new Date(),
    };

    await creators.insertOne(doc);
    res.status(201).json(doc);
  } catch (err: any) {
    if (err?.code === 11000) {
      return res.status(409).json({ error: 'Creator already exists' });
    }
    console.error('Insert creator error:', err);
    res.status(500).json({ error: 'Failed to add creator' });
  }
});

export default router;
