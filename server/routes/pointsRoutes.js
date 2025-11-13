/**
 * 积分路由
 */

import express from 'express';
import { getPoints, addPoints, getPointsHistory } from '../controllers/pointsController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// 所有路由都需要认证
router.use(verifyToken);

router.get('/', getPoints);
router.post('/', addPoints);
router.get('/history', getPointsHistory);

export default router;
