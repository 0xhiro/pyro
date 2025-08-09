import express from 'express';
import cors from 'cors';
import creatorsRoute from './routes/creators';
import leaderboardRoute from './routes/leaderboard';
import burnsRoute from './routes/burns';
import { connectToDatabase } from './lib/mongo';

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

app.use(cors());
app.use(express.json());

// Ensure DB boots (fail fast if not)
connectToDatabase()
  .then(() => console.log('🗄️ Connected to MongoDB'))
  .catch((err) => {
    console.error('❌ Failed to connect to MongoDB:', err);
    process.exit(1);
  });

// Routes
app.use('/creators', creatorsRoute);
app.use('/leaderboard', leaderboardRoute);
app.use('/burns', burnsRoute);

// Health
app.get('/ping', (_req, res) => res.send('pong'));

app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
