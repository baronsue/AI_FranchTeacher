/**
 * 徽章控制器
 */

import { query, getClient } from '../config/database.js';

// 徽章定义（与前端保持一致）
const BADGES = {
    first_lesson: { id: 'first_lesson', name: '初识法语', description: '完成第一课', icon: '🎯', points: 10 },
    streak_3: { id: 'streak_3', name: '坚持三天', description: '连续学习3天', icon: '🔥', points: 30 },
    streak_7: { id: 'streak_7', name: '一周学霸', description: '连续学习7天', icon: '⭐', points: 70 },
    streak_30: { id: 'streak_30', name: '月度冠军', description: '连续学习30天', icon: '👑', points: 300 },
    perfect_score: { id: 'perfect_score', name: '完美答题', description: '某课练习全对', icon: '💯', points: 50 },
    fast_learner: { id: 'fast_learner', name: '快速学习者', description: '1小时内完成3课', icon: '⚡', points: 40 },
    vocabulary_master: { id: 'vocabulary_master', name: '词汇达人', description: '学习100个单词', icon: '📚', points: 100 },
    conversation_master: { id: 'conversation_master', name: '对话高手', description: '完成50轮AI对话', icon: '💬', points: 80 }
};

/**
 * 获取用户徽章
 */
export const getUserBadges = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await query(
            `SELECT badge_id, earned_at
             FROM user_badges
             WHERE user_id = $1
             ORDER BY earned_at DESC`,
            [userId]
        );

        // 附加徽章详细信息
        const badges = result.rows.map(row => ({
            ...BADGES[row.badge_id],
            earnedAt: row.earned_at
        }));

        res.json({
            success: true,
            data: badges
        });
    } catch (error) {
        console.error('Get user badges error:', error);
        res.status(500).json({
            success: false,
            message: '获取徽章失败'
        });
    }
};

/**
 * 获取所有可用徽章
 */
export const getAllBadges = async (req, res) => {
    try {
        const userId = req.user.id;

        // 获取用户已获得的徽章
        const userBadgesResult = await query(
            'SELECT badge_id, earned_at FROM user_badges WHERE user_id = $1',
            [userId]
        );

        const earnedBadges = new Set(userBadgesResult.rows.map(b => b.badge_id));
        const earnedMap = {};
        userBadgesResult.rows.forEach(b => {
            earnedMap[b.badge_id] = b.earned_at;
        });

        // 返回所有徽章，标记已获得的
        const allBadges = Object.values(BADGES).map(badge => ({
            ...badge,
            earned: earnedBadges.has(badge.id),
            earnedAt: earnedMap[badge.id] || null
        }));

        res.json({
            success: true,
            data: allBadges
        });
    } catch (error) {
        console.error('Get all badges error:', error);
        res.status(500).json({
            success: false,
            message: '获取徽章列表失败'
        });
    }
};

/**
 * 授予徽章
 */
export const awardBadge = async (req, res) => {
    const client = await getClient();

    try {
        const userId = req.user.id;
        const { badgeId } = req.body;

        // 验证徽章是否存在
        if (!BADGES[badgeId]) {
            return res.status(400).json({
                success: false,
                message: '徽章不存在'
            });
        }

        await client.query('BEGIN');

        // 检查是否已获得
        const existing = await client.query(
            'SELECT id FROM user_badges WHERE user_id = $1 AND badge_id = $2',
            [userId, badgeId]
        );

        if (existing.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: '已经获得该徽章'
            });
        }

        // 授予徽章
        const result = await client.query(
            `INSERT INTO user_badges (user_id, badge_id, earned_at)
             VALUES ($1, $2, CURRENT_TIMESTAMP)
             RETURNING earned_at`,
            [userId, badgeId]
        );

        // 添加徽章积分
        const badge = BADGES[badgeId];
        if (badge.points > 0) {
            // 更新积分
            await client.query(
                `INSERT INTO user_points (user_id, total_points, daily_points, last_updated)
                 VALUES ($1, $2, $2, CURRENT_TIMESTAMP)
                 ON CONFLICT (user_id) DO UPDATE
                 SET total_points = user_points.total_points + $2,
                     daily_points = user_points.daily_points + $2,
                     last_updated = CURRENT_TIMESTAMP`,
                [userId, badge.points]
            );

            // 记录积分历史
            await client.query(
                `INSERT INTO points_history (user_id, amount, reason, created_at)
                 VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
                [userId, badge.points, `获得徽章：${badge.name}`]
            );
        }

        await client.query('COMMIT');

        res.json({
            success: true,
            message: '徽章已获得',
            data: {
                ...badge,
                earnedAt: result.rows[0].earned_at
            }
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Award badge error:', error);
        res.status(500).json({
            success: false,
            message: '授予徽章失败'
        });
    } finally {
        client.release();
    }
};
