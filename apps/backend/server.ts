import express from 'express';
import cors from 'cors';
import creatorsRoute from './routes/creators';
import leaderboardRoute from './routes/leaderboard';
import burnsRoute from './routes/burns';
import { connectToDatabase } from './lib/mongo';
import { Db } from 'mongodb';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Mount your existing GET /creators router
app.use('/creators', creatorsRoute);

// Mount leaderboard and burns
app.use('/leaderboard', leaderboardRoute);
app.use('/burns', burnsRoute);

// Inline POST /creators to persist new custom creators
let dbInstance: Db;
connectToDatabase()
  .then((db) => {
    dbInstance = db;
    console.log('🗄️ Connected to MongoDB');
  })
  .catch((err) => {
    console.error('❌ Failed to connect to MongoDB:', err);
    process.exit(1);
  });

app.post('/creators', async (req, res) => {
  if (!dbInstance) {
    return res.status(503).json({ error: 'Database not initialized' });
  }

  try {
    const newCreator = req.body;
    // You may want to validate { id, name, tokenMint } here
    const coll = dbInstance.collection('creators');
    await coll.insertOne({
      ...newCreator,
      createdAt: new Date(),
    });
    return res.status(201).json(newCreator);
  } catch (err) {
    console.error('Failed to save creator:', err);
    return res.status(500).json({ error: 'Failed to save creator' });
  }
});

// A simple health-check
app.get('/ping', (_req, res) => {
  res.send('pong');
});

app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
