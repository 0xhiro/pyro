import { Router } from 'express';
import { connectToDatabase } from '../lib/mongo';

const router = Router();

router.get('/:creatorId', async (req, res) => {
  const { creatorId } = req.params;
  const limit = parseInt(req.query.limit as string, 10) || 10;

  try {
    const db = await connectToDatabase();
    const burns = db.collection('burns');

    const leaderboard = await burns.aggregate([
      { $match: { creatorId } },
      {
        $group: {
          _id: '$wallet',
          totalBurned: { $sum: '$amount' },
        },
      },
      {
        $project: {
          wallet: '$_id',
          totalBurned: 1,
          _id: 0,
        },
      },
      { $sort: { totalBurned: -1 } },
      { $limit: limit },
    ]).toArray();

    // Add rank numbers
    const ranked = leaderboard.map((entry, idx) => ({
      rank: idx + 1,
      ...entry,
    }));

    res.status(200).json(ranked);
  } catch (err) {
    console.error('Failed to load leaderboard:', err);
    res.status(500).json({ error: 'Failed to load leaderboard' });
  }
});

export default router;
