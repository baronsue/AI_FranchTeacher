const bcrypt = require('bcrypt');
const { query } = require('../config/database');
const {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken
} = require('../middleware/auth');

// 用户注册
const register = async (req, res) => {
    try {
        const { username, email, password, displayName } = req.body;

        // 验证输入
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                error: '用户名、邮箱和密码为必填项'
            });
        }

        // 检查用户名是否已存在
        const userCheck = await query(
            'SELECT id FROM users WHERE username = $1 OR email = $2',
            [username, email]
        );

        if (userCheck.rows.length > 0) {
            return res.status(400).json({
                success: false,
                error: '用户名或邮箱已被使用'
            });
        }

        // 密码强度验证
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                error: '密码长度至少为6个字符'
            });
        }

        // 加密密码
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // 插入新用户
        const result = await query(
            `INSERT INTO users (username, email, password_hash, display_name)
             VALUES ($1, $2, $3, $4)
             RETURNING id, username, email, display_name, avatar, created_at`,
            [username, email, passwordHash, displayName || username]
        );

        const user = result.rows[0];

        // 初始化用户数据
        await Promise.all([
            // 初始化积分
            query(
                'INSERT INTO user_points (user_id, total_points, today_points) VALUES ($1, 0, 0)',
                [user.id]
            ),
            // 初始化统计
            query(
                'INSERT INTO user_stats (user_id) VALUES ($1)',
                [user.id]
            )
        ]);

        // 生成令牌
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        // 存储刷新令牌
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        await query(
            `INSERT INTO user_sessions (user_id, token, refresh_token, expires_at)
             VALUES ($1, $2, $3, $4)`,
            [user.id, accessToken, refreshToken, expiresAt]
        );

        res.status(201).json({
            success: true,
            message: '注册成功',
            data: {
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    displayName: user.display_name,
                    avatar: user.avatar
                },
                accessToken,
                refreshToken
            }
        });
    } catch (error) {
        console.error('注册错误:', error);
        res.status(500).json({
            success: false,
            error: '注册失败，请稍后重试'
        });
    }
};

// 用户登录
const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                error: '用户名和密码为必填项'
            });
        }

        // 查找用户（支持用户名或邮箱登录）
        const result = await query(
            `SELECT id, username, email, password_hash, display_name, avatar, is_active
             FROM users
             WHERE username = $1 OR email = $1`,
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                error: '用户名或密码错误'
            });
        }

        const user = result.rows[0];

        // 检查账户是否激活
        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                error: '账户已被禁用'
            });
        }

        // 验证密码
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                error: '用户名或密码错误'
            });
        }

        // 更新最后登录时间
        await query(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
            [user.id]
        );

        // 生成令牌
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        // 存储会话
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        await query(
            `INSERT INTO user_sessions (user_id, token, refresh_token, expires_at)
             VALUES ($1, $2, $3, $4)`,
            [user.id, accessToken, refreshToken, expiresAt]
        );

        res.json({
            success: true,
            message: '登录成功',
            data: {
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    displayName: user.display_name,
                    avatar: user.avatar
                },
                accessToken,
                refreshToken
            }
        });
    } catch (error) {
        console.error('登录错误:', error);
        res.status(500).json({
            success: false,
            error: '登录失败，请稍后重试'
        });
    }
};

// 刷新令牌
const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                error: '未提供刷新令牌'
            });
        }

        // 验证刷新令牌
        const decoded = verifyRefreshToken(refreshToken);

        if (!decoded) {
            return res.status(403).json({
                success: false,
                error: '无效的刷新令牌'
            });
        }

        // 检查刷新令牌是否存在于数据库
        const sessionCheck = await query(
            'SELECT user_id FROM user_sessions WHERE refresh_token = $1 AND expires_at > CURRENT_TIMESTAMP',
            [refreshToken]
        );

        if (sessionCheck.rows.length === 0) {
            return res.status(403).json({
                success: false,
                error: '刷新令牌已过期或不存在'
            });
        }

        // 获取用户信息
        const userResult = await query(
            'SELECT id, username, email, display_name, avatar FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: '用户不存在'
            });
        }

        const user = userResult.rows[0];

        // 生成新的访问令牌
        const newAccessToken = generateAccessToken(user);

        // 更新会话
        await query(
            'UPDATE user_sessions SET token = $1 WHERE refresh_token = $2',
            [newAccessToken, refreshToken]
        );

        res.json({
            success: true,
            data: {
                accessToken: newAccessToken
            }
        });
    } catch (error) {
        console.error('刷新令牌错误:', error);
        res.status(500).json({
            success: false,
            error: '令牌刷新失败'
        });
    }
};

// 登出
const logout = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        const userId = req.user.userId;

        if (refreshToken) {
            // 删除指定的会话
            await query(
                'DELETE FROM user_sessions WHERE user_id = $1 AND refresh_token = $2',
                [userId, refreshToken]
            );
        } else {
            // 删除用户的所有会话
            await query(
                'DELETE FROM user_sessions WHERE user_id = $1',
                [userId]
            );
        }

        res.json({
            success: true,
            message: '登出成功'
        });
    } catch (error) {
        console.error('登出错误:', error);
        res.status(500).json({
            success: false,
            error: '登出失败'
        });
    }
};

// 获取当前用户信息
const getCurrentUser = async (req, res) => {
    try {
        const userId = req.user.userId;

        const result = await query(
            `SELECT u.id, u.username, u.email, u.display_name, u.avatar, u.created_at, u.last_login,
                    p.total_points, p.today_points,
                    s.total_study_time, s.words_learned, s.current_streak
             FROM users u
             LEFT JOIN user_points p ON u.id = p.user_id
             LEFT JOIN user_stats s ON u.id = s.user_id
             WHERE u.id = $1`,
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: '用户不存在'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('获取用户信息错误:', error);
        res.status(500).json({
            success: false,
            error: '获取用户信息失败'
        });
    }
};

module.exports = {
    register,
    login,
    refreshToken,
    logout,
    getCurrentUser
};
