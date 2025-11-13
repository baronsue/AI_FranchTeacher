/**
 * 徽章路由
 */

import express from 'express';
import { getUserBadges, getAllBadges, awardBadge } from '../controllers/badgesController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// 所有路由都需要认证
router.use(verifyToken);

router.get('/', getUserBadges);
router.get('/all', getAllBadges);
router.post('/', awardBadge);

export default router;
