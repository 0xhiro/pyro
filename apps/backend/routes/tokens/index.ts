import { Router } from 'express';
import { getRoutes } from './get.js';
import { postRoutes } from './post.js';
import { patchRoutes } from './patch.js';
import { deleteRoutes } from './delete.js';

const router = Router();

router.use('/', getRoutes);
router.use('/', postRoutes);
router.use('/', patchRoutes);
router.use('/', deleteRoutes);

export default router;