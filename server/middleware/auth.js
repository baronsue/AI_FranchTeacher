/**
 * 认证中间件
 */

import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';

// 验证 JWT token
export const verifyToken = async (req, res, next) => {
    try {
        // 从 header 获取 token
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: '未提供认证令牌',
            });
        }

        const token = authHeader.substring(7); // 移除 'Bearer ' 前缀

        // 验证 token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 检查用户是否存在且活跃
        const result = await query(
            'SELECT id, email, username, display_name, avatar_url, is_active FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: '用户不存在',
            });
        }

        const user = result.rows[0];

        if (!user.is_active) {
            return res.status(401).json({
                success: false,
                message: '账号已被禁用',
            });
        }

        // 将用户信息附加到请求对象
        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: '认证令牌已过期',
            });
        }

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: '无效的认证令牌',
            });
        }

        console.error('Auth middleware error:', error);
        return res.status(500).json({
            success: false,
            message: '认证失败',
        });
    }
};

// 生成 JWT token
export const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
};

// 可选认证（允许未登录用户访问，但如果有token则验证）
export const optionalAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
    }

    try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const result = await query(
            'SELECT id, email, username, display_name, avatar_url FROM users WHERE id = $1 AND is_active = true',
            [decoded.userId]
        );

        if (result.rows.length > 0) {
            req.user = result.rows[0];
        }
    } catch (error) {
        // 忽略错误，继续作为未认证用户
        console.log('Optional auth failed:', error.message);
    }

    next();
};
