// 用户数据服务 - 管理用户学习数据的云端同步

import { authService } from './auth_service.js';

// 安全地从localStorage解析JSON
function safeParseJSON(key, defaultValue = null) {
    try {
        const value = localStorage.getItem(key);
        if (!value) return defaultValue;
        return JSON.parse(value);
    } catch (error) {
        console.error(`解析localStorage中的${key}失败:`, error);
        // 清除损坏的数据
        localStorage.removeItem(key);
        return defaultValue;
    }
}

class UserDataService {
    constructor() {
        this.syncEnabled = true;
    }

    // ============================================
    // 课程进度
    // ============================================

    async getCourseProgress(courseId = null) {
        try {
            const endpoint = courseId ? `/user/progress/${courseId}` : '/user/progress';
            const response = await authService.get(endpoint);
            return response.success ? response.data : null;
        } catch (error) {
            console.error('获取课程进度失败:', error);
            return null;
        }
    }

    async saveCourseProgress(courseId, progress) {
        try {
            const response = await authService.post('/user/progress', {
                courseId,
                progress
            });
            return response.success;
        } catch (error) {
            console.error('保存课程进度失败:', error);
            return false;
        }
    }

    // ============================================
    // 练习记录
    // ============================================

    async getExercise(exerciseId = null) {
        try {
            const endpoint = exerciseId ? `/user/exercises/${exerciseId}` : '/user/exercises';
            const response = await authService.get(endpoint);
            return response.success ? response.data : null;
        } catch (error) {
            console.error('获取练习记录失败:', error);
            return null;
        }
    }

    async saveExercise(exerciseId, answers, score, completed) {
        try {
            const response = await authService.post('/user/exercises', {
                exerciseId,
                answers,
                score,
                completed
            });
            return response.success;
        } catch (error) {
            console.error('保存练习记录失败:', error);
            return false;
        }
    }

    // ============================================
    // 积分系统
    // ============================================

    async getPoints() {
        try {
            const response = await authService.get('/user/points');
            return response.success ? response.data : { total_points: 0, today_points: 0 };
        } catch (error) {
            console.error('获取积分失败:', error);
            return { total_points: 0, today_points: 0 };
        }
    }

    async addPoints(points, reason, activityType) {
        try {
            const response = await authService.post('/user/points', {
                points,
                reason,
                activityType
            });
            return response.success ? response.data : null;
        } catch (error) {
            console.error('添加积分失败:', error);
            return null;
        }
    }

    async getPointsHistory(limit = 100) {
        try {
            const response = await authService.get(`/user/points/history?limit=${limit}`);
            return response.success ? response.data : [];
        } catch (error) {
            console.error('获取积分历史失败:', error);
            return [];
        }
    }

    // ============================================
    // 徽章系统
    // ============================================

    async getBadges() {
        try {
            const response = await authService.get('/user/badges');
            return response.success ? response.data : [];
        } catch (error) {
            console.error('获取徽章失败:', error);
            return [];
        }
    }

    async addBadge(badgeId, badgeName, badgeIcon) {
        try {
            const response = await authService.post('/user/badges', {
                badgeId,
                badgeName,
                badgeIcon
            });
            return response.success;
        } catch (error) {
            console.error('添加徽章失败:', error);
            return false;
        }
    }

    // ============================================
    // 打卡系统
    // ============================================

    async getCheckins() {
        try {
            const response = await authService.get('/user/checkins');
            return response.success ? response.data : [];
        } catch (error) {
            console.error('获取打卡记录失败:', error);
            return [];
        }
    }

    async checkin() {
        try {
            const response = await authService.post('/user/checkins', {});
            return response.success ? response.data : null;
        } catch (error) {
            console.error('打卡失败:', error);
            return null;
        }
    }

    // ============================================
    // 错题本
    // ============================================

    async getMistakes(mastered = null) {
        try {
            const query = mastered !== null ? `?mastered=${mastered}` : '';
            const response = await authService.get(`/user/mistakes${query}`);
            return response.success ? response.data : [];
        } catch (error) {
            console.error('获取错题失败:', error);
            return [];
        }
    }

    async addMistake(exerciseId, questionText, userAnswer, correctAnswer, mistakeType) {
        try {
            const response = await authService.post('/user/mistakes', {
                exerciseId,
                questionText,
                userAnswer,
                correctAnswer,
                mistakeType
            });
            return response.success;
        } catch (error) {
            console.error('添加错题失败:', error);
            return false;
        }
    }

    async markMistakeMastered(mistakeId) {
        try {
            const response = await authService.patch(`/user/mistakes/${mistakeId}/mastered`, {});
            return response.success;
        } catch (error) {
            console.error('标记错题失败:', error);
            return false;
        }
    }

    // ============================================
    // 学习统计
    // ============================================

    async getStats() {
        try {
            const response = await authService.get('/user/stats');
            return response.success ? response.data : {};
        } catch (error) {
            console.error('获取统计失败:', error);
            return {};
        }
    }

    async updateStats(stats) {
        try {
            const response = await authService.post('/user/stats', stats);
            return response.success;
        } catch (error) {
            console.error('更新统计失败:', error);
            return false;
        }
    }

    // ============================================
    // 对话历史
    // ============================================

    async getDialogueHistory(limit = 50) {
        try {
            const response = await authService.get(`/user/dialogue?limit=${limit}`);
            return response.success ? response.data : [];
        } catch (error) {
            console.error('获取对话历史失败:', error);
            return [];
        }
    }

    async saveDialogue(role, content, scenario) {
        try {
            const response = await authService.post('/user/dialogue', {
                role,
                content,
                scenario
            });
            return response.success;
        } catch (error) {
            console.error('保存对话失败:', error);
            return false;
        }
    }

    // ============================================
    // 排行榜
    // ============================================

    async getLeaderboard(limit = 10) {
        try {
            const response = await authService.get(`/user/leaderboard?limit=${limit}`);
            return response.success ? response.data : [];
        } catch (error) {
            console.error('获取排行榜失败:', error);
            return [];
        }
    }

    // ============================================
    // 数据迁移（从localStorage到数据库）
    // ============================================

    async migrateLocalData() {
        if (!authService.isAuthenticated()) {
            console.log('用户未登录，跳过数据迁移');
            return false;
        }

        console.log('开始迁移localStorage数据到数据库...');

        try {
            // 迁移积分数据
            const localPoints = localStorage.getItem('aurelie_game_points');
            if (localPoints) {
                const pointsData = JSON.parse(localPoints);
                if (pointsData.total > 0) {
                    await this.addPoints(pointsData.total, '从本地数据迁移', 'migration');
                }
            }

            // 迁移徽章
            const localBadges = localStorage.getItem('aurelie_game_badges');
            if (localBadges) {
                const badges = JSON.parse(localBadges);
                for (const badge of badges) {
                    await this.addBadge(badge.id, badge.name, badge.icon);
                }
            }

            // 迁移课程进度
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith('aurelie_app_course_')) {
                    const courseId = key.replace('aurelie_app_course_', '');
                    const progressData = safeParseJSON(key, null);
                    if (progressData && progressData.progress) {
                        await this.saveCourseProgress(courseId, progressData.progress);
                    }
                }
            }

            // 迁移练习数据
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith('aurelie_app_exercise_')) {
                    const exerciseId = key.replace('aurelie_app_exercise_', '');
                    const exerciseData = safeParseJSON(key, null);
                    if (exerciseData) {
                        await this.saveExercise(
                            exerciseId,
                            exerciseData.answers || {},
                            exerciseData.score || 0,
                            exerciseData.completed || false
                        );
                    }
                }
            }

            // 迁移学习统计
            const localStats = localStorage.getItem('aurelie_app_study_stats');
            if (localStats) {
                const stats = JSON.parse(localStats);
                await this.updateStats({
                    studyTime: stats.totalTime || 0,
                    wordsLearned: stats.wordsLearned || 0,
                    exercisesCompleted: stats.exercisesCompleted || 0
                });
            }

            console.log('✅ 数据迁移完成');
            return true;
        } catch (error) {
            console.error('❌ 数据迁移失败:', error);
            return false;
        }
    }

    // ============================================
    // 同步开关
    // ============================================

    enableSync() {
        this.syncEnabled = true;
    }

    disableSync() {
        this.syncEnabled = false;
    }

    isSyncEnabled() {
        return this.syncEnabled && authService.isAuthenticated();
    }
}

// 导出单例
export const userDataService = new UserDataService();
