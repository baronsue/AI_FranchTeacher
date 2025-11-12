const synth = window.speechSynthesis;
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
export const recognition = SpeechRecognition ? new SpeechRecognition() : null;

let voices = [];

function getVoices() {
    voices = synth.getVoices();
}

getVoices();
if (synth.onvoiceschanged !== undefined) {
    synth.onvoiceschanged = getVoices;
}

export function speak(text, lang) {
    if (!synth) {
        console.error("Speech Synthesis not supported.");
        return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;

    // 优先选择高质量的法语语音
    // 1. 首选包含 "Google" 或 "Microsoft" 的高质量法语女声
    // 2. 其次选择任何法语女声
    // 3. 最后选择任何法语声音
    const frenchVoice = voices.find(voice =>
        voice.lang.startsWith('fr') &&
        (voice.name.includes('Google') || voice.name.includes('Microsoft')) &&
        (voice.name.includes('Female') || voice.name.includes('femme'))
    ) || voices.find(voice =>
        voice.lang.startsWith('fr') &&
        (voice.name.includes('Female') || voice.name.includes('femme'))
    ) || voices.find(voice => voice.lang.startsWith('fr'));

    if (frenchVoice) {
        utterance.voice = frenchVoice;
        console.log(`Using voice: ${frenchVoice.name}`);
    } else {
        console.warn(`French voice not found. Using default.`);
    }

    // 优化语音参数以提升法语发音清晰度
    utterance.pitch = 1.05;  // 略微提高音调，使发音更清晰
    utterance.rate = 0.85;   // 降低语速，便于学习者理解
    utterance.volume = 1.0;  // 设置最大音量，确保清晰可闻

    synth.cancel(); // Cancel any previous speech
    synth.speak(utterance);
}

if(recognition) {
    recognition.continuous = false;
    recognition.interimResults = false;
} else {
    console.warn("Speech Recognition not supported in this browser.");
}
