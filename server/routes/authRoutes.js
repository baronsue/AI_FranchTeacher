/**
 * 认证路由
 */

import express from 'express';
import { register, login, getCurrentUser, updateProfile, changePassword } from '../controllers/authController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// 公开路由
router.post('/register', register);
router.post('/login', login);

// 需要认证的路由
router.get('/me', verifyToken, getCurrentUser);
router.put('/profile', verifyToken, updateProfile);
router.put('/password', verifyToken, changePassword);

export default router;
