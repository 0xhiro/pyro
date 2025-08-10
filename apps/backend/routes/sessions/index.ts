import { Router } from 'express';
import getRoutes from './get';
import postRoutes from './post';

const router = Router();

router.use(getRoutes);
router.use(postRoutes);

export default router;