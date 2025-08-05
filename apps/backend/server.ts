import express from 'express';
import cors from 'cors';
import creatorsRoute from './routes/creators';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use('/creators', creatorsRoute);

app.get('/ping', (_req, res) => {
  res.send('pong');
});

app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
