import { Router } from 'express';
import getRoutes from './get.js';
import postRoutes from './post.js';
import patchRoutes from './patch.js';

const router = Router();

router.use(getRoutes);
router.use(postRoutes);
router.use(patchRoutes);

export default router;