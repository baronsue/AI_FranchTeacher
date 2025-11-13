/**
 * 错题本路由
 */

import express from 'express';
import {
    getMistakes,
    recordMistake,
    markReviewed,
    deleteMistake
} from '../controllers/mistakesController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// 所有路由都需要认证
router.use(verifyToken);

router.get('/', getMistakes);
router.post('/', recordMistake);
router.put('/:mistakeId/review', markReviewed);
router.delete('/:mistakeId', deleteMistake);

export default router;
