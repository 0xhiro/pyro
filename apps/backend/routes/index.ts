import { Router } from 'express';
import creatorsRoute from './creators/index.js';
import sessionsRoute from './sessions/index.js';
import burnsRoute from './burns/index.js';
import leaderboardRoute from './leaderboard/index.js';
// import debugRoute from './debug/index.js';
import { usersRoute } from './users';

const router = Router();

router.use('/creators', creatorsRoute);
router.use('/sessions', sessionsRoute);
router.use('/burns', burnsRoute);
router.use('/leaderboard', leaderboardRoute);
router.use('/users', usersRoute);
// router.use('/debug', debugRoute);

export default router;