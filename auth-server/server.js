const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { pool } = require('./config/database');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================
// 中间件配置
// ============================================

// 安全头
app.use(helmet());

// CORS配置
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:8080', 'http://127.0.0.1:8080'];

app.use(cors({
    origin: (origin, callback) => {
        // 允许没有origin的请求（如移动应用或Postman）
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error('不允许的来源'));
    },
    credentials: true
}));

// 请求体解析
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 请求日志
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// 速率限制
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100, // 限制100个请求
    message: '请求过于频繁，请稍后再试'
});

// 登录速率限制（更严格）
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: '登录尝试次数过多，请15分钟后再试'
});

app.use('/api/', limiter);
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/register', loginLimiter);

// ============================================
// 路由
// ============================================

// 健康检查
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// 数据库连接检查
app.get('/health/db', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({
            status: 'ok',
            database: 'connected',
            timestamp: result.rows[0].now
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            database: 'disconnected',
            error: error.message
        });
    }
});

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

// 404处理
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: '接口不存在'
    });
});

// 错误处理
app.use((err, req, res, next) => {
    console.error('错误:', err);

    // CORS错误
    if (err.message === '不允许的来源') {
        return res.status(403).json({
            success: false,
            error: '不允许的来源'
        });
    }

    // 数据库错误
    if (err.code === '23505') {
        return res.status(400).json({
            success: false,
            error: '数据已存在'
        });
    }

    // 默认错误
    res.status(err.status || 500).json({
        success: false,
        error: err.message || '服务器内部错误'
    });
});

// ============================================
// 启动服务器
// ============================================

const server = app.listen(PORT, () => {
    console.log('===========================================');
    console.log(`🚀 认证服务器启动成功`);
    console.log(`📡 端口: ${PORT}`);
    console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 健康检查: http://localhost:${PORT}/health`);
    console.log('===========================================');
});

// 优雅关闭
process.on('SIGTERM', () => {
    console.log('收到SIGTERM信号，开始优雅关闭...');
    server.close(() => {
        console.log('HTTP服务器已关闭');
        pool.end(() => {
            console.log('数据库连接池已关闭');
            process.exit(0);
        });
    });
});

process.on('SIGINT', () => {
    console.log('收到SIGINT信号，开始优雅关闭...');
    server.close(() => {
        console.log('HTTP服务器已关闭');
        pool.end(() => {
            console.log('数据库连接池已关闭');
            process.exit(0);
        });
    });
});

module.exports = app;
