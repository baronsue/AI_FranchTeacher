/**
 * AI FranchTeacher API Server
 * 用户认证和学习数据管理服务器
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { checkConnection } from './config/database.js';

// 路由导入
import authRoutes from './routes/authRoutes.js';
import progressRoutes from './routes/progressRoutes.js';
import pointsRoutes from './routes/pointsRoutes.js';
import badgesRoutes from './routes/badgesRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import mistakesRoutes from './routes/mistakesRoutes.js';
import dialogueRoutes from './routes/dialogueRoutes.js';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 安全中间件
app.use(helmet());

// CORS 配置
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:5500', 'http://127.0.0.1:5500'];

app.use(cors({
    origin: (origin, callback) => {
        // 允许没有 origin 的请求（如 Postman）
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// 请求解析
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 日志记录
app.use(morgan('combined'));

// 速率限制
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 分钟
    max: 100, // 限制 100 个请求
    message: '请求过于频繁，请稍后再试'
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5, // 认证接口更严格：15分钟内最多5次
    message: '登录尝试过于频繁，请稍后再试'
});

app.use('/api/', limiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// 健康检查
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'AI FranchTeacher API'
    });
});

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/points', pointsRoutes);
app.use('/api/badges', badgesRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/mistakes', mistakesRoutes);
app.use('/api/dialogue', dialogueRoutes);

// 404 处理
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: '接口不存在'
    });
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error('Server error:', err);

    // CORS 错误
    if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({
            success: false,
            message: 'CORS 错误：不允许的来源'
        });
    }

    // JWT 错误
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: '无效的认证令牌'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: '认证令牌已过期'
        });
    }

    // 数据库错误
    if (err.code === '23505') { // PostgreSQL 唯一约束违反
        return res.status(400).json({
            success: false,
            message: '数据已存在'
        });
    }

    if (err.code === '23503') { // PostgreSQL 外键约束违反
        return res.status(400).json({
            success: false,
            message: '关联数据不存在'
        });
    }

    // 默认错误
    res.status(err.status || 500).json({
        success: false,
        message: err.message || '服务器内部错误',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// 启动服务器
async function startServer() {
    try {
        // 检查数据库连接
        await checkConnection();
        console.log('✓ Database connection established');

        // 启动服务器
        const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';
        app.listen(PORT, host, () => {
            console.log(`✓ Server running on http://${host}:${PORT}`);
            console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`✓ Allowed origins: ${allowedOrigins.join(', ')}`);
        });
    } catch (error) {
        console.error('✗ Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

export default app;
