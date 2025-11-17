/**
 * 增强版课程视图 - 包含完整的交互式学习系统
 */

import { speak } from '../services/speech_service.js';
import { saveExerciseAnswers, getExerciseAnswers } from '../utils/progress_manager.js';
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
    getLeaderboard,
    POINT_RULES,
    BADGES
} from '../utils/gamification_manager.js';

let currentCourseId = 'lesson_1';
let correctAnswers = {};
let startTime = null;
let studyTimer = null;

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
    sidebar.querySelector('#show-mistakes-btn').addEventListener('click', showMistakesModal);
    sidebar.querySelector('#show-badges-btn').addEventListener('click', showBadgesModal);

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

        // 添加检查答案按钮
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'not-prose mt-8 flex gap-4';
        buttonContainer.innerHTML = `
            <button id="check-answers-btn" class="px-6 py-3 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 transition-all hover:shadow-lg flex items-center gap-2">
                <i data-lucide="check-circle" class="w-5 h-5"></i>
                <span>检查答案</span>
            </button>
            <button id="reset-answers-btn" class="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-all flex items-center gap-2">
                <i data-lucide="rotate-ccw" class="w-5 h-5"></i>
                <span>重置</span>
            </button>
        `;

        exerciseHeader.parentElement.appendChild(buttonContainer);

        buttonContainer.querySelector('#check-answers-btn').addEventListener('click', () => checkAllAnswers(courseId));
        buttonContainer.querySelector('#reset-answers-btn').addEventListener('click', resetAnswers);
    }
}

// [继续在下一部分...]

// 答案解析和练习创建函数（从原来的course_view.js复制并增强）
function parseAnswers(answerString) {
    const cleanString = answerString.replace('答案：', '').replace('(', '').replace(')', '').trim();
    const parts = cleanString.split(';');

    if (parts[0]) {
        const fillMatches = parts[0].match(new RegExp('[a-z]+\\.\\s*\\w+', 'g'));
        correctAnswers.fill = fillMatches ? fillMatches.map(s => s.split('.')[1].trim()) : [];
    }
    if (parts[1]) {
        const choiceMatches = parts[1].match(new RegExp('[a-z]+\\.\\s*\\w+', 'g'));
        correctAnswers.choice = choiceMatches ? choiceMatches.map(s => s.split('.')[1].trim()) : [];
    }
    if (parts[2]) {
        correctAnswers.match = {};
        const matchMatches = parts[2].match(new RegExp('\\d-[A-Z]', 'g'));
        if (matchMatches) {
            matchMatches.forEach(m => {
                const [num, letter] = m.split('-');
                correctAnswers.match[num] = letter;
            });
        }
    }
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
            li.innerHTML = li.innerHTML.replace('______', `
                <span class="font-semibold mx-2" data-exercise="choice" data-index="${index}" data-course="${courseId}">
                    <label class="mr-4 cursor-pointer inline-flex items-center px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-blue-50 transition">
                        <input type="radio" name="choice-${courseId}-${index}" value="un" class="mr-2 w-4 h-4 text-blue-600">
                        <span>un</span>
                    </label>
                    <label class="cursor-pointer inline-flex items-center px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-blue-50 transition">
                        <input type="radio" name="choice-${courseId}-${index}" value="une" class="mr-2 w-4 h-4 text-blue-600">
                        <span>une</span>
                    </label>
                </span>
            `);
        });
        pElement.parentNode.insertBefore(list, pElement.nextSibling);
        return list;
    }
    return pElement;
}

function createMatching(pElement, courseId) {
    const table = pElement.nextElementSibling;
    if (table && table.tagName === 'TABLE') {
        table.id = "matching-exercise";
        table.className = "w-full border-collapse";
        const rows = table.querySelectorAll('tr');
        
        rows.forEach((row, rowIndex) => {
            if (rowIndex === 0) {
                row.className = "bg-gray-100 font-semibold";
            } else {
                row.className = "hover:bg-gray-50 transition";
                const cells = row.querySelectorAll('td');
                if (cells.length === 3) {
                    cells[0].dataset.matchId = cells[0].textContent.match(new RegExp('\\d+'))[0];
                    cells[0].classList.add('cursor-pointer', 'match-source', 'p-3', 'border', 'hover:bg-blue-100', 'transition');
                    cells[2].dataset.matchId = cells[2].textContent.match(new RegExp('[A-Z]+'))[0];
                    cells[2].classList.add('cursor-pointer', 'match-target', 'p-3', 'border', 'hover:bg-purple-100', 'transition');
                    cells[1].classList.add('p-3', 'border');
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
                document.querySelectorAll('.match-source').forEach(s => s.classList.remove('bg-blue-200', 'border-blue-500'));
                selectedSource = source;
                selectedSource.classList.add('bg-blue-200', 'border-blue-500');
            } else if (target && selectedSource) {
                const sourceId = selectedSource.dataset.matchId;
                const rowId = selectedSource.closest('tr').dataset.rowId;

                const existingSelection = document.querySelector(`[data-match-row="${rowId}"]`);
                if (existingSelection) {
                    existingSelection.classList.remove('bg-green-200', 'text-green-800', 'font-bold', 'border-green-500');
                    delete existingSelection.dataset.matchRow;
                }

                target.classList.add('bg-green-200', 'text-green-800', 'font-bold', 'border-green-500');
                target.dataset.matchRow = rowId;
                selectedSource.dataset.userAnswer = target.dataset.matchId;
                selectedSource.classList.remove('bg-blue-200', 'border-blue-500');
                selectedSource = null;
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

    if (answers.fill && Array.isArray(answers.fill)) {
        document.querySelectorAll('[data-exercise="fill"]').forEach((input, index) => {
            if (answers.fill[index]) {
                input.value = answers.fill[index];
            }
        });
    }

    if (answers.choice && Array.isArray(answers.choice)) {
        document.querySelectorAll('[data-exercise="choice"]').forEach((span, index) => {
            const value = answers.choice[index];
            if (value) {
                const courseId = span.dataset.course;
                const radio = document.querySelector(`input[name="choice-${courseId}-${index}"][value="${value}"]`);
                if (radio) radio.checked = true;
            }
        });
    }

    if (answers.match && typeof answers.match === 'object') {
        Object.keys(answers.match).forEach(sourceId => {
            const targetId = answers.match[sourceId];
            const source = document.querySelector(`.match-source[data-match-id="${sourceId}"]`);
            const target = document.querySelector(`.match-target[data-match-id="${targetId}"]`);
            if (source && target) {
                source.dataset.userAnswer = targetId;
                target.classList.add('bg-green-200', 'text-green-800', 'font-bold', 'border-green-500');
                const rowId = source.closest('tr').dataset.rowId;
                target.dataset.matchRow = rowId;
            }
        });
    }
}

// 检查答案（增强版，带游戏化）
function checkAllAnswers(courseId) {
    const userAnswers = collectUserAnswers();
    saveExerciseAnswers(courseId, userAnswers);

    let totalQuestions = 0;
    let correctCount = 0;

    // 检查填空题
    document.querySelectorAll('[data-exercise="fill"]').forEach((input, index) => {
        totalQuestions++;
        const userAnswer = input.value.trim().toLowerCase();
        const correctAnswer = (correctAnswers.fill && correctAnswers.fill[index]) ? correctAnswers.fill[index].toLowerCase() : '';
        const isCorrect = userAnswer === correctAnswer;

        input.classList.remove('border-gray-300', 'border-green-500', 'border-red-500', 'bg-green-50', 'bg-red-50');

        if (isCorrect) {
            correctCount++;
            input.classList.add('border-green-500', 'bg-green-50');
            addAnswerFeedback(input, true);
            addPoints(POINT_RULES.CORRECT_ANSWER, '答对题目');
        } else {
            input.classList.add('border-red-500', 'bg-red-50');
            addAnswerFeedback(input, false, correctAnswer);
            addPoints(POINT_RULES.WRONG_ANSWER, '答错题目');
            
            // 记录错题
            recordMistake(`${courseId}_fill_${index}`, {
                type: 'fill',
                question: input.closest('li').textContent,
                correctAnswer,
                userAnswer,
                courseId
            });
        }
    });

    // 检查选择题
    document.querySelectorAll('[data-exercise="choice"]').forEach((span, index) => {
        totalQuestions++;
        const courseId = span.dataset.course;
        const selectedRadio = document.querySelector(`input[name="choice-${courseId}-${index}"]:checked`);
        const isCorrect = selectedRadio && correctAnswers.choice && selectedRadio.value === correctAnswers.choice[index];

        const resultSpan = span.nextElementSibling && span.nextElementSibling.classList.contains('answer-feedback')
            ? span.nextElementSibling
            : document.createElement('span');

        if (!span.nextElementSibling || !span.nextElementSibling.classList.contains('answer-feedback')) {
            resultSpan.className = 'answer-feedback ml-3 font-bold text-lg';
            span.parentNode.insertBefore(resultSpan, span.nextSibling);
        }

        if (isCorrect) {
            correctCount++;
            resultSpan.textContent = '✓';
            resultSpan.className = 'answer-feedback ml-3 text-green-600 text-2xl font-bold';
            addPoints(POINT_RULES.CORRECT_ANSWER, '答对题目');
        } else {
            resultSpan.textContent = '✗';
            resultSpan.className = 'answer-feedback ml-3 text-red-600 text-2xl font-bold';
            addPoints(POINT_RULES.WRONG_ANSWER, '答错题目');
            
            if (selectedRadio) {
                recordMistake(`${courseId}_choice_${index}`, {
                    type: 'choice',
                    question: span.closest('li').textContent,
                    correctAnswer: correctAnswers.choice[index],
                    userAnswer: selectedRadio.value,
                    courseId
                });
            }
        }
    });

    // 检查匹配题
    document.querySelectorAll('.match-source').forEach(source => {
        totalQuestions++;
        const sourceId = source.dataset.matchId;
        const userAnswer = source.dataset.userAnswer;
        const correctAnswer = correctAnswers.match && correctAnswers.match[sourceId];
        const isCorrect = userAnswer === correctAnswer;

        let resultCell = source.nextElementSibling;
        if (!resultCell || !resultCell.classList.contains('match-result')) {
            resultCell = document.createElement('td');
            resultCell.className = 'match-result p-3 border text-center';
            source.parentElement.insertBefore(resultCell, source.nextElementSibling);
        }

        if (isCorrect) {
            correctCount++;
            resultCell.innerHTML = '<span class="text-green-600 text-2xl font-bold">✓</span>';
            addPoints(POINT_RULES.CORRECT_ANSWER, '答对题目');
        } else {
            resultCell.innerHTML = '<span class="text-red-600 text-2xl font-bold">✗</span>';
            addPoints(POINT_RULES.WRONG_ANSWER, '答错题目');
            
            if (userAnswer) {
                const courseId = source.closest('tr').dataset.course;
                recordMistake(`${courseId}_match_${sourceId}`, {
                    type: 'match',
                    question: `匹配题 ${sourceId}`,
                    correctAnswer,
                    userAnswer,
                    courseId
                });
            }
        }
    });

    // 计算分数
    const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    // 更新课程进度
    updateCourseProgress(courseId, {
        score,
        attempts: (getCourseProgress(courseId).attempts || 0) + 1,
        lastScore: score
    });

    // 检查是否完美答题
    if (score === 100) {
        addPoints(POINT_RULES.PERFECT_EXERCISE, '完美答题');
        awardBadge('perfect_score');
        showCelebration('🎉 完美答题！');
    }

    // 检查是否完成课程
    if (score >= 60) {
        completeCourse(courseId, score);
        addPoints(POINT_RULES.COMPLETE_LESSON, '完成课程');
        showCourseCompleteModal(courseId, score, correctCount, totalQuestions);
    } else {
        showScoreModal(score, correctCount, totalQuestions);
    }

    // 更新UI
    updateTopBar();
    updateSidebar();

    // 更新按钮状态
    const checkButton = document.getElementById('check-answers-btn');
    if (checkButton) {
        checkButton.innerHTML = `
            <i data-lucide="check-circle" class="w-5 h-5"></i>
            <span>已检查 (${score}%)</span>
        `;
        checkButton.className = score >= 60
            ? 'px-6 py-3 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 transition-all hover:shadow-lg flex items-center gap-2'
            : 'px-6 py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-all hover:shadow-lg flex items-center gap-2';
        lucide.createIcons();
    }
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
            feedback.innerHTML += ` <span class="text-gray-600">正确答案：<span class="font-semibold text-blue-600">${correctAnswer}</span></span>`;
        }
    }

    element.parentNode.insertBefore(feedback, element.nextSibling);
}

// 重置答案
function resetAnswers() {
    document.querySelectorAll('[data-exercise="fill"]').forEach(input => {
        input.value = '';
        input.classList.remove('border-green-500', 'border-red-500', 'bg-green-50', 'bg-red-50');
        input.classList.add('border-gray-300');
        const feedback = input.nextElementSibling;
        if (feedback && feedback.classList.contains('answer-feedback')) {
            feedback.remove();
        }
    });

    document.querySelectorAll('[data-exercise="choice"]').forEach(span => {
        const courseId = span.dataset.course;
        const index = span.dataset.index;
        document.querySelectorAll(`input[name="choice-${courseId}-${index}"]`).forEach(radio => {
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
        delete target.dataset.matchRow;
    });

    document.querySelectorAll('.match-result').forEach(result => result.remove());

    const checkButton = document.getElementById('check-answers-btn');
    if (checkButton) {
        checkButton.innerHTML = `
            <i data-lucide="check-circle" class="w-5 h-5"></i>
            <span>检查答案</span>
        `;
        checkButton.className = 'px-6 py-3 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 transition-all hover:shadow-lg flex items-center gap-2';
        lucide.createIcons();
    }
}

// [继续下一部分...]
