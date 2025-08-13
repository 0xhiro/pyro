import { Router } from 'express';
import { getRoutes } from './get.js';
import { postRoutes } from './post.js';
import { patchRoutes } from './patch.js';
import { deleteRoutes } from './delete.js';

const router = Router();

// Mount all user routes
router.use('/', getRoutes);
router.use('/', postRoutes);
router.use('/', patchRoutes);
router.use('/', deleteRoutes);

export { router as usersRoute };
