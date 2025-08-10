import { Router } from 'express';
import getRoutes from './get';
import postRoutes from './post';
import patchRoutes from './patch';

const router = Router();

router.use(getRoutes);
router.use(postRoutes);
router.use(patchRoutes);

export default router;