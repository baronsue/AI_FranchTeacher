/**
 * 课程进度控制器
 */

import { query, getClient } from '../config/database.js';

/**
 * 获取用户所有课程进度
 */
export const getAllProgress = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await query(
            `SELECT course_id, started, completed, score, attempts,
                    last_attempt, time_spent, exercises_completed,
                    started_at, completed_at, created_at, updated_at
             FROM user_progress
             WHERE user_id = $1
             ORDER BY created_at ASC`,
            [userId]
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Get all progress error:', error);
        res.status(500).json({
            success: false,
            message: '获取课程进度失败'
        });
    }
};

/**
 * 获取单个课程进度
 */
export const getCourseProgress = async (req, res) => {
    try {
        const userId = req.user.id;
        const { courseId } = req.params;

        const result = await query(
            `SELECT course_id, started, completed, score, attempts,
                    last_attempt, time_spent, exercises_completed,
                    started_at, completed_at
             FROM user_progress
             WHERE user_id = $1 AND course_id = $2`,
            [userId, courseId]
        );

        if (result.rows.length === 0) {
            return res.json({
                success: true,
                data: {
                    courseId,
                    started: false,
                    completed: false,
                    score: 0,
                    attempts: 0,
                    timeSpent: 0,
                    exercisesCompleted: []
                }
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Get course progress error:', error);
        res.status(500).json({
            success: false,
            message: '获取课程进度失败'
        });
    }
};

/**
 * 更新课程进度
 */
export const updateProgress = async (req, res) => {
    const client = await getClient();

    try {
        const userId = req.user.id;
        const { courseId } = req.params;
        const {
            started,
            completed,
            score,
            attempts,
            timeSpent,
            exercisesCompleted
        } = req.body;

        await client.query('BEGIN');

        // 检查记录是否存在
        const existing = await client.query(
            'SELECT id FROM user_progress WHERE user_id = $1 AND course_id = $2',
            [userId, courseId]
        );

        let result;

        if (existing.rows.length === 0) {
            // 创建新记录
            result = await client.query(
                `INSERT INTO user_progress
                (user_id, course_id, started, completed, score, attempts, time_spent, exercises_completed, started_at, completed_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8,
                    CASE WHEN $3 = true THEN CURRENT_TIMESTAMP ELSE NULL END,
                    CASE WHEN $4 = true THEN CURRENT_TIMESTAMP ELSE NULL END)
                RETURNING *`,
                [
                    userId,
                    courseId,
                    started || false,
                    completed || false,
                    score || 0,
                    attempts || 0,
                    timeSpent || 0,
                    JSON.stringify(exercisesCompleted || [])
                ]
            );
        } else {
            // 更新现有记录
            const updates = [];
            const values = [userId, courseId];
            let paramIndex = 3;

            if (started !== undefined) {
                updates.push(`started = $${paramIndex}`);
                values.push(started);
                paramIndex++;

                if (started) {
                    updates.push(`started_at = COALESCE(started_at, CURRENT_TIMESTAMP)`);
                }
            }

            if (completed !== undefined) {
                updates.push(`completed = $${paramIndex}`);
                values.push(completed);
                paramIndex++;

                if (completed) {
                    updates.push(`completed_at = CURRENT_TIMESTAMP`);
                }
            }

            if (score !== undefined) {
                updates.push(`score = GREATEST(score, $${paramIndex})`);
                values.push(score);
                paramIndex++;
            }

            if (attempts !== undefined) {
                updates.push(`attempts = $${paramIndex}`);
                values.push(attempts);
                paramIndex++;
            }

            if (timeSpent !== undefined) {
                updates.push(`time_spent = time_spent + $${paramIndex}`);
                values.push(timeSpent);
                paramIndex++;
            }

            if (exercisesCompleted !== undefined) {
                updates.push(`exercises_completed = $${paramIndex}`);
                values.push(JSON.stringify(exercisesCompleted));
                paramIndex++;
            }

            updates.push(`last_attempt = CURRENT_TIMESTAMP`);

            if (updates.length > 0) {
                result = await client.query(
                    `UPDATE user_progress
                     SET ${updates.join(', ')}
                     WHERE user_id = $1 AND course_id = $2
                     RETURNING *`,
                    values
                );
            }
        }

        await client.query('COMMIT');

        res.json({
            success: true,
            message: '课程进度已更新',
            data: result.rows[0]
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Update progress error:', error);
        res.status(500).json({
            success: false,
            message: '更新课程进度失败'
        });
    } finally {
        client.release();
    }
};

/**
 * 删除课程进度（重置）
 */
export const resetProgress = async (req, res) => {
    try {
        const userId = req.user.id;
        const { courseId } = req.params;

        await query(
            'DELETE FROM user_progress WHERE user_id = $1 AND course_id = $2',
            [userId, courseId]
        );

        res.json({
            success: true,
            message: '课程进度已重置'
        });
    } catch (error) {
        console.error('Reset progress error:', error);
        res.status(500).json({
            success: false,
            message: '重置课程进度失败'
        });
    }
};
