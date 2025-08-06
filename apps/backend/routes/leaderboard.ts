import { Router } from 'express';
import { connectToDatabase } from '../lib/mongo';

const router = Router();

router.get('/:creatorId', async (req, res) => {
  const { creatorId } = req.params;

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
      { $limit: 10 },
    ]).toArray();

    res.status(200).json(leaderboard);
  } catch (err) {
    console.error('Failed to load leaderboard:', err);
    res.status(500).json({ error: 'Failed to load leaderboard' });
  }
});

export default router;
