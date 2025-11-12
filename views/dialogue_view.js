import { speak } from '../services/speech_service.js';
import { recognition } from '../services/speech_service.js';

let isRecognizing = false;

function renderChatMessage(message, sender) {
    const chatLog = document.getElementById('chat-log');
    const messageEl = document.createElement('div');
    const isUser = sender === 'user';
    
    messageEl.className = `flex items-end gap-3 my-4 ${isUser ? 'justify-end' : 'justify-start'}`;
    
    const avatar = isUser 
        ? `<div class="w-10 h-10 rounded-full flex-shrink-0 bg-blue-500 flex items-center justify-center font-bold text-white order-2">VOUS</div>`
        : `<img src="https://r2.flowith.net/files/png/Y6F4R-ai_french_teacher_avatar_index_1@1024x1024.png" class="w-10 h-10 rounded-full flex-shrink-0 order-1" alt="Aurélie">`;
    
    const messageBubble = `<div class="max-w-xs md:max-w-md p-3 rounded-2xl ${isUser ? 'bg-blue-500 text-white order-1' : 'bg-white text-gray-800 order-2'}">${message}</div>`;

    messageEl.innerHTML = avatar + messageBubble;
    chatLog.appendChild(messageEl);
    chatLog.scrollTop = chatLog.scrollHeight;
}

function handleUserInput() {
    const chatInput = document.getElementById('chat-input');
    const message = chatInput.value.trim();
    if (message) {
        renderChatMessage(message, 'user');
        chatInput.value = '';
        setTimeout(getAIResponse, 500, message);
    }
}

function getAIResponse(userInput) {
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

    renderChatMessage(response, 'ai');
    speak(response, 'fr-FR');
}

function toggleVoiceRecognition() {
    const micButton = document.getElementById('mic-btn');
    const micIcon = micButton.querySelector('i');

    if (isRecognizing) {
        recognition.stop();
        return;
    }

    recognition.lang = 'fr-FR';
    recognition.start();

    recognition.onstart = () => {
        isRecognizing = true;
        micButton.classList.add('pulse-mic');
        micIcon.dataset.lucide = "mic-off";
        lucide.createIcons();
    };

    recognition.onend = () => {
        isRecognizing = false;
        micButton.classList.remove('pulse-mic');
        micIcon.dataset.lucide = "mic";
        lucide.createIcons();
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        document.getElementById('chat-input').value = transcript;
        handleUserInput();
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        isRecognizing = false;
        micButton.classList.remove('pulse-mic');
        micIcon.dataset.lucide = "mic";
        lucide.createIcons();
    };
}


export function renderDialogueMode(container) {
    container.innerHTML = `
        <div class="h-full flex flex-col max-w-3xl mx-auto">
            <div id="chat-log" class="flex-grow bg-white/50 p-4 rounded-t-2xl overflow-y-auto h-[calc(100vh-250px)]">
                <!-- Chat messages will appear here -->
            </div>
            <div class="bg-white p-4 rounded-b-2xl shadow-lg border-t border-gray-200">
                <div class="flex items-center gap-4">
                    <input type="text" id="chat-input" class="flex-grow w-full border-gray-300 rounded-full py-3 px-5 focus:ring-blue-500 focus:border-blue-500 transition" placeholder="Écrivez votre message...">
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
    
    document.getElementById('send-btn').addEventListener('click', handleUserInput);
    document.getElementById('chat-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleUserInput();
        }
    });
    document.getElementById('mic-btn').addEventListener('click', toggleVoiceRecognition);

    setTimeout(() => {
        const welcomeMessage = "Bonjour ! Bienvenue dans le mode dialogue. Posez-moi une question en français pour commencer.";
        renderChatMessage(welcomeMessage, 'ai');
        speak(welcomeMessage, 'fr-FR');
    }, 200);
}
