import { Router } from 'express';
import getRoutes from './get';

const router = Router();

router.use(getRoutes);

export default router;