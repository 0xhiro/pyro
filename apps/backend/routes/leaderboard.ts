import { Router } from 'express';
const router = Router();

// Dummy leaderboard data
const sampleLeaderboards = {
  'spinning-cat': [
    { wallet: 'So1anaUser123', totalBurned: 12.5 },
    { wallet: 'BurnLord420', totalBurned: 8.1 },
    { wallet: 'MeowGuy', totalBurned: 3.3 },
  ],
  'hello-kitty': [
    { wallet: 'KittyMaxi', totalBurned: 22.9 },
    { wallet: 'PastelDump', totalBurned: 10.4 },
  ],
};

router.get('/:creatorId', (req, res) => {
  const { creatorId } = req.params;
  const data = sampleLeaderboards[creatorId];

  if (!data) {
    return res.status(404).json({ error: 'Creator not found' });
  }

  res.json(data);
});

export default router;
