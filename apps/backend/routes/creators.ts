import { Router } from 'express';
const router = Router();

const creators = [
  {
    id: 'spinning-cat',
    name: 'Spinning Cat',
    tokenMint: 'So1aNa123...',
  },
  {
    id: 'hello-kitty',
    name: 'Hello Kitty',
    tokenMint: 'Cu7eT0k3n...',
  },
];

router.get('/', (req, res) => {
  res.json(creators);
});

export default router;
