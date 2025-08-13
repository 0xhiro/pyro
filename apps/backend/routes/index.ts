import { Router } from 'express';
import creatorsRoute from './creators';
import sessionsRoute from './sessions';
import burnsRoute from './burns';
import leaderboardRoute from './leaderboard';
import debugRoute from './debug';
import { usersRoute } from './users';

const router = Router();

router.use('/creators', creatorsRoute);
router.use('/sessions', sessionsRoute);
router.use('/burns', burnsRoute);
router.use('/leaderboard', leaderboardRoute);
router.use('/users', usersRoute);
router.use('/debug', debugRoute);

export default router;