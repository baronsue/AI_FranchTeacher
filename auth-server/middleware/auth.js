const jwt = require('jsonwebtoken');
require('dotenv').config();

// JWT认证中间件
const authenticateToken = (req, res, next) => {
    // 从请求头获取token
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            success: false,
            error: '未提供认证令牌'
        });
    }

    // 验证token
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    error: '令牌已过期',
                    code: 'TOKEN_EXPIRED'
                });
            }
            return res.status(403).json({
                success: false,
                error: '无效的令牌'
            });
        }

        // 将用户信息附加到请求对象
        req.user = user;
        next();
    });
};

// 可选的认证中间件（不强制要求token）
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        req.user = null;
        return next();
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        req.user = err ? null : user;
        next();
    });
};

// 生成访问令牌
const generateAccessToken = (user, expiresIn = process.env.JWT_EXPIRES_IN || '7d') => {
    const payload = {
        userId: user.id,
        username: user.username,
        email: user.email,
        isDemo: Boolean(user.is_demo || user.isDemo)
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn
    });
};

// 生成刷新令牌
const generateRefreshToken = (user, expiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || '30d') => {
    const payload = {
        userId: user.id,
        username: user.username,
        isDemo: Boolean(user.is_demo || user.isDemo)
    };

    return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn
    });
};

// 验证刷新令牌
const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    } catch (error) {
        return null;
    }
};

module.exports = {
    authenticateToken,
    optionalAuth,
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken
};
