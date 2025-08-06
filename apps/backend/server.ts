import express from 'express';
import cors from 'cors';
import creatorsRoute from './routes/creators';
import leaderboardRoute from './routes/leaderboard';
import { connectToDatabase } from './lib/mongo';
import burnsRoute from './routes/burns';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use('/creators', creatorsRoute);
app.use('/leaderboard', leaderboardRoute);
app.use('/burns', burnsRoute);

app.get('/ping', (_req, res) => {
  res.send('pong');
});

app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});

connectToDatabase().then(async (db) => {
  const burns = db.collection('burns');
  await burns.insertOne({ test: true, createdAt: new Date() });
  console.log('🔥 Test burn inserted');
});
