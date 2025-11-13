/**
 * 课程管理系统 - 管理课程结构、进度和导航
 */

// 课程结构定义
export const COURSES = [
    {
        id: 'lesson_1',
        title: 'Leçon 1 : Bonjour!',
        subtitle: '第一课：你好！',
        level: 'A1',
        difficulty: 1,
        duration: 30, // 分钟
        topics: ['问候', '自我介绍', '冠词'],
        icon: '👋',
        color: '#3b82f6',
        content: 'data/course_content.md',
        exercises: ['fill', 'choice', 'match'],
        vocabulary: ['bonjour', 'au revoir', 'merci', 'un', 'une'],
        unlocked: true
    },
    {
        id: 'lesson_2',
        title: 'Leçon 2 : Les Nombres',
        subtitle: '第二课：数字',
        level: 'A1',
        difficulty: 1,
        duration: 25,
        topics: ['数字1-20', '电话号码', '年龄'],
        icon: '🔢',
        color: '#10b981',
        content: 'data/lesson_2.md',
        exercises: ['fill', 'choice', 'listening'],
        vocabulary: ['un', 'deux', 'trois', 'quatre', 'cinq'],
        unlocked: false,
        prerequisite: 'lesson_1'
    },
    {
        id: 'lesson_3',
        title: 'Leçon 3 : La Famille',
        subtitle: '第三课：家庭',
        level: 'A1',
        difficulty: 2,
        duration: 35,
        topics: ['家庭成员', '所有格形容词', '复数'],
        icon: '👨‍👩‍👧‍👦',
        color: '#f59e0b',
        content: 'data/lesson_3.md',
        exercises: ['fill', 'choice', 'drag'],
        vocabulary: ['père', 'mère', 'frère', 'sœur', 'famille'],
        unlocked: false,
        prerequisite: 'lesson_2'
    },
    {
        id: 'lesson_4',
        title: 'Leçon 4 : Les Couleurs',
        subtitle: '第四课：颜色',
        level: 'A1',
        difficulty: 1,
        duration: 20,
        topics: ['颜色', '形容词性数配合'],
        icon: '🎨',
        color: '#ec4899',
        content: 'data/lesson_4.md',
        exercises: ['fill', 'choice', 'card'],
        vocabulary: ['rouge', 'bleu', 'vert', 'jaune', 'noir'],
        unlocked: false,
        prerequisite: 'lesson_3'
    },
    {
        id: 'lesson_5',
        title: 'Leçon 5 : Au Restaurant',
        subtitle: '第五课：在餐厅',
        level: 'A2',
        difficulty: 3,
        duration: 40,
        topics: ['点餐', '食物词汇', '礼貌用语'],
        icon: '🍽️',
        color: '#8b5cf6',
        content: 'data/lesson_5.md',
        exercises: ['fill', 'choice', 'dialogue'],
        vocabulary: ['menu', 'addition', 'commander', 'plat', 'boisson'],
        unlocked: false,
        prerequisite: 'lesson_4'
    }
];

const STORAGE_KEY = 'aurelie_app_courses';

/**
 * 获取所有课程
 */
export function getAllCourses() {
    return COURSES;
}

/**
 * 获取单个课程信息
 */
export function getCourseById(courseId) {
    return COURSES.find(c => c.id === courseId);
}

/**
 * 获取课程进度
 */
export function getCourseProgress(courseId) {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        const progress = data ? JSON.parse(data) : {};
        return progress[courseId] || {
            started: false,
            completed: false,
            score: 0,
            attempts: 0,
            lastAttempt: null,
            timeSpent: 0,
            exercisesCompleted: []
        };
    } catch (error) {
        console.error('Failed to load course progress:', error);
        return null;
    }
}

/**
 * 更新课程进度
 */
export function updateCourseProgress(courseId, updates) {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        const progress = data ? JSON.parse(data) : {};

        if (!progress[courseId]) {
            progress[courseId] = {
                started: false,
                completed: false,
                score: 0,
                attempts: 0,
                lastAttempt: null,
                timeSpent: 0,
                exercisesCompleted: []
            };
        }

        progress[courseId] = {
            ...progress[courseId],
            ...updates,
            lastAttempt: new Date().toISOString()
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));

        // 检查是否需要解锁下一课
        if (updates.completed) {
            unlockNextCourse(courseId);
        }

        return progress[courseId];
    } catch (error) {
        console.error('Failed to update course progress:', error);
        return null;
    }
}

/**
 * 解锁下一课
 */
function unlockNextCourse(completedCourseId) {
    const currentIndex = COURSES.findIndex(c => c.id === completedCourseId);
    if (currentIndex >= 0 && currentIndex < COURSES.length - 1) {
        const nextCourse = COURSES[currentIndex + 1];
        if (nextCourse.prerequisite === completedCourseId) {
            nextCourse.unlocked = true;
        }
    }
}

/**
 * 检查课程是否解锁
 */
export function isCourseUnlocked(courseId) {
    const course = getCourseById(courseId);
    if (!course) return false;

    // 第一课总是解锁
    if (course.id === 'lesson_1') return true;

    // 检查前置课程是否完成
    if (course.prerequisite) {
        const prereqProgress = getCourseProgress(course.prerequisite);
        return prereqProgress && prereqProgress.completed;
    }

    return course.unlocked;
}

/**
 * 获取下一课推荐
 */
export function getNextRecommendedCourse() {
    for (const course of COURSES) {
        const progress = getCourseProgress(course.id);
        if (!progress.completed && isCourseUnlocked(course.id)) {
            return course;
        }
    }
    return null;
}

/**
 * 获取学习统计
 */
export function getLearningStats() {
    const data = localStorage.getItem(STORAGE_KEY);
    const progress = data ? JSON.parse(data) : {};

    const completed = Object.values(progress).filter(p => p.completed).length;
    const inProgress = Object.values(progress).filter(p => p.started && !p.completed).length;
    const totalTime = Object.values(progress).reduce((sum, p) => sum + (p.timeSpent || 0), 0);
    const avgScore = completed > 0
        ? Object.values(progress)
            .filter(p => p.completed)
            .reduce((sum, p) => sum + p.score, 0) / completed
        : 0;

    return {
        total: COURSES.length,
        completed,
        inProgress,
        notStarted: COURSES.length - completed - inProgress,
        totalTime,
        avgScore: Math.round(avgScore)
    };
}

/**
 * 开始课程（记录开始时间）
 */
export function startCourse(courseId) {
    const progress = getCourseProgress(courseId);
    if (!progress.started) {
        return updateCourseProgress(courseId, {
            started: true,
            startedAt: new Date().toISOString(),
            attempts: 1
        });
    }
    return progress;
}

/**
 * 完成课程
 */
export function completeCourse(courseId, score) {
    return updateCourseProgress(courseId, {
        completed: true,
        completedAt: new Date().toISOString(),
        score: Math.max(score, getCourseProgress(courseId).score || 0)
    });
}

/**
 * 记录课程学习时间
 */
export function recordStudyTime(courseId, seconds) {
    const progress = getCourseProgress(courseId);
    return updateCourseProgress(courseId, {
        timeSpent: (progress.timeSpent || 0) + seconds
    });
}

/**
 * 获取课程完成率
 */
export function getCourseCompletionRate(courseId) {
    const progress = getCourseProgress(courseId);
    if (!progress || !progress.started) return 0;
    if (progress.completed) return 100;

    // 根据练习完成情况估算
    const course = getCourseById(courseId);
    if (course && course.exercises && progress.exercisesCompleted) {
        const completed = progress.exercisesCompleted.length;
        const total = course.exercises.length;
        return Math.round((completed / total) * 100);
    }

    return progress.score || 0;
}

/**
 * 重置课程进度
 */
export function resetCourseProgress(courseId) {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        const progress = data ? JSON.parse(data) : {};

        if (progress[courseId]) {
            delete progress[courseId];
            localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
        }

        return true;
    } catch (error) {
        console.error('Failed to reset course progress:', error);
        return false;
    }
}

/**
 * 清除所有课程进度
 */
export function clearAllCourseProgress() {
    try {
        localStorage.removeItem(STORAGE_KEY);
        return true;
    } catch (error) {
        console.error('Failed to clear all course progress:', error);
        return false;
    }
}
