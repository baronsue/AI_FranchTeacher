/**
 * AI对话历史路由
 */

import express from 'express';
import {
    getDialogueHistory,
    saveDialogue,
    deleteDialogue,
    clearDialogueHistory
} from '../controllers/dialogueController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// 所有路由都需要认证
router.use(verifyToken);

router.get('/', getDialogueHistory);
router.post('/', saveDialogue);
router.delete('/:dialogueId', deleteDialogue);
router.delete('/', clearDialogueHistory);

export default router;
