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

    const frenchVoice = voices.find(voice => voice.lang === 'fr-FR' && voice.name.includes('Female')) || voices.find(voice => voice.lang === 'fr-FR');

    if (frenchVoice) {
        utterance.voice = frenchVoice;
    } else {
        console.warn(`French voice not found. Using default.`);
    }

    utterance.pitch = 1;
    utterance.rate = 1;

    synth.cancel(); // Cancel any previous speech
    synth.speak(utterance);
}

if(recognition) {
    recognition.continuous = false;
    recognition.interimResults = false;
} else {
    console.warn("Speech Recognition not supported in this browser.");
}
