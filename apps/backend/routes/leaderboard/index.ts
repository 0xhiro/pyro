import { Router } from 'express';
import getRoutes from './get.js';

const router = Router();

router.use(getRoutes);

export default router;