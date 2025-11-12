import { speak, getAvailableFrenchVoices } from '../services/speech_service.js';
import { recognition } from '../services/speech_service.js';
import { generateAIResponse, checkAPIAvailability, AI_PROVIDERS, setAIProvider } from '../services/ai_service.js';
import { testQwenAPI, getQwenModelInfo } from '../services/qwen_service.js';

let isRecognizing = false;
let isSpeaking = false;
let speechRate = 0.85; // 默认语速
let selectedVoiceURI = null; // 用户选择的语音
let useAI = true; // 是否使用 AI（可切换到规则模式）
let aiConversationHistory = []; // AI 对话历史

function renderChatMessage(message, sender, useTypingEffect = false) {
    const chatLog = document.getElementById('chat-log');
    const messageEl = document.createElement('div');
    const isUser = sender === 'user';

    messageEl.className = `flex items-end gap-3 my-4 ${isUser ? 'justify-end' : 'justify-start'}`;

    const avatar = isUser
        ? `<div class="w-10 h-10 rounded-full flex-shrink-0 bg-blue-500 flex items-center justify-center font-bold text-white order-2">VOUS</div>`
        : `<img src="https://r2.flowith.net/files/png/Y6F4R-ai_french_teacher_avatar_index_1@1024x1024.png" class="w-10 h-10 rounded-full flex-shrink-0 order-1" alt="Aurélie">`;

    const messageBubbleClass = `max-w-xs md:max-w-md p-3 rounded-2xl ${isUser ? 'bg-blue-500 text-white order-1' : 'bg-white text-gray-800 order-2'}`;
    const messageBubble = `<div class="${messageBubbleClass}"><span class="message-text"></span></div>`;

    messageEl.innerHTML = avatar + messageBubble;
    chatLog.appendChild(messageEl);

    const messageTextEl = messageEl.querySelector('.message-text');

    // 打字动画效果（仅用于AI回复）
    if (useTypingEffect && !isUser) {
        let index = 0;
        const typingSpeed = 30; // 毫秒

        function typeCharacter() {
            if (index < message.length) {
                messageTextEl.textContent += message.charAt(index);
                index++;
                chatLog.scrollTop = chatLog.scrollHeight;
                setTimeout(typeCharacter, typingSpeed);
            }
        }
        typeCharacter();
    } else {
        messageTextEl.textContent = message;
    }

    chatLog.scrollTop = chatLog.scrollHeight;
    return messageEl;
}

function handleUserInput() {
    const chatInput = document.getElementById('chat-input');
    const message = chatInput.value.trim();
    if (message) {
        renderChatMessage(message, 'user');
        chatInput.value = '';

        // 保存用户消息到 AI 历史
        aiConversationHistory.push({ role: 'user', content: message });

        // 根据模式选择响应方式
        if (useAI) {
            // 使用 AI 模式（异步）
            getAIResponseAsync(message);
        } else {
            // 使用规则模式（同步）
            setTimeout(getRuleBasedResponse, 500, message);
        }
    }
}

// 重命名原有的规则函数
function getRuleBasedResponse(userInput) {
    const input = userInput.toLowerCase().trim();
    let response = '';

    // 问候语检测
    if (input.match(/\b(bonjour|salut|bonsoir|coucou|hello|hi)\b/)) {
        const greetings = [
            "Bonjour ! Comment allez-vous aujourd'hui ?",
            "Salut ! Je suis ravie de vous parler. Comment puis-je vous aider ?",
            "Bonjour ! Prêt à pratiquer votre français ?",
            "Salut ! Quelle belle journée pour apprendre le français !"
        ];
        response = greetings[Math.floor(Math.random() * greetings.length)];
    }
    // 提问检测（包含疑问词）
    else if (input.match(/\b(comment|pourquoi|quand|où|qui|que|quel|quelle|est-ce que)\b/) || input.includes('?')) {
        const questionResponses = [
            `Excellente question sur "${userInput}". En français, on dit que...`,
            `C'est une question intéressante ! Pour répondre, je dirais que...`,
            `Ah, vous voulez savoir cela ? Laissez-moi vous expliquer...`,
            `Bonne question ! La réponse dépend du contexte, mais généralement...`,
            `Je comprends votre curiosité. En français, on utilise cette expression quand...`
        ];
        response = questionResponses[Math.floor(Math.random() * questionResponses.length)];
    }
    // 感谢检测
    else if (input.match(/\b(merci|thanks|thank you|gracias)\b/)) {
        const thankResponses = [
            "De rien ! C'est un plaisir de vous aider.",
            "Je vous en prie ! Continuez à pratiquer.",
            "Avec plaisir ! N'hésitez pas si vous avez d'autres questions.",
            "C'est avec plaisir ! Votre français s'améliore !"
        ];
        response = thankResponses[Math.floor(Math.random() * thankResponses.length)];
    }
    // 告别检测
    else if (input.match(/\b(au revoir|bye|goodbye|à bientôt|à plus)\b/)) {
        const farewells = [
            "Au revoir ! À très bientôt !",
            "Bonne journée ! Continuez à pratiquer !",
            "À bientôt ! Bon courage avec votre français !",
            "Au revoir ! Je serai là quand vous aurez besoin d'aide !"
        ];
        response = farewells[Math.floor(Math.random() * farewells.length)];
    }
    // 学习相关检测
    else if (input.match(/\b(apprendre|étudier|pratiquer|exercice|leçon|cours)\b/)) {
        const learningResponses = [
            "Super ! L'apprentissage du français demande de la pratique régulière. Que voulez-vous étudier ?",
            "Excellent esprit ! Je peux vous aider avec la grammaire, le vocabulaire ou la prononciation.",
            "Très bien ! La clé est de pratiquer tous les jours. Par quoi voulez-vous commencer ?",
            "Bravo pour votre motivation ! Explorez nos cours ou continuez à dialoguer avec moi."
        ];
        response = learningResponses[Math.floor(Math.random() * learningResponses.length)];
    }
    // 情感表达检测（积极）
    else if (input.match(/\b(super|génial|excellent|parfait|bravo|bien|bon)\b/)) {
        const positiveResponses = [
            "Je suis contente que vous soyez enthousiaste ! Continuez comme ça !",
            "Votre attitude positive est la clé du succès ! Qu'allons-nous faire maintenant ?",
            "Magnifique ! Cette énergie vous aidera beaucoup dans votre apprentissage.",
            "Oui, c'est l'esprit ! Gardez cette motivation !"
        ];
        response = positiveResponses[Math.floor(Math.random() * positiveResponses.length)];
    }
    // 困难/问题检测
    else if (input.match(/\b(difficile|compliqué|problème|aide|comprends pas|help)\b/)) {
        const helpResponses = [
            "Ne vous inquiétez pas, c'est normal ! Dites-moi ce qui vous pose problème.",
            "Je comprends que cela puisse être difficile. Prenons le temps d'expliquer étape par étape.",
            "Pas de panique ! Ensemble, nous allons trouver une solution. Qu'est-ce qui vous bloque ?",
            "C'est tout à fait normal de rencontrer des difficultés. Comment puis-je vous aider ?"
        ];
        response = helpResponses[Math.floor(Math.random() * helpResponses.length)];
    }
    // 数字和计数
    else if (input.match(/\b(un|deux|trois|quatre|cinq|six|sept|huit|neuf|dix|nombre|chiffre)\b/)) {
        const numberResponses = [
            "Les nombres en français ! Voulez-vous que je vous aide à compter ?",
            "Ah, les chiffres ! C'est une partie importante du vocabulaire. Continuons !",
            "Les nombres sont essentiels. Pratiquons-les ensemble !",
            "Bien ! Maîtriser les nombres est très utile au quotidien."
        ];
        response = numberResponses[Math.floor(Math.random() * numberResponses.length)];
    }
    // 天气和日常生活
    else if (input.match(/\b(temps|météo|pluie|soleil|chaud|froid|weather)\b/)) {
        const weatherResponses = [
            "Parler du temps, c'est très français ! On dit souvent 'Il fait beau' ou 'Il pleut'.",
            "Le vocabulaire de la météo est essentiel ! Comment est le temps chez vous ?",
            "Ah, la météo ! Un sujet classique de conversation en français.",
            "Très bien ! Pratiquer le vocabulaire quotidien comme la météo est important."
        ];
        response = weatherResponses[Math.floor(Math.random() * weatherResponses.length)];
    }
    // 食物和饮食
    else if (input.match(/\b(manger|nourriture|restaurant|café|pain|fromage|vin|food)\b/)) {
        const foodResponses = [
            "La cuisine française ! Un excellent sujet. Que voulez-vous savoir ?",
            "Ah, la gastronomie ! C'est une partie importante de la culture française.",
            "Parler de nourriture en français, c'est toujours un plaisir ! Continuez.",
            "Le vocabulaire culinaire est riche en français. Qu'aimez-vous manger ?"
        ];
        response = foodResponses[Math.floor(Math.random() * foodResponses.length)];
    }
    // 默认响应（更智能）
    else {
        // 检测输入长度，给出不同回应
        if (input.length < 10) {
            const shortResponses = [
                `"${userInput}" - intéressant ! Pouvez-vous développer votre pensée ?`,
                `D'accord. Voulez-vous en dire plus sur "${userInput}" ?`,
                `Je vois. Continuez, je vous écoute.`,
                `Mmm, "${userInput}". Expliquez-moi davantage, s'il vous plaît.`
            ];
            response = shortResponses[Math.floor(Math.random() * shortResponses.length)];
        } else {
            const defaultResponses = [
                `Vous avez dit : "${userInput}". C'est très intéressant ! Que voulez-vous savoir de plus ?`,
                `Je comprends votre point de vue. En français, on peut aussi dire...`,
                `Merci de partager cela. Pour bien vous répondre, pouvez-vous préciser ?`,
                `C'est une observation pertinente. Discutons-en plus en détail.`,
                `Intéressant ! Votre français est bon. Continuez à pratiquer comme ça !`
            ];
            response = defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
        }
    }

    // 保存 AI 回复到历史
    aiConversationHistory.push({ role: 'assistant', content: response });

    // 使用打字效果渲染AI回复
    renderChatMessage(response, 'ai', true);

    // 延迟播放语音，等待打字效果开始
    const typingDuration = response.length * 30; // 计算打字所需时间
    setTimeout(() => {
        speakWithIndicator(response);
    }, Math.min(typingDuration * 0.3, 500)); // 在打字进行30%时开始播放，最多延迟500ms
}

// 使用 AI 生成回复（新增）
async function getAIResponseAsync(userInput) {
    try {
        // 显示加载指示器
        showTypingIndicator();

        // 调用 AI 服务
        const response = await generateAIResponse(aiConversationHistory, userInput);

        // 移除加载指示器
        removeTypingIndicator();

        // 保存 AI 回复到历史
        aiConversationHistory.push({ role: 'assistant', content: response });

        // 渲染 AI 回复
        renderChatMessage(response, 'ai', true);

        // 延迟播放语音
        const typingDuration = response.length * 30;
        setTimeout(() => {
            speakWithIndicator(response);
        }, Math.min(typingDuration * 0.3, 500));

    } catch (error) {
        console.error('AI Response Error:', error);
        removeTypingIndicator();

        // 出错时回退到规则模式
        getRuleBasedResponse(userInput);
    }
}

// 显示 AI 思考中的指示器
function showTypingIndicator() {
    const chatLog = document.getElementById('chat-log');
    const existing = document.getElementById('ai-typing-indicator');
    if (existing) return;

    const indicator = document.createElement('div');
    indicator.id = 'ai-typing-indicator';
    indicator.className = 'flex items-end gap-3 my-4 justify-start';
    indicator.innerHTML = `
        <img src="https://r2.flowith.net/files/png/Y6F4R-ai_french_teacher_avatar_index_1@1024x1024.png" class="w-10 h-10 rounded-full flex-shrink-0" alt="Aurélie">
        <div class="bg-white text-gray-800 p-3 rounded-2xl shadow-sm">
            <div class="flex gap-1 items-center">
                <div class="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style="animation-delay: 0ms"></div>
                <div class="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style="animation-delay: 150ms"></div>
                <div class="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style="animation-delay: 300ms"></div>
                <span class="ml-2 text-xs text-gray-500">Aurélie réfléchit...</span>
            </div>
        </div>
    `;
    chatLog.appendChild(indicator);
    chatLog.scrollTop = chatLog.scrollHeight;
}

// 移除 AI 思考指示器
function removeTypingIndicator() {
    const indicator = document.getElementById('ai-typing-indicator');
    if (indicator) {
        indicator.remove();
    }
}

// 带视觉指示器的语音播放函数
function speakWithIndicator(text) {
    const indicator = document.getElementById('speech-indicator');

    speak(text, {
        lang: 'fr-FR',
        rate: speechRate,
        voiceURI: selectedVoiceURI,
        onstart: () => {
            isSpeaking = true;
            if (indicator) {
                indicator.classList.remove('hidden');
                indicator.classList.add('flex');
            }
        },
        onend: () => {
            isSpeaking = false;
            if (indicator) {
                indicator.classList.add('hidden');
                indicator.classList.remove('flex');
            }
        }
    });
}

function toggleVoiceRecognition() {
    const micButton = document.getElementById('mic-btn');
    const micIcon = micButton.querySelector('i');

    if (isRecognizing) {
        recognition.stop();
        return;
    }

    if (!recognition) {
        showNotification("La reconnaissance vocale n'est pas supportée par votre navigateur.", 'error');
        return;
    }

    recognition.lang = 'fr-FR';

    try {
        recognition.start();
    } catch (error) {
        console.error('Error starting recognition:', error);
        showNotification("Erreur lors du démarrage de la reconnaissance vocale.", 'error');
        return;
    }

    recognition.onstart = () => {
        isRecognizing = true;
        micButton.classList.add('pulse-mic');
        micIcon.dataset.lucide = "mic-off";
        lucide.createIcons();
        showNotification("Écoute en cours... Parlez en français !", 'info');
    };

    recognition.onend = () => {
        isRecognizing = false;
        micButton.classList.remove('pulse-mic');
        micIcon.dataset.lucide = "mic";
        lucide.createIcons();
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        const confidence = event.results[0][0].confidence;

        document.getElementById('chat-input').value = transcript;

        // 显示置信度提示
        if (confidence < 0.5) {
            showNotification(`Reconnu (faible confiance): "${transcript}"`, 'warning');
        } else {
            showNotification(`Reconnu: "${transcript}"`, 'success');
        }

        handleUserInput();
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        isRecognizing = false;
        micButton.classList.remove('pulse-mic');
        micIcon.dataset.lucide = "mic";
        lucide.createIcons();

        // 提供友好的错误消息
        let errorMessage = "Erreur de reconnaissance vocale.";
        switch (event.error) {
            case 'no-speech':
                errorMessage = "Aucune parole détectée. Réessayez !";
                break;
            case 'audio-capture':
                errorMessage = "Microphone non accessible. Vérifiez les permissions.";
                break;
            case 'not-allowed':
                errorMessage = "Permission microphone refusée. Autorisez l'accès au microphone.";
                break;
            case 'network':
                errorMessage = "Erreur réseau. Vérifiez votre connexion.";
                break;
            case 'aborted':
                errorMessage = "Reconnaissance annulée.";
                break;
        }
        showNotification(errorMessage, 'error');
    };
}

// 通知提示函数
function showNotification(message, type = 'info') {
    // 检查是否已存在通知，避免重复
    let notification = document.getElementById('voice-notification');

    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'voice-notification';
        notification.className = 'fixed top-20 right-4 px-4 py-3 rounded-lg shadow-lg z-50 transition-all duration-300 max-w-sm';
        document.body.appendChild(notification);
    }

    // 根据类型设置样式
    const styles = {
        'info': 'bg-blue-500 text-white',
        'success': 'bg-green-500 text-white',
        'warning': 'bg-yellow-500 text-gray-900',
        'error': 'bg-red-500 text-white'
    };

    notification.className = `fixed top-20 right-4 px-4 py-3 rounded-lg shadow-lg z-50 transition-all duration-300 max-w-sm ${styles[type] || styles.info}`;
    notification.textContent = message;
    notification.style.display = 'block';
    notification.style.opacity = '1';

    // 3秒后自动隐藏
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            notification.style.display = 'none';
        }, 300);
    }, 3000);
}


// 显示 API 配置弹窗
function showAPIConfigModal() {
    const modal = document.createElement('div');
    modal.id = 'api-config-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <i data-lucide="key" class="w-5 h-5"></i>
                    AI API 配置
                </h3>
                <button id="close-modal" class="text-gray-400 hover:text-gray-600">
                    <i data-lucide="x" class="w-6 h-6"></i>
                </button>
            </div>
            
            <div class="space-y-4 text-sm">
                <div class="border border-blue-200 rounded-lg p-4 bg-blue-50 space-y-2">
                    <div class="flex items-center gap-2">
                        <span class="font-semibold text-blue-700">通义千问 Qwen (推荐)</span>
                        <span class="text-xs bg-blue-500 text-white px-2 py-0.5 rounded">最佳效果</span>
                    </div>
                    <ol class="list-decimal list-inside text-blue-900 space-y-1 text-xs">
                        <li>在项目根目录执行 <code>cd proxy</code></li>
                        <li>复制配置文件：<code>cp env.example .env</code></li>
                        <li>编辑 <code>.env</code>，填入你的 <code>QWEN_API_KEY</code></li>
                        <li>安装依赖并启动代理：<code>npm install && npm start</code></li>
                        <li>确保代理运行在 <code>http://localhost:3001</code></li>
                    </ol>
                    <a class="text-xs text-blue-600 hover:underline" href="/QWEN_SETUP_GUIDE.md" target="_blank">
                        查看完整配置指南 →
                    </a>
                </div>

                <div class="border border-gray-200 rounded-lg p-4 bg-gray-50 text-xs text-gray-600 space-y-2">
                    <div class="flex items-center gap-2">
                        <span class="font-semibold text-gray-800">备用选项</span>
                        <span class="text-xs bg-gray-500 text-white px-2 py-0.5 rounded">HuggingFace</span>
                    </div>
                <p>未配置代理时系统会自动使用 HuggingFace 免费模型，响应较慢，质量一般。推荐尽快配置通义千问。</p>
                </div>

                <div class="flex items-center gap-2">
                    <button id="test-qwen-api" class="flex-1 px-3 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors">
                        测试代理连接
                    </button>
                    <a href="http://localhost:3001/health" target="_blank" class="px-3 py-2 text-sm text-blue-600 hover:underline">
                        查看代理状态
                    </a>
                </div>

                <div id="config-status" class="hidden p-3 rounded-lg text-sm"></div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    lucide.createIcons();

    // 关闭弹窗
    const closeModal = () => {
        modal.remove();
    };

    modal.querySelector('#close-modal').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // 测试 API
    modal.querySelector('#test-qwen-api').addEventListener('click', async () => {
        const statusEl = modal.querySelector('#config-status');
        statusEl.className = 'p-3 rounded-lg text-sm bg-blue-50 text-blue-700';
        statusEl.textContent = '正在测试代理连接...';
        statusEl.classList.remove('hidden');

        const result = await testQwenAPI();

        if (result.success) {
            statusEl.className = 'p-3 rounded-lg text-sm bg-green-50 text-green-700';
            statusEl.textContent = result.message || '✓ 代理服务正常，Qwen API 可用。';
            setAIProvider(AI_PROVIDERS.QWEN);
        } else {
            statusEl.className = 'p-3 rounded-lg text-sm bg-red-50 text-red-700';
            statusEl.textContent = `✗ 测试失败：${result.error}`;
        }
    });
}

export function renderDialogueMode(container) {
    container.innerHTML = `
        <div class="h-full flex flex-col max-w-3xl mx-auto">
            <!-- 语音播放指示器 -->
            <div id="speech-indicator" class="hidden items-center justify-center gap-2 bg-purple-500 text-white px-4 py-2 rounded-lg mb-2 shadow-lg">
                <i data-lucide="volume-2" class="w-5 h-5 animate-pulse"></i>
                <span class="text-sm font-medium">Aurélie 正在说话...</span>
            </div>

            <!-- 语音控制面板 -->
            <div class="bg-white/80 p-3 rounded-xl mb-2 shadow-sm space-y-3">
                <!-- AI 配置区 -->
                <div class="flex items-center justify-between gap-4 pb-3 border-b border-gray-200">
                    <div class="flex items-center gap-2">
                        <i data-lucide="brain" class="w-4 h-4 text-gray-700"></i>
                        <span class="text-sm font-medium text-gray-700">AI 智能模式:</span>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" id="ai-mode-toggle" class="sr-only peer" checked>
                            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            <span class="ml-3 text-xs text-gray-500" id="ai-mode-label">已启用</span>
                        </label>
                    </div>
                    <button id="config-ai-btn" class="px-3 py-1 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1">
                        <i data-lucide="settings" class="w-3 h-3"></i>
                        配置 API
                    </button>
                </div>
                
                <!-- 语音选择 -->
                <div class="flex items-center justify-between gap-4">
                    <label class="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <i data-lucide="audio-lines" class="w-4 h-4"></i>
                        选择语音:
                    </label>
                    <select id="voice-selector" class="flex-grow max-w-xs text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option value="">自动选择（推荐）</option>
                    </select>
                </div>
                
                <!-- 语速控制 -->
                <div class="flex items-center justify-between gap-4">
                    <label class="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <i data-lucide="gauge" class="w-4 h-4"></i>
                        语速调节:
                    </label>
                    <div class="flex items-center gap-3 flex-grow max-w-xs">
                        <span class="text-xs text-gray-500">慢</span>
                        <input type="range" id="speech-rate-slider" min="0.5" max="1.2" step="0.05" value="0.85"
                               class="flex-grow h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500">
                        <span class="text-xs text-gray-500">快</span>
                        <span id="rate-display" class="text-sm font-semibold text-blue-600 min-w-[3rem] text-center">0.85x</span>
                    </div>
                </div>
            </div>

            <div id="chat-log" class="flex-grow bg-white/50 p-4 rounded-t-2xl overflow-y-auto h-[calc(100vh-330px)]">
                <!-- Chat messages will appear here -->
            </div>
            <div class="bg-white p-4 rounded-b-2xl shadow-lg border-t border-gray-200">
                <div class="flex items-center gap-4">
                    <input type="text" id="chat-input" class="flex-grow w-full border-gray-300 rounded-full py-3 px-5 focus:ring-blue-500 focus:border-blue-500 transition" placeholder="输入你的消息...">
                    <button id="send-btn" class="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition">
                        <i data-lucide="send" class="w-6 h-6"></i>
                    </button>
                    <button id="mic-btn" class="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition">
                        <i data-lucide="mic" class="w-6 h-6"></i>
                    </button>
                </div>
            </div>
        </div>
    `;

    lucide.createIcons();

    // 初始化语音选择器
    const voiceSelector = document.getElementById('voice-selector');

    function populateVoiceSelector() {
        try {
            const frenchVoices = getAvailableFrenchVoices();

            // 清空现有选项（保留第一个"自动选择"）
            while (voiceSelector.options.length > 1) {
                voiceSelector.remove(1);
            }

            if (frenchVoices.length === 0) {
                console.warn('No French voices available yet');
                return;
            }

            frenchVoices.forEach(voice => {
                const option = document.createElement('option');
                option.value = voice.voiceURI || '';
                const badge = voice.localService ? '本地' : '云端';
                const quality = voice.name.includes('Google') ? '⭐优质' :
                    voice.name.includes('Microsoft') ? '⭐推荐' : '';
                option.textContent = `${voice.name} (${voice.lang}) [${badge}] ${quality}`;
                voiceSelector.appendChild(option);
            });

            console.log(`Loaded ${frenchVoices.length} French voices`);
        } catch (error) {
            console.error('Error populating voice selector:', error);
        }
    }

    // 延迟加载语音列表，并在语音变化时重新加载
    setTimeout(populateVoiceSelector, 500);
    if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = populateVoiceSelector;
    }

    voiceSelector.addEventListener('change', (e) => {
        selectedVoiceURI = e.target.value || null;
        console.log('Selected voice URI:', selectedVoiceURI);
    });

    // AI 模式切换
    const aiToggle = document.getElementById('ai-mode-toggle');
    const aiModeLabel = document.getElementById('ai-mode-label');

    aiToggle.addEventListener('change', (e) => {
        useAI = e.target.checked;
        aiModeLabel.textContent = useAI ? '已启用' : '已禁用';
        console.log(`AI Mode: ${useAI ? 'Enabled' : 'Disabled'}`);

        // 显示提示
        showNotification(
            useAI ? 'AI 智能模式已启用，将使用 HuggingFace 模型回复' : '已切换到规则模式，使用预设回复',
            'info'
        );
    });

    // 检查 API 可用性（异步，不阻塞）
    checkAPIAvailability().then(available => {
        if (!available && useAI) {
            console.warn('HuggingFace API may not be available');
            showNotification('AI 服务可能暂时不可用，将在需要时自动回退到规则模式', 'warning');
        }
    });

    // 配置 API 按钮
    document.getElementById('config-ai-btn').addEventListener('click', showAPIConfigModal);

    // 事件监听器
    document.getElementById('send-btn').addEventListener('click', handleUserInput);
    document.getElementById('chat-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleUserInput();
        }
    });
    document.getElementById('mic-btn').addEventListener('click', toggleVoiceRecognition);

    // 语速控制滑块
    const rateSlider = document.getElementById('speech-rate-slider');
    const rateDisplay = document.getElementById('rate-display');

    rateSlider.addEventListener('input', (e) => {
        speechRate = parseFloat(e.target.value);
        rateDisplay.textContent = speechRate.toFixed(2) + 'x';
    });

    // 初始化时检查代理状态
    testQwenAPI()
        .then((result) => {
            if (result.success) {
                const modelInfo = getQwenModelInfo();
                console.log('Using Qwen Proxy:', modelInfo);
                showNotification(result.message || '✓ 通义千问代理已就绪', 'success');
                setAIProvider(AI_PROVIDERS.QWEN);
            } else {
                console.warn('Qwen proxy not ready:', result.error);
                showNotification(
                    'AI 模式已启用，但未检测到通义千问代理。点击"配置 API"查看配置步骤，系统将临时使用免费的 HuggingFace API（响应较慢）。',
                    'warning'
                );
            }
        })
        .catch((error) => {
            console.error('Failed to check Qwen proxy:', error);
            showNotification(
                '无法连接通义千问代理。请确保已启动 proxy 服务，或点击"配置 API"查看指南。',
                'warning'
            );
        });

    // 欢迎消息
    setTimeout(() => {
        const welcomeMessage = "Bonjour ! Bienvenue dans le mode dialogue. Pose-moi une question en français pour commencer.";
        renderChatMessage(welcomeMessage, 'ai', true);
        setTimeout(() => speakWithIndicator(welcomeMessage), 500);
    }, 200);
}
