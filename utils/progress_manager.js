/**
 * 进度管理工具 - 用于保存和恢复用户的学习进度
 */

const STORAGE_KEY_PREFIX = 'aurelie_app_';

/**
 * 保存课程进度
 */
export function saveCourseProgress(courseId, progress) {
    try {
        const key = `${STORAGE_KEY_PREFIX}course_${courseId}`;
        const data = {
            progress,
            lastUpdated: new Date().toISOString(),
            timestamp: Date.now()
        };
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Failed to save course progress:', error);
        return false;
    }
}

/**
 * 获取课程进度
 */
export function getCourseProgress(courseId) {
    try {
        const key = `${STORAGE_KEY_PREFIX}course_${courseId}`;
        const data = localStorage.getItem(key);
        if (!data) return null;
        
        const parsed = JSON.parse(data);
        return parsed.progress;
    } catch (error) {
        console.error('Failed to load course progress:', error);
        return null;
    }
}

/**
 * 保存练习答案
 */
export function saveExerciseAnswers(exerciseId, answers) {
    try {
        const key = `${STORAGE_KEY_PREFIX}exercise_${exerciseId}`;
        const data = {
            answers,
            lastUpdated: new Date().toISOString(),
            timestamp: Date.now()
        };
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Failed to save exercise answers:', error);
        return false;
    }
}

/**
 * 获取练习答案
 */
export function getExerciseAnswers(exerciseId) {
    try {
        const key = `${STORAGE_KEY_PREFIX}exercise_${exerciseId}`;
        const data = localStorage.getItem(key);
        if (!data) return null;
        
        const parsed = JSON.parse(data);
        return parsed.answers;
    } catch (error) {
        console.error('Failed to load exercise answers:', error);
        return null;
    }
}

/**
 * 保存对话历史
 */
export function saveDialogueHistory(history) {
    try {
        const key = `${STORAGE_KEY_PREFIX}dialogue_history`;
        const data = {
            history: history.slice(-50), // 只保存最近50条
            lastUpdated: new Date().toISOString(),
            timestamp: Date.now()
        };
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Failed to save dialogue history:', error);
        return false;
    }
}

/**
 * 获取对话历史
 */
export function getDialogueHistory() {
    try {
        const key = `${STORAGE_KEY_PREFIX}dialogue_history`;
        const data = localStorage.getItem(key);
        if (!data) return [];
        
        const parsed = JSON.parse(data);
        return parsed.history || [];
    } catch (error) {
        console.error('Failed to load dialogue history:', error);
        return [];
    }
}

/**
 * 保存学习统计
 */
export function saveStudyStats(stats) {
    try {
        const key = `${STORAGE_KEY_PREFIX}study_stats`;
        const existing = getStudyStats();
        
        const merged = {
            ...existing,
            ...stats,
            totalStudyTime: (existing.totalStudyTime || 0) + (stats.studyTime || 0),
            wordsLearned: Math.max(existing.wordsLearned || 0, stats.wordsLearned || 0),
            coursesCompleted: Math.max(existing.coursesCompleted || 0, stats.coursesCompleted || 0),
            lastUpdated: new Date().toISOString(),
            timestamp: Date.now()
        };
        
        localStorage.setItem(key, JSON.stringify(merged));
        return true;
    } catch (error) {
        console.error('Failed to save study stats:', error);
        return false;
    }
}

/**
 * 获取学习统计
 */
export function getStudyStats() {
    try {
        const key = `${STORAGE_KEY_PREFIX}study_stats`;
        const data = localStorage.getItem(key);
        if (!data) {
            return {
                totalStudyTime: 0,
                wordsLearned: 0,
                coursesCompleted: 0,
                lastUpdated: new Date().toISOString()
            };
        }
        
        return JSON.parse(data);
    } catch (error) {
        console.error('Failed to load study stats:', error);
        return {
            totalStudyTime: 0,
            wordsLearned: 0,
            coursesCompleted: 0
        };
    }
}

/**
 * 清除所有进度数据
 */
export function clearAllProgress() {
    try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(STORAGE_KEY_PREFIX)) {
                localStorage.removeItem(key);
            }
        });
        return true;
    } catch (error) {
        console.error('Failed to clear progress:', error);
        return false;
    }
}

/**
 * 导出所有数据（用于备份）
 */
export function exportAllData() {
    try {
        const data = {};
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(STORAGE_KEY_PREFIX)) {
                data[key] = localStorage.getItem(key);
            }
        });
        return JSON.stringify(data, null, 2);
    } catch (error) {
        console.error('Failed to export data:', error);
        return null;
    }
}

/**
 * 导入数据（用于恢复）
 */
export function importData(jsonString) {
    try {
        const data = JSON.parse(jsonString);
        Object.keys(data).forEach(key => {
            if (key.startsWith(STORAGE_KEY_PREFIX)) {
                localStorage.setItem(key, data[key]);
            }
        });
        return true;
    } catch (error) {
        console.error('Failed to import data:', error);
        return false;
    }
}

