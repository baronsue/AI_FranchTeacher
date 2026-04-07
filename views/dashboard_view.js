import { authService } from '../services/auth_service.js';
import { userDataService } from '../services/user_data_service.js';
import { getAllCourses } from '../utils/course_manager.js';

const USER_DATA_CHANGED_EVENT = 'aurelie-user-data-changed';

function parseProgressField(raw) {
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

function normalizeDateKey(value) {
    if (value == null) return '';
    if (typeof value === 'string') {
        return value.slice(0, 10);
    }
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

/** DB user_stats.total_study_time 为「分钟」 */
function formatStudyTimeMinutes(minutes) {
    const m = Math.max(0, Math.floor(Number(minutes) || 0));
    if (m === 0) return '0 分钟';
    const h = Math.floor(m / 60);
    const rest = m % 60;
    if (h === 0) return `${rest} 分钟`;
    if (rest === 0) return `${h} 小时`;
    return `${h} 小时 ${rest} 分钟`;
}

function normalizeList(data) {
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') return [data];
    return [];
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function buildProgressMap(progressRows) {
    const map = new Map();
    for (const row of progressRows) {
        const id = row.course_id || row.courseId;
        if (!id) continue;
        map.set(id, parseProgressField(row.progress));
    }
    return map;
}

function buildExerciseMap(exerciseRows) {
    const map = new Map();
    for (const row of exerciseRows) {
        const id = row.exercise_id || row.exerciseId;
        if (!id) continue;
        map.set(id, row);
    }
    return map;
}

function isCourseDone(courseId, progressMap, exerciseMap) {
    const p = progressMap.get(courseId) || {};
    const ex = exerciseMap.get(`${courseId}_exercises`);
    if (p.completed === true) return true;
    if (typeof p.score === 'number' && p.score >= 60) return true;
    if (ex?.completed === true) return true;
    if (typeof ex?.score === 'number' && ex.score >= 60) return true;
    return false;
}

function computeCourseCompletion(courses, progressRows, exerciseRows, stats) {
    const n = courses.length;
    if (n === 0) return { percent: 0, done: 0, total: 0 };

    const progressMap = buildProgressMap(normalizeList(progressRows));
    const exerciseMap = buildExerciseMap(normalizeList(exerciseRows));

    let done = 0;
    for (const c of courses) {
        if (isCourseDone(c.id, progressMap, exerciseMap)) done++;
    }

    const fromRows = Math.min(100, Math.round((done / n) * 100));
    const completedCount = Math.max(0, Math.floor(Number(stats.courses_completed) || 0));
    const fromStats = Math.min(100, Math.round((completedCount / n) * 100));

    return {
        percent: Math.max(fromRows, fromStats),
        done,
        total: n
    };
}

/**
 * 与 style.css 中 grid-auto-flow: column、7 行一致：每列 7 格，共约 15 周。
 */
function generateActivityCalendarHTML(checkins) {
    const totalDays = 15 * 7;
    const marked = new Set();
    for (const c of checkins || []) {
        const raw = c.checkin_date ?? c.checkinDate;
        const key = normalizeDateKey(raw);
        if (key) marked.add(key);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    start.setDate(start.getDate() - (totalDays - 1));

    let html = '';
    for (let i = 0; i < totalDays; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        const key = normalizeDateKey(d);
        const has = marked.has(key);
        const color = has ? 'bg-sky-500' : 'bg-gray-200';
        const label = has ? `${key} 已打卡` : `${key} 未打卡`;
        html += `<div class="activity-day ${color}" title="${label}"></div>`;
    }
    return html;
}

function teardownDashboardListeners() {
    if (typeof window.__dashboardDebouncedRefresh === 'function') {
        window.removeEventListener(USER_DATA_CHANGED_EVENT, window.__dashboardDebouncedRefresh);
    }
    if (typeof window.__dashboardVisibilityRefresh === 'function') {
        document.removeEventListener('visibilitychange', window.__dashboardVisibilityRefresh);
    }
    if (window.__dashboardDebounceTimer != null) {
        clearTimeout(window.__dashboardDebounceTimer);
        window.__dashboardDebounceTimer = null;
    }
}

function setupDashboardAutoRefresh(container) {
    teardownDashboardListeners();

    const run = () => {
        if (!window.location.hash.includes('dashboard')) return;
        if (!document.body.contains(container)) return;
        renderDashboard(container).catch((err) => console.error('刷新学习面板失败:', err));
    };

    const debounced = () => {
        clearTimeout(window.__dashboardDebounceTimer);
        window.__dashboardDebounceTimer = setTimeout(run, 350);
    };

    window.__dashboardDebouncedRefresh = debounced;
    window.addEventListener(USER_DATA_CHANGED_EVENT, debounced);

    const onVis = () => {
        if (document.visibilityState === 'visible') run();
    };
    window.__dashboardVisibilityRefresh = onVis;
    document.addEventListener('visibilitychange', onVis);
}

export async function renderDashboard(container) {
    container.innerHTML = `
        <div class="flex justify-center items-center h-64">
            <div class="text-center">
                <i data-lucide="loader" class="animate-spin text-blue-500 w-12 h-12"></i>
                <p class="mt-4 text-gray-600">加载学习数据中...</p>
            </div>
        </div>
    `;
    lucide.createIcons();

    if (!authService.isAuthenticated()) {
        container.innerHTML = `
            <div class="bg-white rounded-xl shadow-sm p-8 text-center text-gray-600">
                请先登录后查看学习数据。
            </div>`;
        return;
    }

    try {
        await authService.fetchCurrentUser();
    } catch (e) {
        console.warn('同步用户信息失败（仍尝试加载面板）:', e);
    }

    const courses = getAllCourses();

    const [stats, badges, checkins, points, progressRaw, exercisesRaw] = await Promise.all([
        userDataService.getStats(),
        userDataService.getBadges(),
        userDataService.getCheckins(),
        userDataService.getPoints(),
        userDataService.getCourseProgress(),
        userDataService.getExercise()
    ]);

    const statsRow = stats && typeof stats === 'object' ? stats : {};
    const badgeList = normalizeList(badges);
    const checkinList = normalizeList(checkins);
    const progressList = normalizeList(progressRaw);
    const exerciseList = normalizeList(exercisesRaw);

    const studyMinutes = statsRow.total_study_time ?? statsRow.totalStudyTime ?? 0;
    const wordsLearned = statsRow.words_learned ?? statsRow.wordsLearned ?? 0;
    const currentStreak = statsRow.current_streak ?? statsRow.currentStreak ?? 0;

    const { percent: completionRate, done: coursesDone, total: coursesTotal } = computeCourseCompletion(
        courses,
        progressList,
        exerciseList,
        statsRow
    );

    const totalPoints = points?.total_points ?? points?.totalPoints ?? 0;
    const todayPoints = points?.today_points ?? points?.todayPoints ?? 0;

    const calendarHtml = generateActivityCalendarHTML(checkinList);

    container.innerHTML = `
        <div class="space-y-8 sm:space-y-10 min-w-0 max-w-full" data-dashboard-root>
            <div class="min-w-0">
                <h2 class="text-xl sm:text-2xl font-bold text-gray-800 mb-4">学习统计</h2>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    <div class="bg-white rounded-xl shadow-sm p-4 sm:p-6 flex items-start sm:items-center gap-3 min-w-0">
                        <div class="p-2 sm:p-3 bg-blue-100 rounded-full shrink-0">
                            <i data-lucide="clock" class="w-6 h-6 sm:w-7 sm:h-7 text-blue-600"></i>
                        </div>
                        <div class="min-w-0 flex-1">
                            <p class="text-sm text-gray-500">累计学习</p>
                            <p class="text-lg sm:text-2xl font-semibold text-gray-800 break-words">${formatStudyTimeMinutes(studyMinutes)}</p>
                            <p class="text-xs text-gray-400 mt-1">云端按分钟累计</p>
                        </div>
                    </div>
                    <div class="bg-white rounded-xl shadow-sm p-4 sm:p-6 flex items-start sm:items-center gap-3 min-w-0">
                        <div class="p-2 sm:p-3 bg-green-100 rounded-full shrink-0">
                            <i data-lucide="book-copy" class="w-6 h-6 sm:w-7 sm:h-7 text-green-600"></i>
                        </div>
                        <div class="min-w-0 flex-1">
                            <p class="text-sm text-gray-500">已学单词</p>
                            <p class="text-lg sm:text-2xl font-semibold text-gray-800">${wordsLearned} 个</p>
                        </div>
                    </div>
                    <div class="bg-white rounded-xl shadow-sm p-4 sm:p-6 flex items-start sm:items-center gap-3 min-w-0">
                        <div class="p-2 sm:p-3 bg-yellow-100 rounded-full shrink-0">
                           <i data-lucide="pie-chart" class="w-6 h-6 sm:w-7 sm:h-7 text-yellow-600"></i>
                        </div>
                        <div class="min-w-0 flex-1">
                            <p class="text-sm text-gray-500">课程完成度</p>
                            <p class="text-lg sm:text-2xl font-semibold text-gray-800">${completionRate}%</p>
                            <p class="text-xs text-gray-400 mt-1 break-words">已完成 ${coursesDone} / ${coursesTotal} 课（练习或进度）</p>
                        </div>
                    </div>
                    <div class="bg-white rounded-xl shadow-sm p-4 sm:p-6 flex items-start sm:items-center gap-3 min-w-0">
                        <div class="p-2 sm:p-3 bg-violet-100 rounded-full shrink-0">
                            <i data-lucide="sparkles" class="w-6 h-6 sm:w-7 sm:h-7 text-violet-600"></i>
                        </div>
                        <div class="min-w-0 flex-1">
                            <p class="text-sm text-gray-500">学习积分</p>
                            <p class="text-lg sm:text-2xl font-semibold text-gray-800">${totalPoints}</p>
                            <p class="text-xs text-gray-400 mt-1">今日 +${todayPoints}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="min-w-0">
                <h2 class="text-xl sm:text-2xl font-bold text-gray-800 mb-4">学习日历</h2>
                <p class="text-sm text-gray-500 mb-2">基于账户打卡记录（最近约 15 周）</p>
                <div class="bg-white rounded-xl shadow-sm p-4 sm:p-6 overflow-x-auto overscroll-x-contain">
                    <div class="activity-grid">
                        ${calendarHtml}
                    </div>
                </div>
            </div>

            <div class="min-w-0">
                <h2 class="text-xl sm:text-2xl font-bold text-gray-800 mb-4">成就徽章</h2>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    ${badgeList.length > 0 ? badgeList.map((badge) => {
                        const name = escapeHtml(badge.badge_name || badge.badgeName || '徽章');
                        const icon = escapeHtml(badge.badge_icon || badge.badgeIcon || '🏆');
                        const earned = badge.earned_at || badge.earnedAt;
                        const earnedLabel = earned ? new Date(earned).toLocaleDateString() : '';
                        return `
                        <div class="bg-white rounded-xl shadow-sm p-6 text-center">
                            <div class="w-20 h-20 bg-orange-100 rounded-full mx-auto flex items-center justify-center text-4xl">
                                ${icon}
                            </div>
                            <h3 class="mt-4 font-semibold text-lg text-gray-800">${name}</h3>
                            ${earnedLabel ? `<p class="mt-1 text-sm text-gray-500">获得于 ${earnedLabel}</p>` : ''}
                        </div>`;
                    }).join('') : `
                        <div class="bg-white rounded-xl shadow-sm p-6 text-center opacity-50">
                            <div class="w-20 h-20 bg-indigo-100 rounded-full mx-auto flex items-center justify-center">
                               <i data-lucide="award" class="w-10 h-10 text-indigo-500"></i>
                            </div>
                            <h3 class="mt-4 font-semibold text-lg text-gray-800">开始学习</h3>
                            <p class="mt-1 text-sm text-gray-500">完成练习解锁你的第一个徽章！</p>
                        </div>
                        <div class="bg-white rounded-xl shadow-sm p-6 text-center opacity-50">
                            <div class="w-20 h-20 bg-teal-100 rounded-full mx-auto flex items-center justify-center">
                               <i data-lucide="flame" class="w-10 h-10 text-orange-500"></i>
                            </div>
                            <h3 class="mt-4 font-semibold text-lg text-gray-800">连续打卡 ${currentStreak > 0 ? currentStreak : 0} 天</h3>
                            <p class="mt-1 text-sm text-gray-500">数据来源：学习统计中的连续天数</p>
                        </div>
                    `}
                </div>
            </div>
        </div>
    `;

    lucide.createIcons();
    setupDashboardAutoRefresh(container);
}
