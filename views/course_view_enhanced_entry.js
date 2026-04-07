/**
 * 增强版课程视图入口 - 简化集成
 * 这个文件作为桥接，整合增强功能到原有课程视图
 */

import { renderCourseMode } from './course_view.js';
import { authService } from '../services/auth_service.js';
import { userDataService } from '../services/user_data_service.js';
import {
    getAllCourses,
    getCourseProgress,
    isCourseUnlocked,
    getCourseCompletionRate,
    getLearningStats
} from '../utils/course_manager.js';
import {
    getPoints,
    getUserBadges,
    dailyCheckIn,
    getCheckInInfo,
    getMistakes,
    getLeaderboard,
    BADGES,
    POINT_RULES
} from '../utils/gamification_manager.js';
import {
    showCelebration,
    showBadgesModal,
    showMistakesModal,
    showLeaderboardModal
} from '../utils/modal_manager.js';

function getTopBarModelLocal() {
    const points = getPoints();
    const checkIn = getCheckInInfo();
    const badges = getUserBadges();
    return {
        total: points.total ?? 0,
        today: points.today ?? 0,
        streak: checkIn.currentStreak ?? 0,
        badgeCount: badges.length
    };
}

async function getTopBarModelRemote() {
    try {
        const [points, stats, badges] = await Promise.all([
            userDataService.getPoints(),
            userDataService.getStats(),
            userDataService.getBadges()
        ]);
        const pts = points || {};
        const st = stats || {};
        const badgeList = Array.isArray(badges) ? badges : [];
        return {
            total: Number(pts.total_points ?? pts.totalPoints ?? 0),
            today: Number(pts.today_points ?? pts.todayPoints ?? 0),
            streak: Number(st.current_streak ?? st.currentStreak ?? 0),
            badgeCount: badgeList.length
        };
    } catch (e) {
        console.error('加载云端顶栏数据失败，回退本地缓存', e);
        return getTopBarModelLocal();
    }
}

function buildTopBarInnerHTML(model) {
    return `
        <div class="flex items-center justify-between flex-wrap gap-4">
            <div class="flex items-center gap-3">
                <div class="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-2xl">
                    ⭐
                </div>
                <div>
                    <div class="text-2xl font-bold text-gray-900">${model.total}</div>
                    <div class="text-sm text-gray-600">总积分</div>
                </div>
                <div class="ml-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    今日 +${model.today}
                </div>
            </div>

            <div class="flex items-center gap-3">
                <div class="w-12 h-12 bg-gradient-to-br from-red-400 to-pink-500 rounded-full flex items-center justify-center text-2xl">
                    🔥
                </div>
                <div>
                    <div class="text-2xl font-bold text-gray-900">${model.streak}</div>
                    <div class="text-sm text-gray-600">连续天数</div>
                </div>
            </div>

            <div class="flex items-center gap-3 cursor-pointer hover:bg-purple-50 p-2 rounded-lg transition"
                id="badges-display">
                <div class="w-12 h-12 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center text-2xl">
                    🏆
                </div>
                <div>
                    <div class="text-2xl font-bold text-gray-900">${model.badgeCount}</div>
                    <div class="text-sm text-gray-600">获得徽章</div>
                </div>
            </div>

            <div class="flex gap-2">
                <button id="daily-checkin-btn" type="button" class="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-semibold hover:shadow-lg transition flex items-center gap-2">
                    <i data-lucide="check-circle" class="w-4 h-4"></i>
                    <span>每日打卡</span>
                </button>
                <button id="leaderboard-btn" type="button" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition flex items-center gap-2">
                    <i data-lucide="trophy" class="w-4 h-4"></i>
                    <span>排行榜</span>
                </button>
            </div>
        </div>
    `;
}

function attachTopBarEventListeners(topBar) {
    topBar.querySelector('#daily-checkin-btn').addEventListener('click', async () => {
        if (authService.isAuthenticated()) {
            const res = await userDataService.checkin();
            if (res.success && res.data) {
                const streak = res.data.current_streak ?? res.data.currentStreak ?? 0;
                await userDataService.addPoints(POINT_RULES.DAILY_LOGIN, '每日打卡', 'checkin');
                showCelebration(`🎉 打卡成功！连续 ${streak} 天`);
                await refreshGameTopBar();
                return;
            }
            const msg = (res && res.error) ? String(res.error) : '';
            if (msg.includes('已经') || msg.includes('打卡过了')) {
                showCelebration('今天已经打卡过了！');
                return;
            }
            showCelebration('打卡失败，请检查网络后重试');
            return;
        }

        const result = dailyCheckIn();
        if (result.success) {
            showCelebration(`🎉 打卡成功！连续 ${result.checkIn.currentStreak} 天`);
            updateGameTopBar();
        } else {
            showCelebration('今天已经打卡过了！');
        }
    });

    topBar.querySelector('#badges-display').addEventListener('click', async () => {
        if (authService.isAuthenticated()) {
            try {
                const list = await userDataService.getBadges();
                const mapped = (Array.isArray(list) ? list : []).map((b) => ({
                    id: b.badge_id || b.badgeId,
                    name: b.badge_name || b.badgeName,
                    icon: b.badge_icon || b.badgeIcon || '🏆',
                    earnedAt: b.earned_at || b.earnedAt
                }));
                showBadgesModal(mapped, Object.values(BADGES));
            } catch (e) {
                console.error(e);
                showBadgesModal(getUserBadges(), Object.values(BADGES));
            }
            return;
        }
        showBadgesModal(getUserBadges(), Object.values(BADGES));
    });

    topBar.querySelector('#leaderboard-btn').addEventListener('click', () => {
        showLeaderboardModal(getLeaderboard());
    });
}

function createTopBarElementFromModel(model) {
    const topBar = document.createElement('div');
    topBar.id = 'enhanced-game-top-bar';
    topBar.className = 'bg-white rounded-2xl shadow-lg p-4';
    topBar.innerHTML = buildTopBarInnerHTML(model);
    attachTopBarEventListeners(topBar);
    return topBar;
}

/**
 * 创建增强版课程界面
 */
export async function renderEnhancedCourse(container) {
    const topBar = createTopBarElementFromModel(getTopBarModelLocal());

    const sidebar = createCourseSidebar();

    const mainContent = document.createElement('div');
    mainContent.id = 'enhanced-course-content';
    mainContent.className = 'flex-1';

    const layout = document.createElement('div');
    layout.className = 'flex flex-col gap-6';

    const contentRow = document.createElement('div');
    contentRow.className = 'flex gap-6';
    contentRow.appendChild(sidebar);
    contentRow.appendChild(mainContent);

    layout.appendChild(topBar);
    layout.appendChild(contentRow);

    container.innerHTML = '';
    container.appendChild(layout);

    renderCourseMode(mainContent);

    lucide.createIcons();

    await refreshGameTopBar();
}

/**
 * 创建课程侧边栏
 */
function createCourseSidebar() {
    const courses = getAllCourses();
    const stats = getLearningStats();

    const sidebar = document.createElement('div');
    sidebar.className = 'w-80 bg-white rounded-2xl shadow-lg p-6 flex flex-col gap-6 max-h-[85vh] overflow-y-auto';
    sidebar.innerHTML = `
        <!-- 学习统计 -->
        <div class="bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl p-4 text-white">
            <div class="flex items-center justify-between mb-3">
                <h3 class="text-lg font-bold">学习进度</h3>
                <span class="text-2xl">📚</span>
            </div>
            <div class="grid grid-cols-2 gap-3 text-sm">
                <div class="bg-white/20 rounded-lg p-2">
                    <div class="text-xs opacity-90">已完成</div>
                    <div class="text-xl font-bold">${stats.completed}/${stats.total}</div>
                </div>
                <div class="bg-white/20 rounded-lg p-2">
                    <div class="text-xs opacity-90">平均分</div>
                    <div class="text-xl font-bold">${stats.avgScore}%</div>
                </div>
            </div>
        </div>

        <!-- 课程列表 -->
        <div class="flex flex-col gap-3">
            <h3 class="text-lg font-bold text-gray-800 flex items-center gap-2">
                <i data-lucide="book-open" class="w-5 h-5"></i>
                课程列表
            </h3>
            <div id="course-list" class="flex flex-col gap-2"></div>
        </div>

        <!-- 快捷操作 -->
        <div class="flex flex-col gap-2 pt-4 border-t">
            <button id="show-mistakes-btn" class="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition">
                <i data-lucide="alert-circle" class="w-4 h-4"></i>
                错题本 (${getMistakes(true).length})
            </button>
        </div>
    `;

    // 渲染课程列表
    const courseList = sidebar.querySelector('#course-list');
    courses.forEach(course => {
        const progress = getCourseProgress(course.id);
        const unlocked = isCourseUnlocked(course.id);
        const completionRate = getCourseCompletionRate(course.id);

        const courseCard = document.createElement('div');
        courseCard.className = `relative p-3 rounded-lg border-2 transition
            ${!unlocked ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-200' : 'cursor-pointer hover:shadow-md bg-white border-gray-200 hover:border-blue-300'}`;

        courseCard.innerHTML = `
            <div class="flex items-start gap-3">
                <div class="text-3xl">${course.icon}</div>
                <div class="flex-1 min-w-0">
                    <div class="font-semibold text-sm text-gray-900 truncate">${course.title}</div>
                    <div class="text-xs text-gray-600 truncate">${course.subtitle}</div>
                    ${unlocked ? `
                        <div class="mt-2 flex items-center gap-2">
                            <div class="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div class="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                                    style="width: ${completionRate}%"></div>
                            </div>
                            <span class="text-xs font-medium text-gray-600">${completionRate}%</span>
                        </div>
                    ` : `
                        <div class="mt-2 flex items-center gap-1 text-xs text-gray-500">
                            <i data-lucide="lock" class="w-3 h-3"></i>
                            <span>需要完成前置课程</span>
                        </div>
                    `}
                    ${progress.completed ? '<div class="absolute top-2 right-2 text-green-500 text-xl">✓</div>' : ''}
                </div>
            </div>
        `;

        // 如果可用，添加点击事件切换课程
        if (unlocked) {
            courseCard.addEventListener('click', () => {
                // 这里可以加载特定课程的内容
                showCelebration(`加载 ${course.title}...`);
            });
        }

        courseList.appendChild(courseCard);
    });

    // 绑定错题本按钮
    sidebar.querySelector('#show-mistakes-btn').addEventListener('click', () => {
        showMistakesModal(getMistakes(true));
    });

    return sidebar;
}

/**
 * 从云端（已登录）或本地刷新顶栏数字，与学习面板数据源一致
 */
export async function refreshGameTopBar() {
    const topBar = document.getElementById('enhanced-game-top-bar');
    if (!topBar) return;

    const model = authService.isAuthenticated()
        ? await getTopBarModelRemote()
        : getTopBarModelLocal();

    const next = createTopBarElementFromModel(model);
    topBar.replaceWith(next);
    lucide.createIcons();
}

async function updateGameTopBar() {
    await refreshGameTopBar();
}

window.updateGameTopBar = updateGameTopBar;
