/**
 * 学习统计控制器
 */

import { query, getClient } from '../config/database.js';

/**
 * 获取用户学习统计
 */
export const getUserStats = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await query(
            `SELECT courses_completed, exercises_completed, correct_answers,
                    wrong_answers, words_learned, conversation_rounds,
                    total_study_time, current_streak, max_streak, last_study_date
             FROM user_stats
             WHERE user_id = $1`,
            [userId]
        );

        if (result.rows.length === 0) {
            return res.json({
                success: true,
                data: {
                    coursesCompleted: 0,
                    exercisesCompleted: 0,
                    correctAnswers: 0,
                    wrongAnswers: 0,
                    wordsLearned: 0,
                    conversationRounds: 0,
                    totalStudyTime: 0,
                    currentStreak: 0,
                    maxStreak: 0,
                    lastStudyDate: null
                }
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Get user stats error:', error);
        res.status(500).json({
            success: false,
            message: '获取学习统计失败'
        });
    }
};

/**
 * 更新学习统计
 */
export const updateStats = async (req, res) => {
    const client = await getClient();

    try {
        const userId = req.user.id;
        const {
            coursesCompleted,
            exercisesCompleted,
            correctAnswers,
            wrongAnswers,
            wordsLearned,
            conversationRounds,
            totalStudyTime
        } = req.body;

        await client.query('BEGIN');

        // 检查记录是否存在
        const existing = await client.query(
            'SELECT id FROM user_stats WHERE user_id = $1',
            [userId]
        );

        const updates = [];
        const values = [userId];
        let paramIndex = 2;

        // 构建增量更新
        if (coursesCompleted !== undefined) {
            updates.push(`courses_completed = courses_completed + $${paramIndex}`);
            values.push(coursesCompleted);
            paramIndex++;
        }

        if (exercisesCompleted !== undefined) {
            updates.push(`exercises_completed = exercises_completed + $${paramIndex}`);
            values.push(exercisesCompleted);
            paramIndex++;
        }

        if (correctAnswers !== undefined) {
            updates.push(`correct_answers = correct_answers + $${paramIndex}`);
            values.push(correctAnswers);
            paramIndex++;
        }

        if (wrongAnswers !== undefined) {
            updates.push(`wrong_answers = wrong_answers + $${paramIndex}`);
            values.push(wrongAnswers);
            paramIndex++;
        }

        if (wordsLearned !== undefined) {
            updates.push(`words_learned = words_learned + $${paramIndex}`);
            values.push(wordsLearned);
            paramIndex++;
        }

        if (conversationRounds !== undefined) {
            updates.push(`conversation_rounds = conversation_rounds + $${paramIndex}`);
            values.push(conversationRounds);
            paramIndex++;
        }

        if (totalStudyTime !== undefined) {
            updates.push(`total_study_time = total_study_time + $${paramIndex}`);
            values.push(totalStudyTime);
            paramIndex++;
        }

        updates.push(`last_study_date = CURRENT_TIMESTAMP`);

        let result;

        if (existing.rows.length === 0) {
            // 创建新记录
            result = await client.query(
                `INSERT INTO user_stats
                (user_id, courses_completed, exercises_completed, correct_answers,
                 wrong_answers, words_learned, conversation_rounds, total_study_time,
                 current_streak, max_streak, last_study_date)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, 0, CURRENT_TIMESTAMP)
                RETURNING *`,
                [
                    userId,
                    coursesCompleted || 0,
                    exercisesCompleted || 0,
                    correctAnswers || 0,
                    wrongAnswers || 0,
                    wordsLearned || 0,
                    conversationRounds || 0,
                    totalStudyTime || 0
                ]
            );
        } else if (updates.length > 0) {
            // 更新现有记录
            result = await client.query(
                `UPDATE user_stats
                 SET ${updates.join(', ')}
                 WHERE user_id = $1
                 RETURNING *`,
                values
            );
        }

        await client.query('COMMIT');

        res.json({
            success: true,
            message: '学习统计已更新',
            data: result.rows[0]
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Update stats error:', error);
        res.status(500).json({
            success: false,
            message: '更新学习统计失败'
        });
    } finally {
        client.release();
    }
};

/**
 * 每日打卡
 */
export const dailyCheckIn = async (req, res) => {
    const client = await getClient();

    try {
        const userId = req.user.id;
        const today = new Date().toDateString();

        await client.query('BEGIN');

        // 检查今天是否已打卡
        const todayCheckIn = await client.query(
            `SELECT id FROM user_checkins
             WHERE user_id = $1 AND DATE(checkin_date) = CURRENT_DATE`,
            [userId]
        );

        if (todayCheckIn.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: '今天已经打卡过了'
            });
        }

        // 添加打卡记录
        await client.query(
            'INSERT INTO user_checkins (user_id, checkin_date) VALUES ($1, CURRENT_TIMESTAMP)',
            [userId]
        );

        // 计算连续天数
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const yesterdayCheckIn = await client.query(
            `SELECT id FROM user_checkins
             WHERE user_id = $1 AND DATE(checkin_date) = $2`,
            [userId, yesterday.toISOString().split('T')[0]]
        );

        // 更新用户统计中的连续天数
        const statsResult = await client.query(
            `SELECT current_streak, max_streak FROM user_stats WHERE user_id = $1`,
            [userId]
        );

        let currentStreak = 1;
        let maxStreak = 1;

        if (statsResult.rows.length > 0) {
            const stats = statsResult.rows[0];
            if (yesterdayCheckIn.rows.length > 0) {
                // 连续打卡
                currentStreak = stats.current_streak + 1;
            } else {
                // 中断了，重新开始
                currentStreak = 1;
            }
            maxStreak = Math.max(currentStreak, stats.max_streak);

            await client.query(
                `UPDATE user_stats
                 SET current_streak = $2, max_streak = $3
                 WHERE user_id = $1`,
                [userId, currentStreak, maxStreak]
            );
        } else {
            // 首次打卡，创建统计记录
            await client.query(
                `INSERT INTO user_stats (user_id, current_streak, max_streak)
                 VALUES ($1, 1, 1)`,
                [userId]
            );
        }

        // 添加打卡积分
        const DAILY_LOGIN_POINTS = 10;
        await client.query(
            `INSERT INTO user_points (user_id, total_points, daily_points, last_updated)
             VALUES ($1, $2, $2, CURRENT_TIMESTAMP)
             ON CONFLICT (user_id) DO UPDATE
             SET total_points = user_points.total_points + $2,
                 daily_points = user_points.daily_points + $2,
                 last_updated = CURRENT_TIMESTAMP`,
            [userId, DAILY_LOGIN_POINTS]
        );

        await client.query(
            `INSERT INTO points_history (user_id, amount, reason, created_at)
             VALUES ($1, $2, '每日打卡', CURRENT_TIMESTAMP)`,
            [userId, DAILY_LOGIN_POINTS]
        );

        await client.query('COMMIT');

        res.json({
            success: true,
            message: '打卡成功',
            data: {
                currentStreak,
                maxStreak,
                points: DAILY_LOGIN_POINTS
            }
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Daily check-in error:', error);
        res.status(500).json({
            success: false,
            message: '打卡失败'
        });
    } finally {
        client.release();
    }
};

/**
 * 获取打卡历史
 */
export const getCheckInHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const limit = parseInt(req.query.limit) || 30;

        const result = await query(
            `SELECT checkin_date
             FROM user_checkins
             WHERE user_id = $1
             ORDER BY checkin_date DESC
             LIMIT $2`,
            [userId, limit]
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Get check-in history error:', error);
        res.status(500).json({
            success: false,
            message: '获取打卡历史失败'
        });
    }
};
