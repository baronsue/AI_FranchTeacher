/**
 * 课程进度路由
 */

import express from 'express';
import {
    getAllProgress,
    getCourseProgress,
    updateProgress,
    resetProgress
} from '../controllers/progressController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// 所有路由都需要认证
router.use(verifyToken);

router.get('/', getAllProgress);
router.get('/:courseId', getCourseProgress);
router.put('/:courseId', updateProgress);
router.delete('/:courseId', resetProgress);

export default router;
