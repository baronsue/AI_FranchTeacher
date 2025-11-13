/**
 * 认证控制器 - 注册、登录、密码重置
 */

import bcrypt from 'bcryptjs';
import { query, getClient } from '../config/database.js';
import { generateToken } from '../middleware/auth.js';

/**
 * 用户注册
 */
export const register = async (req, res) => {
    const client = await getClient();

    try {
        const { email, username, password, displayName } = req.body;

        // 验证必填字段
        if (!email || !username || !password) {
            return res.status(400).json({
                success: false,
                message: '邮箱、用户名和密码为必填项',
            });
        }

        // 验证邮箱格式
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: '邮箱格式不正确',
            });
        }

        // 验证用户名长度和格式
        if (username.length < 3 || username.length > 20) {
            return res.status(400).json({
                success: false,
                message: '用户名长度必须在3-20个字符之间',
            });
        }

        const usernameRegex = /^[a-zA-Z0-9_]+$/;
        if (!usernameRegex.test(username)) {
            return res.status(400).json({
                success: false,
                message: '用户名只能包含字母、数字和下划线',
            });
        }

        // 验证密码强度
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: '密码长度至少为6个字符',
            });
        }

        await client.query('BEGIN');

        // 检查邮箱是否已被注册
        const emailCheck = await client.query('SELECT id FROM users WHERE email = $1', [email]);
        if (emailCheck.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: '该邮箱已被注册',
            });
        }

        // 检查用户名是否已被占用
        const usernameCheck = await client.query('SELECT id FROM users WHERE username = $1', [
            username,
        ]);
        if (usernameCheck.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: '该用户名已被占用',
            });
        }

        // 加密密码
        const passwordHash = await bcrypt.hash(password, 10);

        // 创建用户
        const userResult = await client.query(
            `INSERT INTO users (email, username, password_hash, display_name)
             VALUES ($1, $2, $3, $4)
             RETURNING id, email, username, display_name, created_at`,
            [email, username, passwordHash, displayName || username]
        );

        const user = userResult.rows[0];

        // 初始化用户积分
        await client.query('INSERT INTO user_points (user_id, total_points, daily_points) VALUES ($1, 0, 0)', [
            user.id,
        ]);

        // 初始化用户统计
        await client.query('INSERT INTO user_stats (user_id) VALUES ($1)', [user.id]);

        await client.query('COMMIT');

        // 生成 token
        const token = generateToken(user.id);

        res.status(201).json({
            success: true,
            message: '注册成功',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    username: user.username,
                    displayName: user.display_name,
                    createdAt: user.created_at,
                },
                token,
            },
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            message: '注册失败，请稍后重试',
        });
    } finally {
        client.release();
    }
};

/**
 * 用户登录
 */
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 验证必填字段
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: '邮箱和密码为必填项',
            });
        }

        // 查找用户（可以用邮箱或用户名登录）
        const result = await query(
            'SELECT id, email, username, display_name, password_hash, is_active, avatar_url FROM users WHERE email = $1 OR username = $1',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: '邮箱或密码错误',
            });
        }

        const user = result.rows[0];

        // 检查账号是否被禁用
        if (!user.is_active) {
            return res.status(401).json({
                success: false,
                message: '账号已被禁用',
            });
        }

        // 验证密码
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: '邮箱或密码错误',
            });
        }

        // 更新最后登录时间
        await query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

        // 生成 token
        const token = generateToken(user.id);

        res.json({
            success: true,
            message: '登录成功',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    username: user.username,
                    displayName: user.display_name,
                    avatarUrl: user.avatar_url,
                },
                token,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: '登录失败，请稍后重试',
        });
    }
};

/**
 * 获取当前用户信息
 */
export const getCurrentUser = async (req, res) => {
    try {
        const userId = req.user.id;

        // 获取用户详细信息
        const userResult = await query(
            `SELECT u.id, u.email, u.username, u.display_name, u.avatar_url, u.created_at,
                    up.total_points, up.daily_points,
                    us.courses_completed, us.current_streak, us.max_streak, us.total_study_time
             FROM users u
             LEFT JOIN user_points up ON u.id = up.user_id
             LEFT JOIN user_stats us ON u.id = us.user_id
             WHERE u.id = $1`,
            [userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '用户不存在',
            });
        }

        const user = userResult.rows[0];

        // 获取徽章数量
        const badgesResult = await query('SELECT COUNT(*) FROM user_badges WHERE user_id = $1', [
            userId,
        ]);

        res.json({
            success: true,
            data: {
                ...user,
                badgesCount: parseInt(badgesResult.rows[0].count),
            },
        });
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({
            success: false,
            message: '获取用户信息失败',
        });
    }
};

/**
 * 更新用户资料
 */
export const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { displayName, avatarUrl } = req.body;

        const updates = [];
        const values = [];
        let paramIndex = 1;

        if (displayName !== undefined) {
            updates.push(`display_name = $${paramIndex++}`);
            values.push(displayName);
        }

        if (avatarUrl !== undefined) {
            updates.push(`avatar_url = $${paramIndex++}`);
            values.push(avatarUrl);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: '没有要更新的字段',
            });
        }

        values.push(userId);

        const result = await query(
            `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING id, email, username, display_name, avatar_url`,
            values
        );

        res.json({
            success: true,
            message: '资料更新成功',
            data: result.rows[0],
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: '更新资料失败',
        });
    }
};

/**
 * 修改密码
 */
export const changePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: '当前密码和新密码为必填项',
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: '新密码长度至少为6个字符',
            });
        }

        // 获取当前密码
        const result = await query('SELECT password_hash FROM users WHERE id = $1', [userId]);
        const user = result.rows[0];

        // 验证当前密码
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: '当前密码错误',
            });
        }

        // 加密新密码
        const newPasswordHash = await bcrypt.hash(newPassword, 10);

        // 更新密码
        await query('UPDATE users SET password_hash = $1 WHERE id = $2', [newPasswordHash, userId]);

        res.json({
            success: true,
            message: '密码修改成功',
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: '密码修改失败',
        });
    }
};
