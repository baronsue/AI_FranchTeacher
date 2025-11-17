const { query, getClient } = require('../config/database');

// ============================================
// 课程进度管理
// ============================================

// 获取课程进度
const getCourseProgress = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { courseId } = req.params;

        if (courseId) {
            // 获取特定课程的进度
            const result = await query(
                'SELECT * FROM user_course_progress WHERE user_id = $1 AND course_id = $2',
                [userId, courseId]
            );
            return res.json({
                success: true,
                data: result.rows[0] || null
            });
        }

        // 获取所有课程进度
        const result = await query(
            'SELECT * FROM user_course_progress WHERE user_id = $1 ORDER BY last_updated DESC',
            [userId]
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('获取课程进度错误:', error);
        res.status(500).json({
            success: false,
            error: '获取课程进度失败'
        });
    }
};

// 保存课程进度
const saveCourseProgress = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { courseId, progress } = req.body;

        const result = await query(
            `INSERT INTO user_course_progress (user_id, course_id, progress)
             VALUES ($1, $2, $3)
             ON CONFLICT (user_id, course_id)
             DO UPDATE SET progress = $3, last_updated = CURRENT_TIMESTAMP
             RETURNING *`,
            [userId, courseId, JSON.stringify(progress)]
        );

        res.json({
            success: true,
            message: '课程进度已保存',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('保存课程进度错误:', error);
        res.status(500).json({
            success: false,
            error: '保存课程进度失败'
        });
    }
};

// ============================================
// 练习管理
// ============================================

// 获取练习记录
const getExercises = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { exerciseId } = req.params;

        if (exerciseId) {
            const result = await query(
                'SELECT * FROM user_exercises WHERE user_id = $1 AND exercise_id = $2',
                [userId, exerciseId]
            );
            return res.json({
                success: true,
                data: result.rows[0] || null
            });
        }

        const result = await query(
            'SELECT * FROM user_exercises WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 50',
            [userId]
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('获取练习记录错误:', error);
        res.status(500).json({
            success: false,
            error: '获取练习记录失败'
        });
    }
};

// 保存练习答案
const saveExercise = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { exerciseId, answers, score, completed } = req.body;

        const result = await query(
            `INSERT INTO user_exercises (user_id, exercise_id, answers, score, completed, completed_at)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (user_id, exercise_id)
             DO UPDATE SET answers = $3, score = $4, completed = $5,
                          completed_at = $6, updated_at = CURRENT_TIMESTAMP
             RETURNING *`,
            [userId, exerciseId, JSON.stringify(answers), score, completed,
             completed ? new Date() : null]
        );

        res.json({
            success: true,
            message: '练习记录已保存',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('保存练习记录错误:', error);
        res.status(500).json({
            success: false,
            error: '保存练习记录失败'
        });
    }
};

// ============================================
// 积分系统
// ============================================

// 获取积分信息
const getPoints = async (req, res) => {
    try {
        const userId = req.user.userId;

        const result = await query(
            'SELECT * FROM user_points WHERE user_id = $1',
            [userId]
        );

        res.json({
            success: true,
            data: result.rows[0] || { total_points: 0, today_points: 0 }
        });
    } catch (error) {
        console.error('获取积分错误:', error);
        res.status(500).json({
            success: false,
            error: '获取积分失败'
        });
    }
};

// 添加积分
const addPoints = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { points, reason, activityType } = req.body;

        if (!points || points <= 0) {
            return res.status(400).json({
                success: false,
                error: '积分数量必须大于0'
            });
        }

        // 使用事务
        const client = await getClient();
        try {
            await client.query('BEGIN');

            // 更新积分
            const updateResult = await client.query(
                `INSERT INTO user_points (user_id, total_points, today_points)
                 VALUES ($1, $2, $2)
                 ON CONFLICT (user_id)
                 DO UPDATE SET
                    total_points = user_points.total_points + $2,
                    today_points = user_points.today_points + $2,
                    last_updated = CURRENT_TIMESTAMP
                 RETURNING *`,
                [userId, points]
            );

            // 记录积分历史
            await client.query(
                `INSERT INTO user_points_history (user_id, points, reason, activity_type)
                 VALUES ($1, $2, $3, $4)`,
                [userId, points, reason, activityType]
            );

            await client.query('COMMIT');

            res.json({
                success: true,
                message: '积分已添加',
                data: updateResult.rows[0]
            });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('添加积分错误:', error);
        res.status(500).json({
            success: false,
            error: '添加积分失败'
        });
    }
};

// 获取积分历史
const getPointsHistory = async (req, res) => {
    try {
        const userId = req.user.userId;
        const limit = parseInt(req.query.limit) || 100;

        const result = await query(
            `SELECT * FROM user_points_history
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
        console.error('获取积分历史错误:', error);
        res.status(500).json({
            success: false,
            error: '获取积分历史失败'
        });
    }
};

// ============================================
// 徽章系统
// ============================================

// 获取徽章
const getBadges = async (req, res) => {
    try {
        const userId = req.user.userId;

        const result = await query(
            'SELECT * FROM user_badges WHERE user_id = $1 ORDER BY earned_at DESC',
            [userId]
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('获取徽章错误:', error);
        res.status(500).json({
            success: false,
            error: '获取徽章失败'
        });
    }
};

// 添加徽章
const addBadge = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { badgeId, badgeName, badgeIcon } = req.body;

        const result = await query(
            `INSERT INTO user_badges (user_id, badge_id, badge_name, badge_icon)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (user_id, badge_id) DO NOTHING
             RETURNING *`,
            [userId, badgeId, badgeName, badgeIcon]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({
                success: false,
                error: '徽章已存在'
            });
        }

        res.json({
            success: true,
            message: '徽章已获得',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('添加徽章错误:', error);
        res.status(500).json({
            success: false,
            error: '添加徽章失败'
        });
    }
};

// ============================================
// 打卡系统
// ============================================

// 获取打卡记录
const getCheckins = async (req, res) => {
    try {
        const userId = req.user.userId;

        const result = await query(
            `SELECT * FROM user_checkins
             WHERE user_id = $1
             ORDER BY checkin_date DESC
             LIMIT 30`,
            [userId]
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('获取打卡记录错误:', error);
        res.status(500).json({
            success: false,
            error: '获取打卡记录失败'
        });
    }
};

// 每日打卡
const checkin = async (req, res) => {
    try {
        const userId = req.user.userId;
        const today = new Date().toISOString().split('T')[0];

        // 检查今天是否已打卡
        const checkResult = await query(
            'SELECT * FROM user_checkins WHERE user_id = $1 AND checkin_date = $2',
            [userId, today]
        );

        if (checkResult.rows.length > 0) {
            return res.status(400).json({
                success: false,
                error: '今天已经打卡过了'
            });
        }

        // 获取最近的打卡记录计算连续天数
        const lastCheckin = await query(
            `SELECT * FROM user_checkins
             WHERE user_id = $1
             ORDER BY checkin_date DESC
             LIMIT 1`,
            [userId]
        );

        let currentStreak = 1;
        let maxStreak = 1;

        if (lastCheckin.rows.length > 0) {
            const last = lastCheckin.rows[0];
            const lastDate = new Date(last.checkin_date);
            const todayDate = new Date(today);
            const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                // 连续打卡
                currentStreak = last.current_streak + 1;
                maxStreak = Math.max(currentStreak, last.max_streak);
            } else {
                // 中断了
                maxStreak = last.max_streak;
            }
        }

        // 插入打卡记录
        const result = await query(
            `INSERT INTO user_checkins (user_id, checkin_date, current_streak, max_streak)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [userId, today, currentStreak, maxStreak]
        );

        // 更新用户统计中的连续天数
        await query(
            `UPDATE user_stats
             SET current_streak = $1, max_streak = $2, last_study_date = $3
             WHERE user_id = $4`,
            [currentStreak, maxStreak, today, userId]
        );

        res.json({
            success: true,
            message: '打卡成功',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('打卡错误:', error);
        res.status(500).json({
            success: false,
            error: '打卡失败'
        });
    }
};

// ============================================
// 错题本
// ============================================

// 获取错题
const getMistakes = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { mastered } = req.query;

        let queryText = 'SELECT * FROM user_mistakes WHERE user_id = $1';
        const params = [userId];

        if (mastered !== undefined) {
            queryText += ' AND mastered = $2';
            params.push(mastered === 'true');
        }

        queryText += ' ORDER BY created_at DESC';

        const result = await query(queryText, params);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('获取错题错误:', error);
        res.status(500).json({
            success: false,
            error: '获取错题失败'
        });
    }
};

// 添加错题
const addMistake = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { exerciseId, questionText, userAnswer, correctAnswer, mistakeType } = req.body;

        const result = await query(
            `INSERT INTO user_mistakes (user_id, exercise_id, question_text, user_answer, correct_answer, mistake_type)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [userId, exerciseId, questionText, userAnswer, correctAnswer, mistakeType]
        );

        res.json({
            success: true,
            message: '错题已添加',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('添加错题错误:', error);
        res.status(500).json({
            success: false,
            error: '添加错题失败'
        });
    }
};

// 标记错题为已掌握
const markMasteredMistake = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;

        const result = await query(
            `UPDATE user_mistakes
             SET mastered = true, review_count = review_count + 1, last_reviewed = CURRENT_TIMESTAMP
             WHERE id = $1 AND user_id = $2
             RETURNING *`,
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: '错题不存在'
            });
        }

        res.json({
            success: true,
            message: '已标记为掌握',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('标记错题错误:', error);
        res.status(500).json({
            success: false,
            error: '标记错题失败'
        });
    }
};

// ============================================
// 学习统计
// ============================================

// 获取学习统计
const getStats = async (req, res) => {
    try {
        const userId = req.user.userId;

        const result = await query(
            'SELECT * FROM user_stats WHERE user_id = $1',
            [userId]
        );

        res.json({
            success: true,
            data: result.rows[0] || {}
        });
    } catch (error) {
        console.error('获取统计错误:', error);
        res.status(500).json({
            success: false,
            error: '获取统计失败'
        });
    }
};

// 更新学习统计
const updateStats = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { studyTime, wordsLearned, coursesCompleted, exercisesCompleted, dialoguesCompleted } = req.body;

        const updates = [];
        const params = [userId];
        let paramCount = 2;

        if (studyTime !== undefined) {
            updates.push(`total_study_time = total_study_time + $${paramCount}`);
            params.push(studyTime);
            paramCount++;
        }
        if (wordsLearned !== undefined) {
            updates.push(`words_learned = words_learned + $${paramCount}`);
            params.push(wordsLearned);
            paramCount++;
        }
        if (coursesCompleted !== undefined) {
            updates.push(`courses_completed = courses_completed + $${paramCount}`);
            params.push(coursesCompleted);
            paramCount++;
        }
        if (exercisesCompleted !== undefined) {
            updates.push(`exercises_completed = exercises_completed + $${paramCount}`);
            params.push(exercisesCompleted);
            paramCount++;
        }
        if (dialoguesCompleted !== undefined) {
            updates.push(`dialogues_completed = dialogues_completed + $${paramCount}`);
            params.push(dialoguesCompleted);
            paramCount++;
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                error: '没有提供更新数据'
            });
        }

        const queryText = `
            INSERT INTO user_stats (user_id) VALUES ($1)
            ON CONFLICT (user_id)
            DO UPDATE SET ${updates.join(', ')}, last_study_date = CURRENT_DATE
            RETURNING *
        `;

        const result = await query(queryText, params);

        res.json({
            success: true,
            message: '统计已更新',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('更新统计错误:', error);
        res.status(500).json({
            success: false,
            error: '更新统计失败'
        });
    }
};

// ============================================
// 对话历史
// ============================================

// 获取对话历史
const getDialogueHistory = async (req, res) => {
    try {
        const userId = req.user.userId;
        const limit = parseInt(req.query.limit) || 50;

        const result = await query(
            `SELECT * FROM dialogue_history
             WHERE user_id = $1
             ORDER BY created_at DESC
             LIMIT $2`,
            [userId, limit]
        );

        res.json({
            success: true,
            data: result.rows.reverse() // 按时间正序返回
        });
    } catch (error) {
        console.error('获取对话历史错误:', error);
        res.status(500).json({
            success: false,
            error: '获取对话历史失败'
        });
    }
};

// 保存对话
const saveDialogue = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { role, content, scenario } = req.body;

        const result = await query(
            `INSERT INTO dialogue_history (user_id, role, content, scenario)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [userId, role, content, scenario]
        );

        res.json({
            success: true,
            message: '对话已保存',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('保存对话错误:', error);
        res.status(500).json({
            success: false,
            error: '保存对话失败'
        });
    }
};

// ============================================
// 排行榜
// ============================================

// 获取排行榜
const getLeaderboard = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;

        const result = await query(
            `SELECT * FROM leaderboard LIMIT $1`,
            [limit]
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('获取排行榜错误:', error);
        res.status(500).json({
            success: false,
            error: '获取排行榜失败'
        });
    }
};

module.exports = {
    getCourseProgress,
    saveCourseProgress,
    getExercises,
    saveExercise,
    getPoints,
    addPoints,
    getPointsHistory,
    getBadges,
    addBadge,
    getCheckins,
    checkin,
    getMistakes,
    addMistake,
    markMasteredMistake,
    getStats,
    updateStats,
    getDialogueHistory,
    saveDialogue,
    getLeaderboard
};
