const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const {
    register,
    login,
    refreshToken,
    logout,
    getCurrentUser
} = require('../controllers/authController');

// 验证中间件
const validateRegistration = [
    body('username')
        .trim()
        .isLength({ min: 3, max: 50 })
        .withMessage('用户名长度必须在3-50个字符之间')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('用户名只能包含字母、数字和下划线'),
    body('email')
        .trim()
        .isEmail()
        .withMessage('请提供有效的邮箱地址')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 6 })
        .withMessage('密码长度至少为6个字符'),
    body('displayName')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('显示名称最多100个字符')
];

const validateLogin = [
    body('username')
        .trim()
        .notEmpty()
        .withMessage('用户名不能为空'),
    body('password')
        .notEmpty()
        .withMessage('密码不能为空')
];

// 路由定义
router.post('/register', validateRegistration, register);
router.post('/login', validateLogin, login);
router.post('/refresh', refreshToken);
router.post('/logout', authenticateToken, logout);
router.get('/me', authenticateToken, getCurrentUser);

module.exports = router;
