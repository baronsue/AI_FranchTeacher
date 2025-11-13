/**
 * 游戏化系统管理器 - 积分、徽章、排行榜、每日打卡
 */

const STORAGE_KEY_PREFIX = 'aurelie_game_';

// 徽章定义
export const BADGES = {
    FIRST_LESSON: {
        id: 'first_lesson',
        name: '初识法语',
        description: '完成第一课',
        icon: '🎯',
        points: 10
    },
    STREAK_3: {
        id: 'streak_3',
        name: '坚持三天',
        description: '连续学习3天',
        icon: '🔥',
        points: 30
    },
    STREAK_7: {
        id: 'streak_7',
        name: '一周学霸',
        description: '连续学习7天',
        icon: '⭐',
        points: 70
    },
    STREAK_30: {
        id: 'streak_30',
        name: '月度冠军',
        description: '连续学习30天',
        icon: '👑',
        points: 300
    },
    PERFECT_SCORE: {
        id: 'perfect_score',
        name: '完美答题',
        description: '某课练习全对',
        icon: '💯',
        points: 50
    },
    FAST_LEARNER: {
        id: 'fast_learner',
        name: '快速学习者',
        description: '1小时内完成3课',
        icon: '⚡',
        points: 40
    },
    VOCABULARY_MASTER: {
        id: 'vocabulary_master',
        name: '词汇达人',
        description: '学习100个单词',
        icon: '📚',
        points: 100
    },
    CONVERSATION_MASTER: {
        id: 'conversation_master',
        name: '对话高手',
        description: '完成50轮AI对话',
        icon: '💬',
        points: 80
    }
};

// 积分规则
export const POINT_RULES = {
    COMPLETE_LESSON: 20,
    CORRECT_ANSWER: 5,
    WRONG_ANSWER: -2,
    DAILY_LOGIN: 10,
    AI_CONVERSATION: 3,
    PERFECT_EXERCISE: 50,
    REVIEW_MISTAKE: 10
};

/**
 * 获取用户积分数据
 */
export function getPoints() {
    try {
        const key = `${STORAGE_KEY_PREFIX}points`;
        const data = localStorage.getItem(key);
        if (!data) {
            return {
                total: 0,
                today: 0,
                lastUpdated: new Date().toISOString()
            };
        }
        return JSON.parse(data);
    } catch (error) {
        console.error('Failed to load points:', error);
        return { total: 0, today: 0 };
    }
}

/**
 * 添加积分
 */
export function addPoints(amount, reason = '') {
    try {
        const points = getPoints();
        const today = new Date().toDateString();
        const lastDate = new Date(points.lastUpdated).toDateString();

        // 如果是新的一天，重置今日积分
        if (today !== lastDate) {
            points.today = 0;
        }

        points.total += amount;
        points.today += amount;
        points.lastUpdated = new Date().toISOString();

        const key = `${STORAGE_KEY_PREFIX}points`;
        localStorage.setItem(key, JSON.stringify(points));

        // 记录积分历史
        recordPointsHistory(amount, reason);

        // 检查是否获得新徽章
        checkForNewBadges();

        return points;
    } catch (error) {
        console.error('Failed to add points:', error);
        return null;
    }
}

/**
 * 记录积分历史
 */
function recordPointsHistory(amount, reason) {
    try {
        const key = `${STORAGE_KEY_PREFIX}points_history`;
        const data = localStorage.getItem(key);
        const history = data ? JSON.parse(data) : [];

        history.unshift({
            amount,
            reason,
            timestamp: new Date().toISOString(),
            date: new Date().toDateString()
        });

        // 只保留最近100条
        const trimmed = history.slice(0, 100);
        localStorage.setItem(key, JSON.stringify(trimmed));
    } catch (error) {
        console.error('Failed to record points history:', error);
    }
}

/**
 * 获取积分历史
 */
export function getPointsHistory(limit = 20) {
    try {
        const key = `${STORAGE_KEY_PREFIX}points_history`;
        const data = localStorage.getItem(key);
        const history = data ? JSON.parse(data) : [];
        return history.slice(0, limit);
    } catch (error) {
        console.error('Failed to load points history:', error);
        return [];
    }
}

/**
 * 获取用户徽章
 */
export function getUserBadges() {
    try {
        const key = `${STORAGE_KEY_PREFIX}badges`;
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Failed to load badges:', error);
        return [];
    }
}

/**
 * 授予徽章
 */
export function awardBadge(badgeId) {
    try {
        const badges = getUserBadges();

        // 检查是否已有该徽章
        if (badges.find(b => b.id === badgeId)) {
            return false;
        }

        const badge = Object.values(BADGES).find(b => b.id === badgeId);
        if (!badge) {
            return false;
        }

        badges.push({
            ...badge,
            earnedAt: new Date().toISOString()
        });

        const key = `${STORAGE_KEY_PREFIX}badges`;
        localStorage.setItem(key, JSON.stringify(badges));

        // 添加徽章奖励积分
        if (badge.points) {
            addPoints(badge.points, `获得徽章：${badge.name}`);
        }

        return badge;
    } catch (error) {
        console.error('Failed to award badge:', error);
        return false;
    }
}

/**
 * 检查是否获得新徽章
 */
function checkForNewBadges() {
    const stats = getStudyStatsExtended();
    const userBadges = getUserBadges();
    const newBadges = [];

    // 检查连续学习天数徽章
    if (stats.currentStreak >= 3 && !userBadges.find(b => b.id === 'streak_3')) {
        const badge = awardBadge('streak_3');
        if (badge) newBadges.push(badge);
    }
    if (stats.currentStreak >= 7 && !userBadges.find(b => b.id === 'streak_7')) {
        const badge = awardBadge('streak_7');
        if (badge) newBadges.push(badge);
    }
    if (stats.currentStreak >= 30 && !userBadges.find(b => b.id === 'streak_30')) {
        const badge = awardBadge('streak_30');
        if (badge) newBadges.push(badge);
    }

    // 检查词汇量徽章
    if (stats.wordsLearned >= 100 && !userBadges.find(b => b.id === 'vocabulary_master')) {
        const badge = awardBadge('vocabulary_master');
        if (badge) newBadges.push(badge);
    }

    // 检查对话次数徽章
    if (stats.conversationRounds >= 50 && !userBadges.find(b => b.id === 'conversation_master')) {
        const badge = awardBadge('conversation_master');
        if (badge) newBadges.push(badge);
    }

    return newBadges;
}

/**
 * 每日打卡
 */
export function dailyCheckIn() {
    try {
        const key = `${STORAGE_KEY_PREFIX}checkin`;
        const data = localStorage.getItem(key);
        const checkIn = data ? JSON.parse(data) : { dates: [], currentStreak: 0, maxStreak: 0 };

        const today = new Date().toDateString();

        // 检查今天是否已打卡
        if (checkIn.dates.includes(today)) {
            return { success: false, message: '今天已经打卡过了！', checkIn };
        }

        // 添加今天的打卡
        checkIn.dates.push(today);

        // 计算连续天数
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
        if (checkIn.dates.includes(yesterday)) {
            checkIn.currentStreak++;
        } else {
            checkIn.currentStreak = 1;
        }

        checkIn.maxStreak = Math.max(checkIn.maxStreak, checkIn.currentStreak);
        checkIn.lastCheckIn = today;

        // 只保留最近90天的打卡记录
        checkIn.dates = checkIn.dates.slice(-90);

        localStorage.setItem(key, JSON.stringify(checkIn));

        // 添加打卡积分
        addPoints(POINT_RULES.DAILY_LOGIN, '每日打卡');

        return { success: true, checkIn };
    } catch (error) {
        console.error('Failed to check in:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 获取打卡信息
 */
export function getCheckInInfo() {
    try {
        const key = `${STORAGE_KEY_PREFIX}checkin`;
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : { dates: [], currentStreak: 0, maxStreak: 0 };
    } catch (error) {
        console.error('Failed to load check-in info:', error);
        return { dates: [], currentStreak: 0, maxStreak: 0 };
    }
}

/**
 * 获取扩展的学习统计
 */
export function getStudyStatsExtended() {
    try {
        const key = `${STORAGE_KEY_PREFIX}stats_extended`;
        const data = localStorage.getItem(key);
        if (!data) {
            return {
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
            };
        }
        return JSON.parse(data);
    } catch (error) {
        console.error('Failed to load extended stats:', error);
        return {};
    }
}

/**
 * 更新学习统计
 */
export function updateStudyStats(updates) {
    try {
        const stats = getStudyStatsExtended();
        const updated = { ...stats, ...updates, lastStudyDate: new Date().toISOString() };

        const key = `${STORAGE_KEY_PREFIX}stats_extended`;
        localStorage.setItem(key, JSON.stringify(updated));

        return updated;
    } catch (error) {
        console.error('Failed to update stats:', error);
        return null;
    }
}

/**
 * 记录错题
 */
export function recordMistake(questionId, questionData) {
    try {
        const key = `${STORAGE_KEY_PREFIX}mistakes`;
        const data = localStorage.getItem(key);
        const mistakes = data ? JSON.parse(data) : {};

        if (!mistakes[questionId]) {
            mistakes[questionId] = {
                ...questionData,
                wrongCount: 0,
                lastAttempt: null,
                reviewed: false
            };
        }

        mistakes[questionId].wrongCount++;
        mistakes[questionId].lastAttempt = new Date().toISOString();

        localStorage.setItem(key, JSON.stringify(mistakes));
        return mistakes[questionId];
    } catch (error) {
        console.error('Failed to record mistake:', error);
        return null;
    }
}

/**
 * 获取错题本
 */
export function getMistakes(unreviewedOnly = false) {
    try {
        const key = `${STORAGE_KEY_PREFIX}mistakes`;
        const data = localStorage.getItem(key);
        const mistakes = data ? JSON.parse(data) : {};

        const mistakeArray = Object.entries(mistakes).map(([id, data]) => ({
            id,
            ...data
        }));

        if (unreviewedOnly) {
            return mistakeArray.filter(m => !m.reviewed);
        }

        return mistakeArray.sort((a, b) => b.wrongCount - a.wrongCount);
    } catch (error) {
        console.error('Failed to load mistakes:', error);
        return [];
    }
}

/**
 * 标记错题为已复习
 */
export function markMistakeReviewed(questionId) {
    try {
        const key = `${STORAGE_KEY_PREFIX}mistakes`;
        const data = localStorage.getItem(key);
        const mistakes = data ? JSON.parse(data) : {};

        if (mistakes[questionId]) {
            mistakes[questionId].reviewed = true;
            mistakes[questionId].reviewedAt = new Date().toISOString();
            localStorage.setItem(key, JSON.stringify(mistakes));

            // 添加复习积分
            addPoints(POINT_RULES.REVIEW_MISTAKE, '复习错题');
            return true;
        }

        return false;
    } catch (error) {
        console.error('Failed to mark mistake as reviewed:', error);
        return false;
    }
}

/**
 * 获取排行榜数据（本地模拟）
 */
export function getLeaderboard() {
    const userPoints = getPoints().total;
    const userName = localStorage.getItem('aurelie_user_name') || '我';

    // 模拟其他用户数据
    const mockUsers = [
        { name: 'Sophie', points: userPoints + Math.floor(Math.random() * 100) - 50, avatar: '👩' },
        { name: 'Pierre', points: userPoints + Math.floor(Math.random() * 100) - 50, avatar: '👨' },
        { name: 'Marie', points: userPoints + Math.floor(Math.random() * 100) - 50, avatar: '👩‍🦰' },
        { name: 'Jean', points: userPoints + Math.floor(Math.random() * 100) - 50, avatar: '👨‍🦱' },
        { name: userName, points: userPoints, avatar: '🎓', isMe: true }
    ];

    return mockUsers.sort((a, b) => b.points - a.points).map((user, index) => ({
        ...user,
        rank: index + 1
    }));
}

/**
 * 清除游戏化数据
 */
export function clearGameData() {
    try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(STORAGE_KEY_PREFIX)) {
                localStorage.removeItem(key);
            }
        });
        return true;
    } catch (error) {
        console.error('Failed to clear game data:', error);
        return false;
    }
}
