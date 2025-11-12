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

    const responses = [
        "C'est une excellente question. Pouvez-vous préciser ?",
        "Très intéressant. Continuez.",
        "D'accord, je comprends. Et alors ?",
        "Oui, c'est une bonne façon de voir les choses.",
        `Vous avez dit "${userInput}". Que voulez-vous dire par là ?`
    ];
    const response = responses[Math.floor(Math.random() * responses.length)];
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
