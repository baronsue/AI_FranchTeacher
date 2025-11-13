/**
 * 错题本控制器
 */

import { query, getClient } from '../config/database.js';

/**
 * 获取用户错题
 */
export const getMistakes = async (req, res) => {
    try {
        const userId = req.user.id;
        const unreviewedOnly = req.query.unreviewedOnly === 'true';

        let sql = `
            SELECT id, question_id, exercise_type, question, user_answer,
                   correct_answer, wrong_count, reviewed, last_attempt, reviewed_at
            FROM user_mistakes
            WHERE user_id = $1
        `;

        if (unreviewedOnly) {
            sql += ' AND reviewed = false';
        }

        sql += ' ORDER BY wrong_count DESC, last_attempt DESC';

        const result = await query(sql, [userId]);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Get mistakes error:', error);
        res.status(500).json({
            success: false,
            message: '获取错题失败'
        });
    }
};

/**
 * 记录错题
 */
export const recordMistake = async (req, res) => {
    const client = await getClient();

    try {
        const userId = req.user.id;
        const { questionId, exerciseType, question, userAnswer, correctAnswer } = req.body;

        if (!questionId || !question || !correctAnswer) {
            return res.status(400).json({
                success: false,
                message: '缺少必填字段'
            });
        }

        await client.query('BEGIN');

        // 检查是否已存在该错题
        const existing = await client.query(
            'SELECT id, wrong_count FROM user_mistakes WHERE user_id = $1 AND question_id = $2',
            [userId, questionId]
        );

        let result;

        if (existing.rows.length === 0) {
            // 创建新错题记录
            result = await client.query(
                `INSERT INTO user_mistakes
                (user_id, question_id, exercise_type, question, user_answer, correct_answer, wrong_count, last_attempt)
                VALUES ($1, $2, $3, $4, $5, $6, 1, CURRENT_TIMESTAMP)
                RETURNING *`,
                [userId, questionId, exerciseType, question, userAnswer, correctAnswer]
            );
        } else {
            // 更新错误次数
            result = await client.query(
                `UPDATE user_mistakes
                 SET wrong_count = wrong_count + 1,
                     user_answer = $3,
                     last_attempt = CURRENT_TIMESTAMP,
                     reviewed = false
                 WHERE user_id = $1 AND question_id = $2
                 RETURNING *`,
                [userId, questionId, userAnswer]
            );
        }

        await client.query('COMMIT');

        res.json({
            success: true,
            message: '错题已记录',
            data: result.rows[0]
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Record mistake error:', error);
        res.status(500).json({
            success: false,
            message: '记录错题失败'
        });
    } finally {
        client.release();
    }
};

/**
 * 标记错题为已复习
 */
export const markReviewed = async (req, res) => {
    const client = await getClient();

    try {
        const userId = req.user.id;
        const { mistakeId } = req.params;

        await client.query('BEGIN');

        const result = await client.query(
            `UPDATE user_mistakes
             SET reviewed = true, reviewed_at = CURRENT_TIMESTAMP
             WHERE id = $1 AND user_id = $2
             RETURNING *`,
            [mistakeId, userId]
        );

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: '错题不存在'
            });
        }

        // 添加复习积分
        const REVIEW_POINTS = 10;
        await client.query(
            `INSERT INTO user_points (user_id, total_points, daily_points, last_updated)
             VALUES ($1, $2, $2, CURRENT_TIMESTAMP)
             ON CONFLICT (user_id) DO UPDATE
             SET total_points = user_points.total_points + $2,
                 daily_points = user_points.daily_points + $2,
                 last_updated = CURRENT_TIMESTAMP`,
            [userId, REVIEW_POINTS]
        );

        await client.query(
            `INSERT INTO points_history (user_id, amount, reason, created_at)
             VALUES ($1, $2, '复习错题', CURRENT_TIMESTAMP)`,
            [userId, REVIEW_POINTS]
        );

        await client.query('COMMIT');

        res.json({
            success: true,
            message: '已标记为已复习',
            data: result.rows[0]
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Mark reviewed error:', error);
        res.status(500).json({
            success: false,
            message: '标记失败'
        });
    } finally {
        client.release();
    }
};

/**
 * 删除错题
 */
export const deleteMistake = async (req, res) => {
    try {
        const userId = req.user.id;
        const { mistakeId } = req.params;

        const result = await query(
            'DELETE FROM user_mistakes WHERE id = $1 AND user_id = $2 RETURNING id',
            [mistakeId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '错题不存在'
            });
        }

        res.json({
            success: true,
            message: '错题已删除'
        });
    } catch (error) {
        console.error('Delete mistake error:', error);
        res.status(500).json({
            success: false,
            message: '删除错题失败'
        });
    }
};
