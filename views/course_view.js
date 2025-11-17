import { speak } from '../services/speech_service.js';
import { userDataService } from '../services/user_data_service.js';

let correctAnswers = {};
const EXERCISE_ID = 'lesson_1_exercises';

async function loadCourseContent(container) {
    try {
        const response = await fetch('data/course_content.md');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const markdown = await response.text();
        const htmlContent = marked.parse(markdown);

        const contentWrapper = document.createElement('div');
        contentWrapper.innerHTML = htmlContent;

        parseForInteractivity(contentWrapper);
        
        const courseContainer = document.createElement('div');
        courseContainer.className = 'bg-white p-6 sm:p-8 rounded-2xl shadow-lg prose max-w-none';
        courseContainer.appendChild(contentWrapper);

        container.innerHTML = '';
        container.appendChild(courseContainer);

        lucide.createIcons();

        // 恢复之前保存的答案
        setTimeout(async () => {
            try {
                const exerciseData = await userDataService.getExercise(EXERCISE_ID);
                if (exerciseData && exerciseData.length > 0) {
                    const savedAnswers = exerciseData[0].answers;
                    if (savedAnswers) {
                        restoreUserAnswers(savedAnswers);
                        console.log('练习答案已从云端恢复');
                    }
                }
            } catch (error) {
                console.error('恢复练习答案失败:', error);
            }
        }, 500);
    } catch (error) {
        console.error("Failed to load course content:", error);
        container.innerHTML = `<div class="text-center p-8 bg-white rounded-lg shadow">
            <h2 class="text-xl font-bold text-red-600">加载失败</h2>
            <p>无法加载课程内容，请稍后重试。</p>
        </div>`;
    }
}

function parseForInteractivity(wrapper) {

    const dialogueParagraphs = Array.from(wrapper.querySelectorAll('p')).filter(p => p.textContent.includes('Aurélie:') || p.textContent.includes('Li Wei:'));
    dialogueParagraphs.forEach(p => {
        p.className = 'flex items-start gap-4 p-3 rounded-lg even:bg-slate-50';
        const content = p.innerHTML;
        if (content.startsWith('<strong>Aurélie:</strong>')) {
            const textToSpeak = p.textContent.split('(')[0].replace('Aurélie:', '').trim();
            p.innerHTML = `
                <img src="https://r2.flowith.net/files/png/Y6F4R-ai_french_teacher_avatar_index_1@1024x1024.png" class="w-10 h-10 rounded-full flex-shrink-0" alt="Aurélie">
                <div class="flex-grow">${content}</div>
                <button class="play-audio-btn p-2 rounded-full hover:bg-blue-100 transition-colors" data-text="${textToSpeak}">
                    <i data-lucide="volume-2" class="w-5 h-5 text-blue-500"></i>
                </button>
            `;
        } else {
             p.innerHTML = `<span class="w-10 h-10 rounded-full flex-shrink-0 bg-gray-200 flex items-center justify-center font-bold text-gray-600">LW</span><div class="flex-grow">${content}</div>`;
        }
    });

    wrapper.querySelectorAll('.play-audio-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const text = btn.getAttribute('data-text');
            speak(text, 'fr-FR');
        });
    });

    // 找到所有 "Exercices Interactifs" 标题（可能有多个单元）
    const exerciseHeaders = Array.from(wrapper.querySelectorAll('h3')).filter(h3 =>
        h3.textContent.includes('Exercices Interactifs') || h3.textContent.includes('练习')
    );

    console.log('找到练习题部分:', exerciseHeaders.length);

    exerciseHeaders.forEach((exerciseHeader, headerIndex) => {
        // 查找这个练习部分的答案注释
        let currentElement = exerciseHeader;
        let answerComment = null;

        // 向后查找直到找到答案注释或下一个标题
        while (currentElement && currentElement.nextSibling) {
            currentElement = currentElement.nextSibling;
            if (currentElement.nodeType === 8 && currentElement.textContent.includes('答案')) {
                answerComment = currentElement;
                break;
            }
            if (currentElement.tagName === 'H2' || currentElement.tagName === 'H3') {
                break;
            }
        }

        if (answerComment) {
            console.log('找到答案:', answerComment.textContent.substring(0, 50));
            parseAnswers(answerComment.textContent);
            answerComment.remove();
        }

        let element = exerciseHeader.nextElementSibling;
        let processedCount = 0;
        while (element) {
            const text = element.textContent.trim();
            console.log(`检查元素: ${element.tagName}, 文本: "${text.substring(0, 30)}..."`);

            // 检查是否包含关键词（不依赖具体格式）
            if (text.includes('填空题')) {
                console.log('→ 处理填空题');
                element = createFillInTheBlanks(element);
                processedCount++;
            } else if (text.includes('选择题')) {
                console.log('→ 处理选择题');
                element = createMultipleChoice(element);
                processedCount++;
            } else if (text.includes('匹配题')) {
                console.log('→ 处理匹配题');
                element = createMatching(element);
                processedCount++;
            } else if(element.tagName === 'H3' || element.tagName === 'H2') {
                console.log('→ 遇到下一个章节，停止');
                break; // Stop at the next section
            }
            element = element.nextElementSibling;
        }
        console.log(`练习部分 ${headerIndex + 1} 处理完成，共处理 ${processedCount} 种题型`);

        // 只在第一个练习部分添加检查按钮
        if (headerIndex === 0) {
            const checkButton = document.createElement('button');
            checkButton.id = 'check-answers-btn';
            checkButton.className = 'mt-8 px-6 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors';
            checkButton.textContent = '检查答案';

            // 找到练习部分的结束位置插入按钮
            let insertAfter = exerciseHeader;
            let sibling = exerciseHeader.nextElementSibling;
            while (sibling && sibling.tagName !== 'H2' && sibling.tagName !== 'H3') {
                insertAfter = sibling;
                sibling = sibling.nextElementSibling;
            }

            if (insertAfter.parentElement) {
                insertAfter.parentElement.insertBefore(checkButton, insertAfter.nextSibling);
            }

            checkButton.addEventListener('click', checkAllAnswers);
            console.log('检查答案按钮已添加');
        }
    });
}

function parseAnswers(answerString) {
    try {
        console.log('开始解析答案:', answerString.substring(0, 100));

        // 清理答案字符串：移除括号、"答案："和可能的单元名称前缀
        let cleanString = answerString
            .replace(/答案[：:]/g, '')
            .replace(/[()（）]/g, '')
            .replace(/Unité\s+\d+[：:]/g, '')  // 移除 "Unité 2：" 这样的前缀
            .trim();

        console.log('清理后的答案:', cleanString);

        // 支持中文分号和英文分号
        const parts = cleanString.split(/[;；]/);
        console.log('分割后的部分数:', parts.length);

        // 解析填空题答案
        if (parts[0]) {
            const fillMatches = parts[0].match(/[a-z]+\.\s*[\wé]+/gi);
            if (fillMatches && fillMatches.length > 0) {
                correctAnswers.fill = fillMatches.map(s => s.split('.')[1].trim());
                console.log('✓ 填空题答案:', correctAnswers.fill);
            } else {
                console.warn('未找到填空题答案');
                correctAnswers.fill = [];
            }
        }

        // 解析选择题答案
        if (parts[1]) {
            const choiceMatches = parts[1].match(/[a-z]+\.\s*[\wé]+/gi);
            if (choiceMatches && choiceMatches.length > 0) {
                correctAnswers.choice = choiceMatches.map(s => s.split('.')[1].trim());
                console.log('✓ 选择题答案:', correctAnswers.choice);
            } else {
                console.warn('未找到选择题答案');
                correctAnswers.choice = [];
            }
        }

        // 解析匹配题答案
        if (parts[2]) {
            const matchMatches = parts[2].match(/\d-[A-Z]/g);
            if (matchMatches && matchMatches.length > 0) {
                correctAnswers.match = {};
                matchMatches.forEach(m => {
                    const [num, letter] = m.split('-');
                    correctAnswers.match[num] = letter;
                });
                console.log('✓ 匹配题答案:', correctAnswers.match);
            } else {
                console.warn('未找到匹配题答案');
                correctAnswers.match = {};
            }
        }
    } catch (error) {
        console.error('解析答案时出错:', error);
        console.error('答案字符串:', answerString);
        // 设置默认值避免后续错误
        correctAnswers.fill = correctAnswers.fill || [];
        correctAnswers.choice = correctAnswers.choice || [];
        correctAnswers.match = correctAnswers.match || {};
    }
}

function createFillInTheBlanks(element) {
    // 查找 OL 列表：可能是当前元素本身，也可能是下一个兄弟元素
    let list = null;
    if (element.tagName === 'OL') {
        list = element;
    } else {
        list = element.nextElementSibling;
    }

    if (list && list.tagName === 'OL') {
        Array.from(list.children).forEach((li, index) => {
            // 替换任意数量的下划线，宽度根据下划线数量动态调整
            li.innerHTML = li.innerHTML.replace(/_{2,}/g, (match) => {
                const width = Math.max(100, match.length * 12); // 每个下划线约12px
                return `<input type="text"
                    class="exercise-input border-2 border-blue-300 rounded px-3 py-1 focus:border-blue-500 focus:outline-none bg-white"
                    data-exercise="fill"
                    data-index="${index}"
                    style="width: ${width}px; min-width: 100px; display: inline-block;"
                    placeholder="填写答案">`;
            });
        });
        console.log(`✓ 创建了 ${list.children.length} 个填空题输入框`);
        return list;
    }
    console.warn('未找到填空题列表', element.tagName);
    return element;
}

function createMultipleChoice(element) {
    // 查找 OL 列表：可能是当前元素本身，也可能是下一个兄弟元素
    let list = null;
    if (element.tagName === 'OL') {
        list = element;
    } else {
        list = element.nextElementSibling;
    }

    if (list && list.tagName === 'OL') {
        Array.from(list.children).forEach((li, index) => {
            // 替换任意数量的下划线（2个或更多）
            li.innerHTML = li.innerHTML.replace(/_{2,}/g, `
                <span class="font-semibold mx-2" data-exercise="choice" data-index="${index}">
                    <label class="mr-3 cursor-pointer hover:bg-blue-50 p-1 rounded">
                        <input type="radio" name="choice-${index}" value="un" class="mr-1"> un
                    </label>
                    <label class="cursor-pointer hover:bg-blue-50 p-1 rounded">
                        <input type="radio" name="choice-${index}" value="une" class="mr-1"> une
                    </label>
                </span>
            `);
        });
        console.log(`✓ 创建了 ${list.children.length} 个选择题`);
        return list;
    }
    console.warn('未找到选择题列表', element.tagName);
    return element;
}

function createMatching(pElement) {
    const table = pElement.nextElementSibling;
    if (table && table.tagName === 'TABLE') {
        table.id = "matching-exercise";
        const rows = table.querySelectorAll('tr');
        rows.forEach((row, rowIndex) => {
            if (rowIndex > 0) { // Skip header
                const cells = row.querySelectorAll('td');
                if (cells.length === 3) {
                    cells[0].dataset.matchId = cells[0].textContent.match(new RegExp('\\d+'))[0];
                    cells[0].classList.add('cursor-pointer', 'match-source');
                    cells[2].dataset.matchId = cells[2].textContent.match(new RegExp('[A-Z]+'))[0];
                    cells[2].classList.add('cursor-pointer', 'match-target');
                    row.dataset.rowId = rowIndex;
                }
            }
        });
        
        let selectedSource = null;
        table.addEventListener('click', e => {
            const source = e.target.closest('.match-source');
            const target = e.target.closest('.match-target');
            
            if (source) {
                if(selectedSource) selectedSource.classList.remove('bg-blue-200');
                selectedSource = source;
                selectedSource.classList.add('bg-blue-200');
            } else if (target && selectedSource) {
                const sourceId = selectedSource.dataset.matchId;
                const rowId = selectedSource.closest('tr').dataset.rowId;
                

                const existingSelection = document.querySelector(`[data-match-row="${rowId}"]`);
                if(existingSelection) {
                    existingSelection.classList.remove('bg-green-200', 'text-green-800', 'font-bold');
                    delete existingSelection.dataset.matchRow;
                }

                target.classList.add('bg-green-200', 'text-green-800', 'font-bold');
                target.dataset.matchRow = rowId;
                
                selectedSource.dataset.userAnswer = target.dataset.matchId;
                selectedSource.classList.remove('bg-blue-200');
                selectedSource = null;
            }
        });
        pElement.parentNode.insertBefore(table, pElement.nextSibling);
        console.log(`✓ 创建了匹配题（${rows.length - 1} 行）`);
        return table;
    }
    console.warn('未找到匹配题表格');
    return pElement;
}

function collectUserAnswers() {
    const answers = {
        fill: [],
        choice: [],
        match: {}
    };
    
    document.querySelectorAll('[data-exercise="fill"]').forEach(input => {
        answers.fill.push(input.value.trim());
    });
    
    document.querySelectorAll('[data-exercise="choice"]').forEach(span => {
        const index = span.dataset.index;
        const selectedRadio = document.querySelector(`input[name="choice-${index}"]:checked`);
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
                const radio = document.querySelector(`input[name="choice-${index}"][value="${value}"]`);
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
                target.classList.add('bg-green-200', 'text-green-800', 'font-bold');
                const rowId = source.closest('tr').dataset.rowId;
                target.dataset.matchRow = rowId;
            }
        });
    }
}

async function checkAllAnswers() {
    const userAnswers = collectUserAnswers();

    // 计算分数
    let totalQuestions = 0;
    let correctCount = 0;

    // 检查填空题
    document.querySelectorAll('[data-exercise="fill"]').forEach(input => {
        totalQuestions++;
        const isCorrect = input.value.trim().toLowerCase() === correctAnswers.fill[input.dataset.index];
        if (isCorrect) correctCount++;
        input.classList.toggle('correct', isCorrect);
        input.classList.toggle('incorrect', !isCorrect);
    });

    // 检查选择题
    document.querySelectorAll('[data-exercise="choice"]').forEach(span => {
        totalQuestions++;
        const index = span.dataset.index;
        const selectedRadio = document.querySelector(`input[name="choice-${index}"]:checked`);
        const resultSpan = span.nextElementSibling || document.createElement('span');
        resultSpan.className = 'ml-2 font-bold';
        if (!span.nextElementSibling) span.parentNode.appendChild(resultSpan);

        if (selectedRadio) {
            const isCorrect = selectedRadio.value === correctAnswers.choice[index];
            if (isCorrect) correctCount++;
            resultSpan.textContent = isCorrect ? '✓' : '✗';
            resultSpan.className = isCorrect ? 'answer-correct' : 'answer-incorrect';
        } else {
            resultSpan.textContent = '?';
            resultSpan.className = 'answer-incorrect';
        }
    });

    // 检查匹配题
    document.querySelectorAll('.match-source').forEach(source => {
        totalQuestions++;
        const sourceId = source.dataset.matchId;
        const userAnswer = source.dataset.userAnswer;
        const correctAnswer = correctAnswers.match[sourceId];
        const isCorrect = userAnswer === correctAnswer;
        if (isCorrect) correctCount++;

        const resultSpan = source.nextElementSibling || document.createElement('span');
        if (!source.nextElementSibling) {
            const cell = document.createElement('td');
            cell.appendChild(resultSpan);
            source.parentElement.insertBefore(cell, source.nextElementSibling);
        }
        resultSpan.className = isCorrect ? 'answer-correct font-bold text-center' : 'answer-incorrect font-bold text-center';
        resultSpan.textContent = isCorrect ? '✓' : '✗';
    });

    // 计算分数百分比
    const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const completed = score >= 60; // 60分以上算完成

    // 保存到后端
    try {
        await userDataService.saveExercise(EXERCISE_ID, userAnswers, score, completed);
        console.log(`练习已保存到云端，得分: ${score}分`);

        // 如果完成，添加积分
        if (completed && score === 100) {
            await userDataService.addPoints(10, '完美完成课程练习', 'exercise');
        } else if (completed) {
            await userDataService.addPoints(5, '完成课程练习', 'exercise');
        }
    } catch (error) {
        console.error('保存练习失败:', error);
    }

    const checkButton = document.getElementById('check-answers-btn');
    if (checkButton) {
        checkButton.textContent = `答案已检查 ✓ (得分: ${score}分)`;
        checkButton.classList.add('bg-green-500', 'hover:bg-green-600');
        checkButton.classList.remove('bg-blue-500', 'hover:bg-blue-600');
    }
}

export function renderCourseMode(container) {
    container.innerHTML = `
        <div class="flex justify-center items-center h-64">
            <div class="text-center">
                <i data-lucide="loader" class="animate-spin text-blue-500 w-12 h-12"></i>
                <p class="mt-4 text-gray-600">正在加载课程...</p>
            </div>
        </div>
    `;
    lucide.createIcons();
    loadCourseContent(container);
}
