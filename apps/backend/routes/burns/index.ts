import { Router } from 'express';
import postRoutes from './post.js';

const router = Router();

router.use(postRoutes);

export default router;