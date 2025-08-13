import { Router } from 'express';
import getRoutes from './get.js';
import postRoutes from './post.js';

const router = Router();

router.use(getRoutes);
router.use(postRoutes);

export default router;