/**
 * 模态框管理器 - 统一管理各种弹窗和提示
 */

import { markMistakeReviewed } from './gamification_manager.js';

/**
 * 显示课程完成模态框
 */
export function showCourseCompleteModal(course, score, correctCount, totalQuestions, nextCourse) {
    const modal = createModalContainer();

    modal.innerHTML = `
        <div class="bg-white rounded-2xl p-8 max-w-md w-full transform animate-scale-in">
            <div class="text-center">
                <div class="text-6xl mb-4 animate-bounce">🎉</div>
                <h2 class="text-3xl font-bold text-gray-900 mb-2">课程完成！</h2>
                <p class="text-gray-600 mb-6">恭喜你完成了 ${course.title}</p>

                <div class="bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl p-6 text-white mb-6">
                    <div class="text-5xl font-bold mb-2">${score}%</div>
                    <div class="text-sm opacity-90">答对 ${correctCount}/${totalQuestions} 题</div>
                </div>

                <div class="flex gap-3">
                    ${nextCourse ? `
                        <button id="next-course-btn" data-course-id="${nextCourse.id}"
                            class="flex-1 px-6 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition">
                            下一课
                        </button>
                    ` : ''}
                    <button id="close-modal-btn"
                        class="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition">
                        返回
                    </button>
                </div>
            </div>
        </div>
    `;

    // 绑定事件
    modal.querySelector('#close-modal-btn').addEventListener('click', () => closeModal(modal));

    if (nextCourse) {
        modal.querySelector('#next-course-btn').addEventListener('click', (e) => {
            const courseId = e.target.dataset.courseId;
            closeModal(modal);
            if (window.loadCourse) {
                window.loadCourse(courseId);
            }
        });
    }

    document.body.appendChild(modal);

    // 10秒后自动关闭
    setTimeout(() => closeModal(modal), 10000);
}

/**
 * 显示分数模态框
 */
export function showScoreModal(score, correctCount, totalQuestions) {
    const modal = createModalContainer();

    modal.innerHTML = `
        <div class="bg-white rounded-2xl p-8 max-w-md w-full transform animate-scale-in">
            <div class="text-center">
                <div class="text-5xl mb-4">${score >= 80 ? '😊' : score >= 60 ? '😐' : '😢'}</div>
                <h2 class="text-2xl font-bold text-gray-900 mb-2">得分：${score}%</h2>
                <p class="text-gray-600 mb-6">答对 ${correctCount}/${totalQuestions} 题</p>

                ${score < 60 ? `
                    <div class="bg-orange-100 text-orange-700 rounded-lg p-4 mb-6">
                        <p class="font-medium">继续努力！建议复习错题后再试一次。</p>
                    </div>
                ` : ''}

                <button id="close-modal-btn"
                    class="w-full px-6 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition">
                    好的
                </button>
            </div>
        </div>
    `;

    modal.querySelector('#close-modal-btn').addEventListener('click', () => closeModal(modal));

    document.body.appendChild(modal);
    setTimeout(() => closeModal(modal), 8000);
}

/**
 * 显示错题本模态框
 */
export function showMistakesModal(mistakes) {
    const modal = createModalContainer();

    modal.innerHTML = `
        <div class="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <i data-lucide="alert-circle" class="w-6 h-6 text-orange-500"></i>
                    错题本
                </h2>
                <button id="close-modal-btn" class="p-2 hover:bg-gray-100 rounded-lg transition">
                    <i data-lucide="x" class="w-6 h-6"></i>
                </button>
            </div>

            ${mistakes.length === 0 ? `
                <div class="text-center py-12">
                    <div class="text-6xl mb-4">🎉</div>
                    <p class="text-gray-600 text-lg">太棒了！你还没有错题。</p>
                </div>
            ` : `
                <div class="space-y-4">
                    ${mistakes.map((mistake, index) => `
                        <div class="border-2 border-orange-200 rounded-lg p-4 hover:bg-orange-50 transition" data-mistake-id="${mistake.id}">
                            <div class="flex items-start justify-between mb-2">
                                <span class="font-semibold text-gray-900">${index + 1}. ${getExerciseTypeName(mistake.type)}</span>
                                <span class="text-sm text-gray-500">错误 ${mistake.wrongCount} 次</span>
                            </div>
                            <p class="text-gray-700 mb-2">${escapeHtml(mistake.question)}</p>
                            <div class="flex flex-col gap-2 text-sm">
                                <span class="text-red-600">你的答案：${escapeHtml(mistake.userAnswer)}</span>
                                <span class="text-green-600">正确答案：${escapeHtml(mistake.correctAnswer)}</span>
                            </div>
                            <button class="mark-reviewed-btn mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
                                data-mistake-id="${mistake.id}">
                                标记已复习
                            </button>
                        </div>
                    `).join('')}
                </div>
            `}
        </div>
    `;

    // 绑定事件
    modal.querySelector('#close-modal-btn').addEventListener('click', () => closeModal(modal));

    modal.querySelectorAll('.mark-reviewed-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const mistakeId = e.target.dataset.mistakeId;
            markMistakeReviewed(mistakeId);

            const mistakeCard = modal.querySelector(`[data-mistake-id="${mistakeId}"]`);
            if (mistakeCard) {
                mistakeCard.style.animation = 'fadeOut 0.5s ease-out';
                setTimeout(() => mistakeCard.remove(), 500);
            }
        });
    });

    document.body.appendChild(modal);
    lucide.createIcons();
}

/**
 * 显示徽章模态框
 */
export function showBadgesModal(badges, allBadges) {
    const modal = createModalContainer();

    modal.innerHTML = `
        <div class="bg-white rounded-2xl p-8 max-w-3xl w-full max-h-[80vh] overflow-y-auto">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <i data-lucide="award" class="w-6 h-6 text-purple-500"></i>
                    我的徽章 (${badges.length}/${allBadges.length})
                </h2>
                <button id="close-modal-btn" class="p-2 hover:bg-gray-100 rounded-lg transition">
                    <i data-lucide="x" class="w-6 h-6"></i>
                </button>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                ${allBadges.map(badge => {
                    const earned = badges.find(b => b.id === badge.id);
                    return `
                        <div class="border-2 ${earned ? 'border-purple-300 bg-purple-50' : 'border-gray-200 bg-gray-50 opacity-50'} rounded-xl p-4 text-center transition hover:scale-105">
                            <div class="text-4xl mb-2">${badge.icon}</div>
                            <h3 class="font-semibold text-gray-900 mb-1">${badge.name}</h3>
                            <p class="text-sm text-gray-600 mb-2">${badge.description}</p>
                            <span class="inline-block px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                                +${badge.points} 积分
                            </span>
                            ${earned ? `
                                <div class="mt-2 text-xs text-gray-500">
                                    ${new Date(earned.earnedAt).toLocaleDateString()}
                                </div>
                            ` : ''}
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;

    modal.querySelector('#close-modal-btn').addEventListener('click', () => closeModal(modal));

    document.body.appendChild(modal);
    lucide.createIcons();
}

/**
 * 显示庆祝消息
 */
export function showCelebration(message, duration = 3000) {
    const celebration = document.createElement('div');
    celebration.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-8 py-4 rounded-full shadow-2xl z-50 font-bold text-lg animate-bounce-in';
    celebration.textContent = message;

    document.body.appendChild(celebration);

    setTimeout(() => {
        celebration.style.animation = 'fadeOut 0.5s ease-out';
        setTimeout(() => celebration.remove(), 500);
    }, duration);
}

/**
 * 显示排行榜模态框
 */
export function showLeaderboardModal(leaderboard) {
    const modal = createModalContainer();

    modal.innerHTML = `
        <div class="bg-white rounded-2xl p-8 max-w-md w-full">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <i data-lucide="trophy" class="w-6 h-6 text-yellow-500"></i>
                    排行榜
                </h2>
                <button id="close-modal-btn" class="p-2 hover:bg-gray-100 rounded-lg transition">
                    <i data-lucide="x" class="w-6 h-6"></i>
                </button>
            </div>

            <div class="space-y-3">
                ${leaderboard.map(user => `
                    <div class="flex items-center gap-4 p-4 rounded-lg ${user.isMe ? 'bg-blue-50 border-2 border-blue-500' : 'bg-gray-50'} transition hover:shadow-md">
                        <div class="text-2xl font-bold ${user.rank <= 3 ? 'text-yellow-500' : 'text-gray-400'} w-8">
                            ${user.rank === 1 ? '🥇' : user.rank === 2 ? '🥈' : user.rank === 3 ? '🥉' : user.rank}
                        </div>
                        <div class="text-3xl">${user.avatar}</div>
                        <div class="flex-1">
                            <div class="font-semibold text-gray-900">${user.name} ${user.isMe ? '(我)' : ''}</div>
                            <div class="text-sm text-gray-600">${user.points} 积分</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    modal.querySelector('#close-modal-btn').addEventListener('click', () => closeModal(modal));

    document.body.appendChild(modal);
    lucide.createIcons();
}

// 辅助函数
function createModalContainer() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in';
    return modal;
}

function closeModal(modal) {
    if (modal && modal.parentNode) {
        modal.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => modal.remove(), 300);
    }
}

function getExerciseTypeName(type) {
    const types = {
        'fill': '填空题',
        'choice': '选择题',
        'match': '匹配题'
    };
    return types[type] || '练习题';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 添加必要的动画样式
const style = document.createElement('style');
style.textContent = `
@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
}

@keyframes scale-in {
    from {
        transform: scale(0.9);
        opacity: 0;
    }
    to {
        transform: scale(1);
        opacity: 1;
    }
}

@keyframes bounce-in {
    0% {
        transform: scale(0.3) translateY(-50px);
        opacity: 0;
    }
    50% {
        transform: scale(1.05) translateY(5px);
    }
    70% {
        transform: scale(0.9) translateY(-5px);
    }
    100% {
        transform: scale(1) translateY(0);
        opacity: 1;
    }
}

.animate-fade-in {
    animation: fadeIn 0.3s ease-out;
}

.animate-scale-in {
    animation: scale-in 0.3s ease-out;
}

.animate-bounce-in {
    animation: bounce-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
`;

document.head.appendChild(style);
