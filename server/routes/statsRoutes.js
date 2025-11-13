/**
 * 学习统计路由
 */

import express from 'express';
import {
    getUserStats,
    updateStats,
    dailyCheckIn,
    getCheckInHistory
} from '../controllers/statsController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// 所有路由都需要认证
router.use(verifyToken);

router.get('/', getUserStats);
router.put('/', updateStats);
router.post('/checkin', dailyCheckIn);
router.get('/checkin/history', getCheckInHistory);

export default router;
