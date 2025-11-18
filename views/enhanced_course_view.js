/**
 * 增强版课程视图 - 包含完整的交互式学习系统
 */

import { speak } from '../services/speech_service.js';
import { saveExerciseAnswers, getExerciseAnswers, clearExerciseAnswers } from '../utils/progress_manager.js';
import {
    getAllCourses,
    getCourseById,
    getCourseProgress,
    updateCourseProgress,
    isCourseUnlocked,
    startCourse,
    completeCourse,
    recordStudyTime,
    getCourseCompletionRate,
    getNextRecommendedCourse,
    getLearningStats
} from '../utils/course_manager.js';
import {
    getPoints,
    addPoints,
    getUserBadges,
    awardBadge,
    dailyCheckIn,
    getCheckInInfo,
    recordMistake,
    getMistakes,
    POINT_RULES,
    BADGES
} from '../utils/gamification_manager.js';
import {
    showMistakesModal,
    showBadgesModal,
    showCourseCompleteModal,
    showScoreModal,
    showCelebration
} from '../utils/modal_manager.js';

let currentCourseId = 'lesson_1';
let startTime = null;
let studyTimer = null;

const createEmptyAnswerState = () => ({
    fill: [],
    choice: [],
    match: {}
});

let correctAnswers = createEmptyAnswerState();
let answerStatuses = createEmptyAnswerState();
let isRestoringAnswers = false;

function resetCorrectAnswers() {
    correctAnswers = createEmptyAnswerState();
}

function resetAnswerStatuses() {
    answerStatuses = createEmptyAnswerState();
}

function initializeAnswerStatuses() {
    answerStatuses.fill = new Array(correctAnswers.fill?.length || 0).fill(null);
    answerStatuses.choice = new Array(correctAnswers.choice?.length || 0).fill(null);
    answerStatuses.match = {};

    if (correctAnswers.match) {
        Object.keys(correctAnswers.match).forEach(key => {
            answerStatuses.match[key] = null;
        });
    }
}

function escapeHtml(value) {
    if (value === undefined || value === null) {
        return '';
    }

    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * 渲染课程导航侧边栏
 */
function renderCourseSidebar() {
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
            <button id="show-badges-btn" class="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition">
                <i data-lucide="award" class="w-4 h-4"></i>
                我的徽章 (${getUserBadges().length})
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
        courseCard.className = `relative p-3 rounded-lg border-2 transition cursor-pointer
            ${!unlocked ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'hover:shadow-md bg-white'}
            ${currentCourseId === course.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`;

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

        if (unlocked) {
            courseCard.addEventListener('click', () => {
                loadCourse(course.id);
            });
        }

        courseList.appendChild(courseCard);
    });

    // 绑定按钮事件
    sidebar.querySelector('#show-mistakes-btn').addEventListener('click', () => {
        showMistakesModal(getMistakes(false));
    });
    sidebar.querySelector('#show-badges-btn').addEventListener('click', () => {
        showBadgesModal(getUserBadges(), Object.values(BADGES));
    });

    return sidebar;
}

/**
 * 渲染顶部状态栏
 */
function renderTopBar() {
    const points = getPoints();
    const checkIn = getCheckInInfo();
    const badges = getUserBadges();

    const topBar = document.createElement('div');
    topBar.className = 'bg-white rounded-2xl shadow-lg p-4 mb-6';
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
                <div class="ml-4 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
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
                    <div class="text-sm text-gray-600">连续学习天数</div>
                </div>
            </div>

            <!-- 徽章 -->
            <div class="flex items-center gap-3">
                <div class="w-12 h-12 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center text-2xl">
                    🏆
                </div>
                <div>
                    <div class="text-2xl font-bold text-gray-900">${badges.length}</div>
                    <div class="text-sm text-gray-600">获得徽章</div>
                </div>
            </div>

            <!-- 每日打卡按钮 -->
            <button id="daily-checkin-btn" class="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:shadow-lg transition flex items-center gap-2">
                <i data-lucide="check-circle" class="w-5 h-5"></i>
                <span>每日打卡</span>
            </button>
        </div>
    `;

    // 绑定打卡按钮
    topBar.querySelector('#daily-checkin-btn').addEventListener('click', handleDailyCheckIn);

    return topBar;
}

/**
 * 加载课程内容
 */
async function loadCourse(courseId) {
    currentCourseId = courseId;
    startTime = Date.now();

    // 标记课程为已开始
    startCourse(courseId);

    // 启动学习计时器
    startStudyTimer();

    const course = getCourseById(courseId);
    const contentArea = document.getElementById('course-content-area');

    contentArea.innerHTML = `
        <div class="flex justify-center items-center h-64">
            <div class="text-center">
                <i data-lucide="loader" class="animate-spin text-blue-500 w-12 h-12 mx-auto"></i>
                <p class="mt-4 text-gray-600">正在加载课程...</p>
            </div>
        </div>
    `;
    lucide.createIcons();

    try {
        const response = await fetch(course.content);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const markdown = await response.text();
        const htmlContent = marked.parse(markdown);

        const contentWrapper = document.createElement('div');
        contentWrapper.innerHTML = htmlContent;

        parseForInteractivity(contentWrapper, courseId);

        const courseContainer = document.createElement('div');
        courseContainer.className = 'bg-white p-6 sm:p-8 rounded-2xl shadow-lg prose max-w-none';
        courseContainer.innerHTML = `
            <!-- 课程头部 -->
            <div class="not-prose mb-8 pb-6 border-b">
                <div class="flex items-start gap-4">
                    <div class="text-5xl">${course.icon}</div>
                    <div class="flex-1">
                        <h1 class="text-3xl font-bold text-gray-900 mb-2">${course.title}</h1>
                        <p class="text-lg text-gray-600 mb-4">${course.subtitle}</p>
                        <div class="flex flex-wrap gap-2">
                            <span class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                                ${course.level}
                            </span>
                            <span class="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm flex items-center gap-1">
                                <i data-lucide="clock" class="w-3 h-3"></i>
                                ${course.duration} 分钟
                            </span>
                            ${course.topics.map(topic => `
                                <span class="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                                    ${topic}
                                </span>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
        courseContainer.appendChild(contentWrapper);

        contentArea.innerHTML = '';
        contentArea.appendChild(courseContainer);

        lucide.createIcons();

        // 恢复之前保存的答案
        setTimeout(() => {
            const savedAnswers = getExerciseAnswers(courseId);
            if (savedAnswers) {
                restoreUserAnswers(savedAnswers);
            }
        }, 500);

        // 重新渲染侧边栏以更新当前课程高亮
        const sidebar = document.getElementById('course-sidebar');
        if (sidebar) {
            sidebar.replaceWith(renderCourseSidebar());
            lucide.createIcons();
        }

    } catch (error) {
        console.error("Failed to load course content:", error);
        contentArea.innerHTML = `<div class="text-center p-8 bg-white rounded-lg shadow">
            <h2 class="text-xl font-bold text-red-600">加载失败</h2>
            <p>无法加载课程内容，请稍后重试。</p>
        </div>`;
    }
}

/**
 * 启动学习计时器
 */
function startStudyTimer() {
    if (studyTimer) {
        clearInterval(studyTimer);
    }

    studyTimer = setInterval(() => {
        if (startTime && currentCourseId) {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            recordStudyTime(currentCourseId, 30); // 每30秒记录一次
        }
    }, 30000);
}

/**
 * 停止学习计时器
 */
function stopStudyTimer() {
    if (studyTimer) {
        clearInterval(studyTimer);
        studyTimer = null;
    }

    if (startTime && currentCourseId) {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        recordStudyTime(currentCourseId, elapsed % 30); // 记录剩余时间
    }
}

/**
 * 解析课程内容，添加交互性
 */
function parseForInteractivity(wrapper, courseId) {
    resetCorrectAnswers();
    resetAnswerStatuses();
    // 对话部分添加语音按钮
    const dialogueParagraphs = Array.from(wrapper.querySelectorAll('p')).filter(p =>
        p.textContent.includes('Aurélie:') || p.textContent.includes('Li Wei:')
    );

    dialogueParagraphs.forEach(p => {
        p.className = 'flex items-start gap-4 p-3 rounded-lg even:bg-slate-50';
        const content = p.innerHTML;

        if (content.startsWith('<strong>Aurélie:</strong>')) {
            const textToSpeak = p.textContent.split('(')[0].replace('Aurélie:', '').trim();
            p.innerHTML = `
                <img src="https://r2.flowith.net/files/png/Y6F4R-ai_french_teacher_avatar_index_1@1024x1024.png"
                    class="w-10 h-10 rounded-full flex-shrink-0" alt="Aurélie">
                <div class="flex-grow">${content}</div>
                <button class="play-audio-btn p-2 rounded-full hover:bg-blue-100 transition-colors"
                    data-text="${textToSpeak}">
                    <i data-lucide="volume-2" class="w-5 h-5 text-blue-500"></i>
                </button>
            `;
        } else {
            p.innerHTML = `
                <span class="w-10 h-10 rounded-full flex-shrink-0 bg-gray-200 flex items-center justify-center font-bold text-gray-600">
                    LW
                </span>
                <div class="flex-grow">${content}</div>
            `;
        }
    });

    wrapper.querySelectorAll('.play-audio-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const text = btn.getAttribute('data-text');
            speak(text, { lang: 'fr-FR' });
        });
    });

    // 处理练习部分
    const exerciseHeader = wrapper.querySelector('h3#exercices-interactifs');
    if (exerciseHeader) {
        const answerComment = Array.from(wrapper.childNodes).find(node =>
            node.nodeType === 8 && node.textContent.trim().startsWith('答案：')
        );

        if (answerComment) {
            parseAnswers(answerComment.textContent);
            answerComment.remove();
        }

        initializeAnswerStatuses();

        let element = exerciseHeader.nextElementSibling;
        while (element) {
            if (element.tagName === 'P' && element.textContent.startsWith('1. 填空题')) {
                element = createFillInTheBlanks(element, courseId);
            } else if (element.tagName === 'P' && element.textContent.startsWith('2. 选择题')) {
                element = createMultipleChoice(element, courseId);
            } else if (element.tagName === 'P' && element.textContent.startsWith('3. 匹配题')) {
                element = createMatching(element, courseId);
            } else if (element.tagName === 'H3' || element.tagName === 'H2') {
                break;
            }
            element = element.nextElementSibling;
        }

        // 答案操作按钮（仅保留重置）
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'not-prose mt-8 flex justify-end';
        buttonContainer.innerHTML = `
            <button id="reset-answers-btn" class="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-all flex items-center gap-2">
                <i data-lucide="rotate-ccw" class="w-5 h-5"></i>
                <span>重置</span>
            </button>
        `;

        exerciseHeader.parentElement.appendChild(buttonContainer);

        buttonContainer.querySelector('#reset-answers-btn').addEventListener('click', () => resetAnswers(courseId));
    }
}

// [继续在下一部分...]

// 答案解析和练习创建函数（从原来的course_view.js复制并增强）
function parseAnswers(answerString) {
    if (!answerString) {
        return;
    }

    correctAnswers.fill = [];
    correctAnswers.choice = [];
    correctAnswers.match = {};

    const normalized = answerString
        .replace(/<!--|-->/g, '')
        .replace(/[()（）]/g, '')
        .replace(/答案[:：]?/i, '')
        .replace(/Unité\s*\d+[:：]?/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

    if (!normalized) {
        return;
    }

    const sectionRegex = /([1-3])\s*[-:：]\s*([^;；]+)/g;
    let match;

    while ((match = sectionRegex.exec(normalized)) !== null) {
        const sectionIndex = match[1];
        const content = match[2].trim();

        if (sectionIndex === '1') {
            correctAnswers.fill = parseSequentialAnswers(content);
        } else if (sectionIndex === '2') {
            correctAnswers.choice = parseSequentialAnswers(content);
        } else if (sectionIndex === '3') {
            correctAnswers.match = parseMatchingAnswers(content);
        }
    }
}

function parseSequentialAnswers(content) {
    const answers = [];
    const pairRegex = /([a-z])[\.\)]?\s*([^,，；;]+)/gi;
    let match;

    while ((match = pairRegex.exec(content)) !== null) {
        answers.push(match[2].trim());
    }

    return answers;
}

function parseMatchingAnswers(content) {
    const matchAnswers = {};
    const pairRegex = /(\d+)\s*[-:：]\s*([A-Z])/g;
    let match;

    while ((match = pairRegex.exec(content)) !== null) {
        matchAnswers[match[1]] = match[2];
    }

    return matchAnswers;
}

function createFillInTheBlanks(pElement, courseId) {
    const list = pElement.nextElementSibling;
    if (list && list.tagName === 'OL') {
        Array.from(list.children).forEach((li, index) => {
            const input = `<input type="text" 
                class="exercise-input px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition" 
                data-exercise="fill" 
                data-index="${index}"
                data-course="${courseId}"
                placeholder="输入答案...">`;
            li.innerHTML = li.innerHTML.replace('______', input);

            const inputElement = li.querySelector(`input[data-exercise="fill"][data-index="${index}"][data-course="${courseId}"]`);
            if (inputElement) {
                inputElement.addEventListener('input', () => evaluateFillAnswer(inputElement));
                inputElement.addEventListener('blur', () => evaluateFillAnswer(inputElement));
            }
        });
        pElement.parentNode.insertBefore(list, pElement.nextSibling);
        return list;
    }
    return pElement;
}

function createMultipleChoice(pElement, courseId) {
    const list = pElement.nextElementSibling;
    if (list && list.tagName === 'OL') {
        Array.from(list.children).forEach((li, index) => {
            const { questionHtml, options } = extractChoiceQuestionAndOptions(li);
            const choiceOptions = (options.length > 0 ? options : ['un', 'une'])
                .map((optionText, optionIndex) => createChoiceOption(optionText, courseId, index, optionIndex))
                .join('');

            const inlineClass = questionHtml.includes('______')
                ? 'inline-flex flex-wrap gap-2 mx-2'
                : 'flex flex-wrap gap-3 mt-3';

            const optionsWrapper = `
                <span class="choice-options ${inlineClass}"
                    data-exercise="choice"
                    data-index="${index}"
                    data-course="${courseId}">
                    ${choiceOptions}
                </span>
            `;

            if (questionHtml.includes('______')) {
                li.innerHTML = questionHtml.replace('______', optionsWrapper);
            } else {
                li.innerHTML = `
                    <div class="choice-question">${questionHtml}</div>
                    ${optionsWrapper}
                `;
            }

            const choiceContainer = li.querySelector(`[data-exercise="choice"][data-index="${index}"][data-course="${courseId}"]`);
            if (choiceContainer) {
                choiceContainer.querySelectorAll('input[type="radio"]').forEach(radio => {
                    radio.addEventListener('change', () => evaluateChoiceAnswer(choiceContainer));
                });
            }
        });

        pElement.parentNode.insertBefore(list, pElement.nextSibling);
        return list;
    }
    return pElement;
}

function extractChoiceQuestionAndOptions(listItem) {
    const hasOptionMarker = listItem.innerHTML.includes('□');
    const questionHtml = hasOptionMarker
        ? listItem.innerHTML.split('□')[0].trim()
        : listItem.innerHTML;

    const rawText = (listItem.textContent || '').trim();
    const optionTexts = rawText
        .split('□')
        .slice(1)
        .map(option => option.replace(/[\s\u3000\u00A0]+/g, ' ').replace(/[，,]$/g, '').trim())
        .filter(Boolean);

    return {
        questionHtml,
        options: optionTexts
    };
}

function createChoiceOption(optionText, courseId, questionIndex, optionIndex) {
    const value = optionText.trim();
    const optionId = `choice-${courseId}-${questionIndex}-${optionIndex}`;

    return `
        <label for="${optionId}" class="cursor-pointer inline-flex items-center px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-blue-50 transition">
            <input
                type="radio"
                id="${optionId}"
                name="choice-${courseId}-${questionIndex}"
                value="${escapeHtml(value)}"
                class="mr-2 w-4 h-4 text-blue-600 focus:ring-blue-500">
            <span>${escapeHtml(value)}</span>
        </label>
    `;
}

function createMatching(pElement, courseId) {
    const table = pElement.nextElementSibling;
    if (table && table.tagName === 'TABLE') {
        table.id = 'matching-exercise';
        table.className = 'w-full border-collapse';
        table.dataset.course = courseId;
        const rows = table.querySelectorAll('tr');
        
        rows.forEach((row, rowIndex) => {
            if (rowIndex === 0) {
                row.className = 'bg-gray-100 font-semibold';
            } else {
                row.className = 'hover:bg-gray-50 transition';
                const cells = row.querySelectorAll('td');
                if (cells.length === 3) {
                    const sourceIdMatch = cells[0].textContent.match(new RegExp('\\d+'));
                    const targetIdMatch = cells[2].textContent.match(new RegExp('[A-Z]+'));

                    cells[0].dataset.matchId = sourceIdMatch ? sourceIdMatch[0] : '';
                    cells[0].dataset.course = courseId;
                    cells[0].classList.add('cursor-pointer', 'match-source', 'p-3', 'border', 'hover:bg-blue-100', 'transition');

                    cells[2].dataset.matchId = targetIdMatch ? targetIdMatch[0] : '';
                    cells[2].dataset.course = courseId;
                    cells[2].classList.add('cursor-pointer', 'match-target', 'p-3', 'border', 'hover:bg-purple-100', 'transition');

                    cells[1].classList.add('p-3', 'border', 'match-feedback-cell', 'text-center', 'font-semibold');
                    cells[1].innerHTML = '';

                    row.dataset.rowId = rowIndex;
                    row.dataset.course = courseId;
                }
            }
        });

        let selectedSource = null;
        table.addEventListener('click', e => {
            const source = e.target.closest('.match-source');
            const target = e.target.closest('.match-target');

            if (source) {
                table.querySelectorAll('.match-source').forEach(s => s.classList.remove('bg-blue-200', 'border-blue-500'));
                selectedSource = source;
                selectedSource.classList.add('bg-blue-200', 'border-blue-500');
            } else if (target && selectedSource) {
                const sourceId = selectedSource.dataset.matchId;
                const rowId = selectedSource.closest('tr').dataset.rowId;

                const tableElement = target.closest('table');
                const existingSelection = tableElement?.querySelector(`[data-match-row="${rowId}"]`);
                if (existingSelection) {
                    existingSelection.classList.remove('bg-green-200', 'text-green-800', 'font-bold', 'border-green-500');
                    delete existingSelection.dataset.matchRow;
                }

                if (target.dataset.matchRow && target.dataset.matchRow !== rowId) {
                    const previousRowSource = tableElement?.querySelector(`tr[data-row-id="${target.dataset.matchRow}"] .match-source`);
                    if (previousRowSource) {
                        const previousSourceId = previousRowSource.dataset.matchId;
                        delete previousRowSource.dataset.userAnswer;
                        applyMatchFeedback(previousRowSource, null);
                        updateQuestionStatus('match', previousSourceId, null, courseId);
                    }
                }

                target.classList.add('bg-green-200', 'text-green-800', 'font-bold', 'border-green-500');
                target.dataset.matchRow = rowId;
                selectedSource.dataset.userAnswer = target.dataset.matchId;

                const evaluatedSource = selectedSource;
                selectedSource.classList.remove('bg-blue-200', 'border-blue-500');
                selectedSource = null;

                evaluateMatchAnswer(evaluatedSource);
            }
        });

        pElement.parentNode.insertBefore(table, pElement.nextSibling);
        return table;
    }
    return pElement;
}

// 收集和恢复答案
function collectUserAnswers() {
    const answers = { fill: [], choice: [], match: {} };

    document.querySelectorAll('[data-exercise="fill"]').forEach(input => {
        answers.fill.push(input.value.trim());
    });

    document.querySelectorAll('[data-exercise="choice"]').forEach(span => {
        const index = span.dataset.index;
        const courseId = span.dataset.course;
        const selectedRadio = document.querySelector(`input[name="choice-${courseId}-${index}"]:checked`);
        answers.choice.push(selectedRadio ? selectedRadio.value : null);
    });

    document.querySelectorAll('.match-source').forEach(source => {
        const sourceId = source.dataset.matchId;
        const userAnswer = source.dataset.userAnswer;
        if (userAnswer) {
            answers.match[sourceId] = userAnswer;
        }
    });

    return answers;
}

function restoreUserAnswers(answers) {
    if (!answers) return;

    isRestoringAnswers = true;
    try {
    if (answers.fill && Array.isArray(answers.fill)) {
        document.querySelectorAll('[data-exercise="fill"]').forEach((input, index) => {
                input.value = answers.fill[index] || '';
                evaluateFillAnswer(input);
        });
    }

    if (answers.choice && Array.isArray(answers.choice)) {
        document.querySelectorAll('[data-exercise="choice"]').forEach((span, index) => {
            const value = answers.choice[index];
                const courseId = span.dataset.course;

                span.querySelectorAll(`input[name="choice-${courseId}-${index}"]`).forEach(radio => {
                    radio.checked = radio.value === value;
                });

                evaluateChoiceAnswer(span);
        });
    }

    if (answers.match && typeof answers.match === 'object') {
        Object.keys(answers.match).forEach(sourceId => {
            const targetId = answers.match[sourceId];
            const source = document.querySelector(`.match-source[data-match-id="${sourceId}"]`);
            const target = document.querySelector(`.match-target[data-match-id="${targetId}"]`);
            if (source && target) {
                const rowId = source.closest('tr').dataset.rowId;
                    source.dataset.userAnswer = targetId;
                target.dataset.matchRow = rowId;
                    evaluateMatchAnswer(source);
            }
        });
    }
    } finally {
        isRestoringAnswers = false;
    }

    updateProgressAfterAnswer(currentCourseId);
}

// 即时评估函数
function evaluateFillAnswer(input) {
    if (!input) return;

    const index = Number(input.dataset.index);
    const courseId = input.dataset.course;
    const userAnswer = input.value.trim();
    const correctAnswer = (correctAnswers.fill && correctAnswers.fill[index]) ? correctAnswers.fill[index] : '';

    input.classList.remove('border-green-500', 'border-red-500', 'bg-green-50', 'bg-red-50');

    if (!userAnswer) {
        input.classList.add('border-gray-300');
        removeAnswerFeedback(input);
        updateQuestionStatus('fill', index, null, courseId);
        if (!isRestoringAnswers) {
            persistExerciseAnswers(courseId);
            updateProgressAfterAnswer(courseId);
        }
        return;
    }

    const isCorrect = normalizeAnswer(userAnswer) === normalizeAnswer(correctAnswer);
    input.classList.remove('border-gray-300');
    input.classList.add(isCorrect ? 'border-green-500' : 'border-red-500', isCorrect ? 'bg-green-50' : 'bg-red-50');

    addAnswerFeedback(input, isCorrect, correctAnswer);
    updateQuestionStatus('fill', index, isCorrect ? 'correct' : 'incorrect', courseId, {
        question: input.closest('li')?.textContent?.trim() || '',
                correctAnswer,
        userAnswer
    });

    if (!isRestoringAnswers) {
        persistExerciseAnswers(courseId);
        updateProgressAfterAnswer(courseId);
    }
}

function evaluateChoiceAnswer(container) {
    if (!container) return;

    const courseId = container.dataset.course;
    const index = Number(container.dataset.index);
    const correctAnswer = (correctAnswers.choice && correctAnswers.choice[index]) ? correctAnswers.choice[index] : '';
    const selectedRadio = container.querySelector('input[type="radio"]:checked');

    let resultSpan = container.nextElementSibling;
    const hasFeedback = resultSpan && resultSpan.classList.contains('answer-feedback');

    if (!selectedRadio) {
        if (hasFeedback && resultSpan) {
            resultSpan.remove();
        }
        updateQuestionStatus('choice', index, null, courseId);
        if (!isRestoringAnswers) {
            persistExerciseAnswers(courseId);
            updateProgressAfterAnswer(courseId);
        }
        return;
    }

    const isCorrect = normalizeAnswer(selectedRadio.value) === normalizeAnswer(correctAnswer);

    if (!hasFeedback) {
        resultSpan = document.createElement('span');
        resultSpan.className = 'answer-feedback ml-3 text-2xl font-bold';
        container.parentNode.insertBefore(resultSpan, container.nextSibling);
    }

    resultSpan.textContent = isCorrect ? '✓' : '✗';
    resultSpan.className = `answer-feedback ml-3 text-2xl font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`;

    updateQuestionStatus('choice', index, isCorrect ? 'correct' : 'incorrect', courseId, {
        question: container.closest('li')?.textContent?.trim() || '',
        correctAnswer,
        userAnswer: selectedRadio.value
    });

    if (!isRestoringAnswers) {
        persistExerciseAnswers(courseId);
        updateProgressAfterAnswer(courseId);
    }
}

function evaluateMatchAnswer(sourceCell) {
    if (!sourceCell) return;

    const row = sourceCell.closest('tr');
    const courseId = row?.dataset.course;
    const sourceId = sourceCell.dataset.matchId;
    const userAnswer = sourceCell.dataset.userAnswer;
    const correctAnswer = correctAnswers.match ? correctAnswers.match[sourceId] : null;

    if (!userAnswer) {
        applyMatchFeedback(sourceCell, null);
        updateQuestionStatus('match', sourceId, null, courseId);
        if (!isRestoringAnswers) {
            persistExerciseAnswers(courseId);
            updateProgressAfterAnswer(courseId);
        }
        return;
    }

    const isCorrect = normalizeAnswer(userAnswer) === normalizeAnswer(correctAnswer);
    applyMatchFeedback(sourceCell, isCorrect ? 'correct' : 'incorrect');

    updateQuestionStatus('match', sourceId, isCorrect ? 'correct' : 'incorrect', courseId, {
        question: sourceCell.textContent.trim(),
        correctAnswer,
        userAnswer
    });

    if (!isRestoringAnswers) {
        persistExerciseAnswers(courseId);
        updateProgressAfterAnswer(courseId);
    }
}

function applyMatchFeedback(sourceCell, status) {
    const row = sourceCell.closest('tr');
    const table = sourceCell.closest('table');
    const rowId = row?.dataset.rowId;
    const feedbackCell = row?.querySelector('.match-feedback-cell');
    const target = table?.querySelector(`.match-target[data-match-row="${rowId}"]`);

    if (feedbackCell) {
        feedbackCell.innerHTML = '';
        if (status === 'correct') {
            feedbackCell.innerHTML = '<span class="text-green-600 text-2xl font-bold">✓</span>';
        } else if (status === 'incorrect') {
            feedbackCell.innerHTML = '<span class="text-red-600 text-2xl font-bold">✗</span>';
        }
    }

    if (target) {
        target.classList.remove('bg-green-200', 'text-green-800', 'font-bold', 'border-green-500', 'bg-red-100', 'text-red-600', 'border-red-500');
        if (status === 'correct') {
            target.classList.add('bg-green-200', 'text-green-800', 'font-bold', 'border-green-500');
        } else if (status === 'incorrect') {
            target.classList.add('bg-red-100', 'text-red-600', 'border-red-500');
        } else {
            delete target.dataset.matchRow;
        }
    }
}

function persistExerciseAnswers(courseId) {
    if (!courseId || isRestoringAnswers) {
        return;
    }
    saveExerciseAnswers(courseId, collectUserAnswers());
}

function updateQuestionStatus(type, key, status, courseId, metadata = {}) {
    const previousStatus = getAnswerStatus(type, key);

    if (previousStatus === status) {
        return;
    }

    setAnswerStatus(type, key, status);

    if (isRestoringAnswers || !courseId) {
        return;
    }

    if (status === 'correct') {
        addPoints(POINT_RULES.CORRECT_ANSWER, '答对题目');
    } else if (status === 'incorrect') {
            addPoints(POINT_RULES.WRONG_ANSWER, '答错题目');
            
        if (previousStatus !== 'incorrect') {
            const questionId = buildQuestionId(type, courseId, key);
            recordMistake(questionId, {
                type,
                question: metadata.question || '',
                correctAnswer: metadata.correctAnswer || '',
                userAnswer: metadata.userAnswer || '',
                    courseId
                });
            }
        }
}

function getAnswerStatus(type, key) {
    if (type === 'fill' || type === 'choice') {
        return answerStatuses[type]?.[key] ?? null;
    }
    return answerStatuses.match?.[key] ?? null;
}

function setAnswerStatus(type, key, status) {
    if (type === 'fill' || type === 'choice') {
        if (!Array.isArray(answerStatuses[type])) {
            answerStatuses[type] = [];
        }
        answerStatuses[type][key] = status;
    } else {
        if (!answerStatuses.match) {
            answerStatuses.match = {};
        }
        answerStatuses.match[key] = status;
    }
}

function buildQuestionId(type, courseId, key) {
    return `${courseId}_${type}_${key}`;
}

function updateProgressAfterAnswer(courseId) {
    if (!courseId) return;

    const summary = getAnswerSummary();
    const score = summary.totalQuestions > 0
        ? Math.round((summary.correctCount / summary.totalQuestions) * 100)
        : 0;

    const currentProgress = getCourseProgress(courseId) || {};
    const updatedProgress = updateCourseProgress(courseId, {
        score,
        lastScore: score,
        attempts: currentProgress.attempts || 1
    }) || currentProgress;

    const answeredAll = summary.totalQuestions > 0 && summary.answeredCount === summary.totalQuestions;

    if (!answeredAll && updatedProgress.failedNotified) {
        updateCourseProgress(courseId, { failedNotified: false });
    }

    if (score === 100 && answeredAll && !updatedProgress.perfectCelebrated) {
        addPoints(POINT_RULES.PERFECT_EXERCISE, '完美答题');
        awardBadge('perfect_score');
        showCelebration('🎉 完美答题！');
        updateCourseProgress(courseId, { perfectCelebrated: true });
    }

    if (answeredAll && score >= 60 && !updatedProgress.completed) {
        completeCourse(courseId, score);
        addPoints(POINT_RULES.COMPLETE_LESSON, '完成课程');
        showCourseCompleteModal(
            getCourseById(courseId),
            score,
            summary.correctCount,
            summary.totalQuestions,
            getNextRecommendedCourse()
        );
    } else if (answeredAll && score < 60 && !updatedProgress.failedNotified) {
        showScoreModal(score, summary.correctCount, summary.totalQuestions);
        updateCourseProgress(courseId, { failedNotified: true });
    }
}

function getAnswerSummary() {
    const fillStatuses = answerStatuses.fill || [];
    const choiceStatuses = answerStatuses.choice || [];
    const matchStatuses = answerStatuses.match ? Object.values(answerStatuses.match) : [];
    const totalQuestions =
        (correctAnswers.fill?.length || 0) +
        (correctAnswers.choice?.length || 0) +
        (correctAnswers.match ? Object.keys(correctAnswers.match).length : 0);

    const allStatuses = [...fillStatuses, ...choiceStatuses, ...matchStatuses];
    const correctCount = allStatuses.filter(status => status === 'correct').length;
    const answeredCount = allStatuses.filter(status => status === 'correct' || status === 'incorrect').length;

    return { totalQuestions, correctCount, answeredCount };
}

function normalizeAnswer(value) {
    if (!value) return '';
    return value
        .toString()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}

// 添加答案反馈（即时提示）
function addAnswerFeedback(element, isCorrect, correctAnswer = '') {
    const existingFeedback = element.nextElementSibling;
    if (existingFeedback && existingFeedback.classList.contains('answer-feedback')) {
        existingFeedback.remove();
    }

    const feedback = document.createElement('div');
    feedback.className = 'answer-feedback mt-2 text-sm';

    if (isCorrect) {
        feedback.innerHTML = '<span class="text-green-600 font-medium">✓ 正确！</span>';
    } else {
        feedback.innerHTML = `<span class="text-red-600 font-medium">✗ 错误</span>`;
        if (correctAnswer) {
            feedback.innerHTML += ` <span class="text-gray-600">正确答案：<span class="font-semibold text-blue-600">${escapeHtml(correctAnswer)}</span></span>`;
        }
    }

    element.parentNode.insertBefore(feedback, element.nextSibling);
}

function removeAnswerFeedback(element) {
    const feedback = element?.nextElementSibling;
    if (feedback && feedback.classList.contains('answer-feedback')) {
        feedback.remove();
    }
}

// 重置答案
function resetAnswers(courseId = currentCourseId) {
    document.querySelectorAll('[data-exercise="fill"]').forEach(input => {
        input.value = '';
        input.classList.remove('border-green-500', 'border-red-500', 'bg-green-50', 'bg-red-50');
        input.classList.add('border-gray-300');
        removeAnswerFeedback(input);
    });

    document.querySelectorAll('[data-exercise="choice"]').forEach(span => {
        const choiceCourseId = span.dataset.course;
        const choiceIndex = span.dataset.index;
        document.querySelectorAll(`input[name="choice-${choiceCourseId}-${choiceIndex}"]`).forEach(radio => {
            radio.checked = false;
        });
        const feedback = span.nextElementSibling;
        if (feedback && feedback.classList.contains('answer-feedback')) {
            feedback.remove();
        }
    });

    document.querySelectorAll('.match-source').forEach(source => {
        delete source.dataset.userAnswer;
        source.classList.remove('bg-blue-200', 'border-blue-500');
    });

    document.querySelectorAll('.match-target').forEach(target => {
        target.classList.remove('bg-green-200', 'text-green-800', 'font-bold', 'border-green-500');
        target.classList.remove('bg-red-100', 'text-red-600', 'border-red-500');
        delete target.dataset.matchRow;
    });

    document.querySelectorAll('.match-feedback-cell').forEach(cell => {
        cell.innerHTML = '';
    });

    initializeAnswerStatuses();

    if (courseId) {
        clearExerciseAnswers(courseId);
        updateProgressAfterAnswer(courseId);
    }
}

// [继续下一部分...]
