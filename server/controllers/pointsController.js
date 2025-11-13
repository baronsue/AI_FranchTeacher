/**
 * 积分控制器
 */

import { query, getClient } from '../config/database.js';

/**
 * 获取用户积分
 */
export const getPoints = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await query(
            `SELECT total_points, daily_points, last_updated
             FROM user_points
             WHERE user_id = $1`,
            [userId]
        );

        if (result.rows.length === 0) {
            return res.json({
                success: true,
                data: {
                    total: 0,
                    today: 0,
                    lastUpdated: new Date().toISOString()
                }
            });
        }

        const points = result.rows[0];
        const today = new Date().toDateString();
        const lastDate = new Date(points.last_updated).toDateString();

        // 如果是新的一天，返回时重置今日积分
        const dailyPoints = today === lastDate ? points.daily_points : 0;

        res.json({
            success: true,
            data: {
                total: points.total_points,
                today: dailyPoints,
                lastUpdated: points.last_updated
            }
        });
    } catch (error) {
        console.error('Get points error:', error);
        res.status(500).json({
            success: false,
            message: '获取积分失败'
        });
    }
};

/**
 * 添加积分
 */
export const addPoints = async (req, res) => {
    const client = await getClient();

    try {
        const userId = req.user.id;
        const { amount, reason } = req.body;

        if (!amount || typeof amount !== 'number') {
            return res.status(400).json({
                success: false,
                message: '积分数量必须是数字'
            });
        }

        await client.query('BEGIN');

        // 检查用户积分记录是否存在
        const existing = await client.query(
            'SELECT total_points, daily_points, last_updated FROM user_points WHERE user_id = $1',
            [userId]
        );

        let totalPoints, dailyPoints;
        const today = new Date().toDateString();

        if (existing.rows.length === 0) {
            // 创建新记录
            const result = await client.query(
                `INSERT INTO user_points (user_id, total_points, daily_points, last_updated)
                 VALUES ($1, $2, $2, CURRENT_TIMESTAMP)
                 RETURNING total_points, daily_points`,
                [userId, amount]
            );
            totalPoints = result.rows[0].total_points;
            dailyPoints = result.rows[0].daily_points;
        } else {
            // 更新现有记录
            const lastDate = new Date(existing.rows[0].last_updated).toDateString();
            const resetDaily = today !== lastDate;

            const result = await client.query(
                `UPDATE user_points
                 SET total_points = total_points + $2,
                     daily_points = CASE WHEN $3 THEN $2 ELSE daily_points + $2 END,
                     last_updated = CURRENT_TIMESTAMP
                 WHERE user_id = $1
                 RETURNING total_points, daily_points`,
                [userId, amount, resetDaily]
            );
            totalPoints = result.rows[0].total_points;
            dailyPoints = result.rows[0].daily_points;
        }

        // 记录积分历史
        await client.query(
            `INSERT INTO points_history (user_id, amount, reason, created_at)
             VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
            [userId, amount, reason || '']
        );

        await client.query('COMMIT');

        res.json({
            success: true,
            message: '积分已添加',
            data: {
                total: totalPoints,
                today: dailyPoints,
                added: amount
            }
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Add points error:', error);
        res.status(500).json({
            success: false,
            message: '添加积分失败'
        });
    } finally {
        client.release();
    }
};

/**
 * 获取积分历史
 */
export const getPointsHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const limit = parseInt(req.query.limit) || 20;

        const result = await query(
            `SELECT amount, reason, created_at
             FROM points_history
             WHERE user_id = $1
             ORDER BY created_at DESC
             LIMIT $2`,
            [userId, limit]
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Get points history error:', error);
        res.status(500).json({
            success: false,
            message: '获取积分历史失败'
        });
    }
};
