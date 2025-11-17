import { userDataService } from '../services/user_data_service.js';

function generateActivityCalendarHTML() {
    const totalDays = 15 * 7; // Approx 15 weeks
    let html = '';
    const activityColors = [
        'bg-gray-200',      // No activity
        'bg-sky-200',       // Low
        'bg-sky-400',       // Medium
        'bg-sky-600',       // High
        'bg-sky-800'        // Very High
    ];

    for (let i = 0; i < totalDays; i++) {
        const activityLevel = Math.floor(Math.random() * activityColors.length);
        const color = activityColors[activityLevel];
        html += `<div class="activity-day ${color}" title="Simulated activity"></div>`;
    }
    return html;
}


export async function renderDashboard(container) {
    // 显示加载状态
    container.innerHTML = `
        <div class="flex justify-center items-center h-64">
            <div class="text-center">
                <i data-lucide="loader" class="animate-spin text-blue-500 w-12 h-12"></i>
                <p class="mt-4 text-gray-600">加载学习数据中...</p>
            </div>
        </div>
    `;
    lucide.createIcons();

    // 获取用户数据
    const [stats, badges, checkins] = await Promise.all([
        userDataService.getStats(),
        userDataService.getBadges(),
        userDataService.getCheckins()
    ]);

    // 计算统计数据
    const totalHours = Math.floor((stats.total_study_time || 0) / 3600);
    const wordsLearned = stats.words_learned || 0;
    const completionRate = stats.completion_rate || 0;
    const currentStreak = stats.current_streak || 0;

    container.innerHTML = `
        <div class="space-y-10">
            <!-- Section: Learning Statistics -->
            <div>
                <h2 class="text-2xl font-bold text-gray-800 mb-4">学习统计</h2>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <!-- Stat Card 1: Total Learning Time -->
                    <div class="bg-white rounded-xl shadow-sm p-6 flex items-center">
                        <div class="p-3 bg-blue-100 rounded-full">
                            <i data-lucide="clock" class="w-7 h-7 text-blue-600"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm text-gray-500">累计学习</p>
                            <p class="text-2xl font-semibold text-gray-800">${totalHours} 小时</p>
                        </div>
                    </div>
                    <!-- Stat Card 2: Vocabulary Learned -->
                    <div class="bg-white rounded-xl shadow-sm p-6 flex items-center">
                        <div class="p-3 bg-green-100 rounded-full">
                            <i data-lucide="book-copy" class="w-7 h-7 text-green-600"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm text-gray-500">已学单词</p>
                            <p class="text-2xl font-semibold text-gray-800">${wordsLearned} 个</p>
                        </div>
                    </div>
                    <!-- Stat Card 3: Course Completion -->
                    <div class="bg-white rounded-xl shadow-sm p-6 flex items-center">
                        <div class="p-3 bg-yellow-100 rounded-full">
                           <i data-lucide="pie-chart" class="w-7 h-7 text-yellow-600"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm text-gray-500">课程完成度</p>
                            <p class="text-2xl font-semibold text-gray-800">${completionRate}%</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Section: Activity Calendar -->
            <div>
                <h2 class="text-2xl font-bold text-gray-800 mb-4">学习日历</h2>
                <div class="bg-white rounded-xl shadow-sm p-6 overflow-x-auto">
                    <div class="activity-grid">
                        ${generateActivityCalendarHTML()}
                    </div>
                </div>
            </div>

            <!-- Section: Achievements / Badges -->
            <div>
                <h2 class="text-2xl font-bold text-gray-800 mb-4">成就徽章</h2>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    ${badges && badges.length > 0 ? badges.map(badge => `
                        <div class="bg-white rounded-xl shadow-sm p-6 text-center">
                            <div class="w-20 h-20 bg-orange-100 rounded-full mx-auto flex items-center justify-center text-4xl">
                                ${badge.badge_icon || '🏆'}
                            </div>
                            <h3 class="mt-4 font-semibold text-lg text-gray-800">${badge.badge_name}</h3>
                            <p class="mt-1 text-sm text-gray-500">获得于 ${new Date(badge.earned_at).toLocaleDateString()}</p>
                        </div>
                    `).join('') : `
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
                            <p class="mt-1 text-sm text-gray-500">继续保持学习习惯！</p>
                        </div>
                    `}
                </div>
            </div>
        </div>
    `;

    lucide.createIcons();
}
