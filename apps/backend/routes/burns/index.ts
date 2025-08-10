import { Router } from 'express';
import postRoutes from './post';

const router = Router();

router.use(postRoutes);

export default router;