/**
 * 根据云端课程进度与练习记录推导侧边栏/解锁状态（与 dashboard 判定一致）
 */

export function parseProgressField(raw) {
    if (raw == null) return {};
    if (typeof raw === 'object' && !Array.isArray(raw)) return raw;
    if (typeof raw === 'string') {
        try {
            return JSON.parse(raw);
        } catch {
            return {};
        }
    }
    return {};
}

export function normalizeList(data) {
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') return [data];
    return [];
}

export function buildProgressMaps(progressRows, exerciseRows) {
    const progressMap = new Map();
    for (const row of normalizeList(progressRows)) {
        const id = row.course_id || row.courseId;
        if (!id) continue;
        progressMap.set(id, parseProgressField(row.progress));
    }
    const exerciseMap = new Map();
    for (const row of normalizeList(exerciseRows)) {
        const id = row.exercise_id || row.exerciseId;
        if (!id) continue;
        exerciseMap.set(id, row);
    }
    return { progressMap, exerciseMap };
}

export function isLessonComplete(courseId, progressMap, exerciseMap) {
    const p = progressMap.get(courseId) || {};
    const ex = exerciseMap.get(`${courseId}_exercises`);
    if (p.completed === true) return true;
    if (typeof p.score === 'number' && p.score >= 60) return true;
    if (ex?.completed === true) return true;
    if (typeof ex?.score === 'number' && ex.score >= 60) return true;
    return false;
}

export function effectiveCourseProgress(courseId, course, progressMap, exerciseMap) {
    const p = progressMap.get(courseId) || {};
    const ex = exerciseMap.get(`${courseId}_exercises`);
    const exScore = typeof ex?.score === 'number' ? ex.score : null;
    const completed = isLessonComplete(courseId, progressMap, exerciseMap);
    const score = Math.max(typeof p.score === 'number' ? p.score : 0, exScore ?? 0);
    const started =
        p.started === true ||
        ex != null ||
        score > 0 ||
        (typeof p.attempts === 'number' && p.attempts > 0);
    const exercisesCompleted = Array.isArray(p.exercisesCompleted) ? p.exercisesCompleted : [];
    return { completed, started, score, exercisesCompleted };
}

export function isCourseUnlockedFromCloud(course, progressMap, exerciseMap) {
    if (!course) return false;
    if (course.id === 'lesson_1') return true;
    if (!course.prerequisite) return !!course.unlocked;
    return isLessonComplete(course.prerequisite, progressMap, exerciseMap);
}

export function completionRateFromCloud(course, eff) {
    if (!eff) return 0;
    if (eff.completed) return 100;
    if (!eff.started) return 0;
    if (course?.exercises?.length && eff.exercisesCompleted?.length) {
        return Math.round((eff.exercisesCompleted.length / course.exercises.length) * 100);
    }
    return Math.min(100, eff.score || 0);
}

export function learningSummaryFromCloud(courses, progressMap, exerciseMap) {
    let completed = 0;
    let inProgress = 0;
    let sumScore = 0;
    for (const c of courses) {
        const eff = effectiveCourseProgress(c.id, c, progressMap, exerciseMap);
        if (eff.completed) {
            completed++;
            sumScore += eff.score;
        } else if (eff.started) {
            inProgress++;
        }
    }
    const avgScore = completed > 0 ? Math.round(sumScore / completed) : 0;
    return {
        total: courses.length,
        completed,
        inProgress,
        avgScore
    };
}

export function mapCloudMistakesForModal(rows) {
    const list = Array.isArray(rows) ? rows : [];
    return list.map((row) => ({
        id: String(row.id),
        type: row.mistake_type || row.mistakeType || '练习',
        question: row.question_text || row.questionText || '',
        userAnswer: row.user_answer ?? row.userAnswer ?? '',
        correctAnswer: row.correct_answer ?? row.correctAnswer ?? '',
        wrongCount: row.review_count != null ? Number(row.review_count) + 1 : 1
    }));
}
