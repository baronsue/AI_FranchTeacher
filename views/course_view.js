import { speak } from '../services/speech_service.js';

let correctAnswers = {};

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
    } catch (error) {
        console.error("Failed to load course content:", error);
        container.innerHTML = `<div class="text-center p-8 bg-white rounded-lg shadow">
            <h2 class="text-xl font-bold text-red-600">Erreur de chargement</h2>
            <p>Impossible de charger le contenu du cours. Veuillez réessayer plus tard.</p>
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


    const exerciseHeader = wrapper.querySelector('h3#exercices-interactifs');
    if (exerciseHeader) {

        const answerComment = Array.from(wrapper.childNodes).find(node => node.nodeType === 8 && node.textContent.trim().startsWith('答案：'));
        if (answerComment) {
            parseAnswers(answerComment.textContent);
            answerComment.remove();
        }

        let element = exerciseHeader.nextElementSibling;
        while (element) {
            if (element.tagName === 'P' && element.textContent.startsWith('1. 填空题')) {
                element = createFillInTheBlanks(element);
            } else if (element.tagName === 'P' && element.textContent.startsWith('2. 选择题')) {
                element = createMultipleChoice(element);
            } else if (element.tagName === 'P' && element.textContent.startsWith('3. 匹配题')) {
                 element = createMatching(element);
            } else if(element.tagName === 'H3' || element.tagName === 'H2') {
                 break; // Stop at the next section
            }
            element = element.nextElementSibling;
        }

        const checkButton = document.createElement('button');
        checkButton.id = 'check-answers-btn';
        checkButton.className = 'mt-8 px-6 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors';
        checkButton.textContent = 'Vérifier les réponses';
        exerciseHeader.parentElement.appendChild(checkButton);
        checkButton.addEventListener('click', checkAllAnswers);
    }
}

function parseAnswers(answerString) {

    const cleanString = answerString.replace('答案：', '').replace('(', '').replace(')', '').trim();
    const parts = cleanString.split(';');
    

    if (parts[0]) {
        correctAnswers.fill = parts[0].match(new RegExp('[a-z]+\\.\\s*\\w+', 'g')).map(s => s.split('.')[1].trim());
    }

    if (parts[1]) {
        correctAnswers.choice = parts[1].match(new RegExp('[a-z]+\\.\\s*\\w+', 'g')).map(s => s.split('.')[1].trim());
    }

    if (parts[2]) {
        correctAnswers.match = {};
        parts[2].match(new RegExp('\\d-[A-Z]', 'g')).forEach(m => {
            const [num, letter] = m.split('-');
            correctAnswers.match[num] = letter;
        });
    }
}

function createFillInTheBlanks(pElement) {
    const list = pElement.nextElementSibling;
    if (list && list.tagName === 'OL') {
        Array.from(list.children).forEach((li, index) => {
            li.innerHTML = li.innerHTML.replace('______', `<input type="text" class="exercise-input" data-exercise="fill" data-index="${index}">`);
        });
        pElement.parentNode.insertBefore(list, pElement.nextSibling);
        return list;
    }
    return pElement;
}

function createMultipleChoice(pElement) {
    const list = pElement.nextElementSibling;
    if (list && list.tagName === 'OL') {
        Array.from(list.children).forEach((li, index) => {
            li.innerHTML = li.innerHTML.replace('______', `
                <span class="font-semibold mx-2" data-exercise="choice" data-index="${index}">
                    <label class="mr-3 cursor-pointer"><input type="radio" name="choice-${index}" value="un" class="mr-1"> un</label>
                    <label class="cursor-pointer"><input type="radio" name="choice-${index}" value="une" class="mr-1"> une</label>
                </span>
            `);
        });
        pElement.parentNode.insertBefore(list, pElement.nextSibling);
        return list;
    }
    return pElement;
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
        return table;
    }
    return pElement;
}

function checkAllAnswers() {

    document.querySelectorAll('[data-exercise="fill"]').forEach(input => {
        const isCorrect = input.value.trim().toLowerCase() === correctAnswers.fill[input.dataset.index];
        input.classList.toggle('correct', isCorrect);
        input.classList.toggle('incorrect', !isCorrect);
    });


    document.querySelectorAll('[data-exercise="choice"]').forEach(span => {
        const index = span.dataset.index;
        const selectedRadio = document.querySelector(`input[name="choice-${index}"]:checked`);
        const resultSpan = span.nextElementSibling || document.createElement('span');
        resultSpan.className = 'ml-2 font-bold';
        if (!span.nextElementSibling) span.parentNode.appendChild(resultSpan);

        if (selectedRadio) {
            const isCorrect = selectedRadio.value === correctAnswers.choice[index];
            resultSpan.textContent = isCorrect ? '✓' : '✗';
            resultSpan.className = isCorrect ? 'answer-correct' : 'answer-incorrect';
        } else {
            resultSpan.textContent = '?';
            resultSpan.className = 'answer-incorrect';
        }
    });


    document.querySelectorAll('.match-source').forEach(source => {
        const sourceId = source.dataset.matchId;
        const userAnswer = source.dataset.userAnswer;
        const correctAnswer = correctAnswers.match[sourceId];
        const isCorrect = userAnswer === correctAnswer;
        
        const resultSpan = source.nextElementSibling || document.createElement('span');
        if (!source.nextElementSibling) {
            const cell = document.createElement('td');
            cell.appendChild(resultSpan);
            source.parentElement.insertBefore(cell, source.nextElementSibling);
        }
        resultSpan.className = isCorrect ? 'answer-correct font-bold text-center' : 'answer-incorrect font-bold text-center';
        resultSpan.textContent = isCorrect ? '✓' : '✗';
    });
}

export function renderCourseMode(container) {
    container.innerHTML = `
        <div class="flex justify-center items-center h-64">
            <div class="text-center">
                <i data-lucide="loader" class="animate-spin text-blue-500 w-12 h-12"></i>
                <p class="mt-4 text-gray-600">Chargement du cours...</p>
            </div>
        </div>
    `;
    lucide.createIcons();
    loadCourseContent(container);
}
