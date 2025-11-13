/**
 * 增强版课程视图入口 - 简化集成
 * 这个文件作为桥接，整合增强功能到原有课程视图
 */

import { renderCourseMode } from './course_view.js';
import {
    getAllCourses,
    getCourseById,
    getCourseProgress,
    updateCourseProgress,
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
    BADGES
} from '../utils/gamification_manager.js';
import {
    showCelebration,
    showBadgesModal,
    showMistakesModal,
    showLeaderboardModal
} from '../utils/modal_manager.js';

/**
 * 创建增强版课程界面
 */
export function renderEnhancedCourse(container) {
    // 创建顶部游戏化状态栏
    const topBar = createGameTopBar();

    // 创建侧边栏导航
    const sidebar = createCourseSidebar();

    // 创建主内容区域
    const mainContent = document.createElement('div');
    mainContent.id = 'enhanced-course-content';
    mainContent.className = 'flex-1';

    // 布局容器
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

    // 初始化课程内容（使用原有的渲染函数）
    renderCourseMode(mainContent);

    lucide.createIcons();
}

/**
 * 创建游戏化顶部栏
 */
function createGameTopBar() {
    const points = getPoints();
    const checkIn = getCheckInInfo();
    const badges = getUserBadges();

    const topBar = document.createElement('div');
    topBar.className = 'bg-white rounded-2xl shadow-lg p-4';
    topBar.innerHTML = `
        <div class="flex items-center justify-between flex-wrap gap-4">
            <!-- 积分 -->
            <div class="flex items-center gap-3">
                <div class="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-2xl">
                    ⭐
                </div>
                <div>
                    <div class="text-2xl font-bold text-gray-900">${points.total}</div>
                    <div class="text-sm text-gray-600">总积分</div>
                </div>
                <div class="ml-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    今日 +${points.today}
                </div>
            </div>

            <!-- 连续学习 -->
            <div class="flex items-center gap-3">
                <div class="w-12 h-12 bg-gradient-to-br from-red-400 to-pink-500 rounded-full flex items-center justify-center text-2xl">
                    🔥
                </div>
                <div>
                    <div class="text-2xl font-bold text-gray-900">${checkIn.currentStreak}</div>
                    <div class="text-sm text-gray-600">连续天数</div>
                </div>
            </div>

            <!-- 徽章 -->
            <div class="flex items-center gap-3 cursor-pointer hover:bg-purple-50 p-2 rounded-lg transition"
                id="badges-display">
                <div class="w-12 h-12 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center text-2xl">
                    🏆
                </div>
                <div>
                    <div class="text-2xl font-bold text-gray-900">${badges.length}</div>
                    <div class="text-sm text-gray-600">获得徽章</div>
                </div>
            </div>

            <!-- 操作按钮 -->
            <div class="flex gap-2">
                <button id="daily-checkin-btn" class="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-semibold hover:shadow-lg transition flex items-center gap-2">
                    <i data-lucide="check-circle" class="w-4 h-4"></i>
                    <span>每日打卡</span>
                </button>
                <button id="leaderboard-btn" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition flex items-center gap-2">
                    <i data-lucide="trophy" class="w-4 h-4"></i>
                    <span>排行榜</span>
                </button>
            </div>
        </div>
    `;

    // 绑定事件
    topBar.querySelector('#daily-checkin-btn').addEventListener('click', () => {
        const result = dailyCheckIn();
        if (result.success) {
            showCelebration(`🎉 打卡成功！连续 ${result.checkIn.currentStreak} 天`);
            updateGameTopBar();
        } else {
            showCelebration('今天已经打卡过了！');
        }
    });

    topBar.querySelector('#badges-display').addEventListener('click', () => {
        showBadgesModal(getUserBadges(), Object.values(BADGES));
    });

    topBar.querySelector('#leaderboard-btn').addEventListener('click', () => {
        showLeaderboardModal(getLeaderboard());
    });

    return topBar;
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
 * 更新游戏化顶部栏
 */
function updateGameTopBar() {
    const topBar = document.querySelector('.bg-white.rounded-2xl.shadow-lg.p-4');
    if (topBar) {
        const newTopBar = createGameTopBar();
        topBar.replaceWith(newTopBar);
        lucide.createIcons();
    }
}

// 导出给全局使用
window.updateGameTopBar = updateGameTopBar;
