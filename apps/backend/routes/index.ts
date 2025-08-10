import { Router } from 'express';
import creatorsRoute from './creators';
import sessionsRoute from './sessions';
import burnsRoute from './burns';
import leaderboardRoute from './leaderboard';

const router = Router();

router.use('/creators', creatorsRoute);
router.use('/sessions', sessionsRoute);
router.use('/burns', burnsRoute);
router.use('/leaderboard', leaderboardRoute);

export default router;