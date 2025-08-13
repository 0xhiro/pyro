import { Router } from 'express';
import { getRoutes } from './get';
import { postRoutes } from './post';
import { patchRoutes } from './patch';
import { deleteRoutes } from './delete';

const router = Router();

// Mount all user routes
router.use('/', getRoutes);
router.use('/', postRoutes);
router.use('/', patchRoutes);
router.use('/', deleteRoutes);

export { router as usersRoute };
