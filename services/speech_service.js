const synth = window.speechSynthesis;
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
export const recognition = SpeechRecognition ? new SpeechRecognition() : null;

let voices = [];
let voicesLoaded = false;

// 语音质量评分系统
const VOICE_QUALITY_SCORES = {
    // 最高质量：在线语音引擎
    'Google': 100,
    'Microsoft': 95,
    'Amazon': 90,

    // 高质量：系统自带的优质语音
    'Amelie': 85,
    'Thomas': 85,
    'Virginie': 83,
    'Daniel': 82,
    'Audrey': 80,

    // 中等质量：其他系统语音
    'default': 50
};

// 法语方言/地区优先级
const FRENCH_LOCALE_PRIORITY = {
    'fr-FR': 100,  // 标准法语（法国）
    'fr-CA': 80,   // 加拿大法语
    'fr-BE': 75,   // 比利时法语
    'fr-CH': 75,   // 瑞士法语
    'fr': 70       // 通用法语
};

function getVoices() {
    const availableVoices = synth.getVoices();
    if (availableVoices.length > 0) {
        voices = availableVoices;
        voicesLoaded = true;

        // 调试：打印所有法语语音
        const frenchVoices = voices.filter(v => v.lang.toLowerCase().startsWith('fr'));
        console.log('Available French voices:', frenchVoices.map(v => ({
            name: v.name,
            lang: v.lang,
            local: v.localService,
            default: v.default
        })));
    }
}

// 计算语音质量分数
function calculateVoiceScore(voice) {
    let score = 0;

    // 检查语音提供商
    for (const [provider, points] of Object.entries(VOICE_QUALITY_SCORES)) {
        if (voice.name.includes(provider)) {
            score += points;
            break;
        }
    }

    // 如果没有匹配的提供商，给默认分
    if (score === 0) {
        score = VOICE_QUALITY_SCORES.default;
    }

    // 检查地区优先级
    const voiceLang = voice.lang.toLowerCase();
    for (const [locale, points] of Object.entries(FRENCH_LOCALE_PRIORITY)) {
        if (voiceLang.startsWith(locale.toLowerCase())) {
            score += points;
            break;
        }
    }

    // 优先非本地服务（通常是云端高质量语音）
    if (!voice.localService) {
        score += 50;
    }

    // 女声加分（对教学更友好）
    const nameLower = voice.name.toLowerCase();
    if (nameLower.includes('female') ||
        nameLower.includes('femme') ||
        nameLower.includes('amelie') ||
        nameLower.includes('virginie') ||
        nameLower.includes('audrey')) {
        score += 10;
    }

    return score;
}

// 选择最佳法语语音
function selectBestFrenchVoice() {
    if (voices.length === 0) {
        return null;
    }

    // 筛选法语语音
    const frenchVoices = voices.filter(voice =>
        voice.lang.toLowerCase().startsWith('fr')
    );

    if (frenchVoices.length === 0) {
        console.warn('No French voices found');
        return null;
    }

    // 计算每个语音的分数并排序
    const scoredVoices = frenchVoices.map(voice => ({
        voice,
        score: calculateVoiceScore(voice)
    })).sort((a, b) => b.score - a.score);

    const bestVoice = scoredVoices[0].voice;
    console.log(`Selected best French voice: ${bestVoice.name} (lang: ${bestVoice.lang}, score: ${scoredVoices[0].score})`);

    return bestVoice;
}

getVoices();
if (synth.onvoiceschanged !== undefined) {
    synth.onvoiceschanged = getVoices;
}

export function speak(text, options = {}) {
    if (!synth) {
        console.error("Speech Synthesis not supported.");
        return;
    }

    // 等待语音加载
    if (!voicesLoaded) {
        getVoices();
    }

    // 兼容旧的调用方式：speak(text, lang)
    const config = typeof options === 'string' ? { lang: options } : options;
    const { lang = 'fr-FR', rate, pitch, voiceURI, onstart, onend } = config;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;

    let selectedVoice = null;

    // 优先使用用户指定的语音
    if (voiceURI) {
        selectedVoice = voices.find(v => v.voiceURI === voiceURI);
        if (selectedVoice) {
            console.log(`Using user-selected voice: ${selectedVoice.name}`);
        }
    }

    // 如果没有指定语音，使用智能选择算法
    if (!selectedVoice) {
        selectedVoice = selectBestFrenchVoice();
    }

    if (selectedVoice) {
        utterance.voice = selectedVoice;
        // 使用语音自带的语言设置
        utterance.lang = selectedVoice.lang;
    } else {
        console.warn('No suitable French voice found, using default');
    }

    // 根据语音类型调整默认参数（如果用户没有指定）
    if (selectedVoice && selectedVoice.name.includes('Google')) {
        // Google 语音通常质量很高，参数可以更自然
        utterance.pitch = pitch !== undefined ? pitch : 1.0;
        utterance.rate = rate !== undefined ? rate : 0.9;
    } else if (selectedVoice && selectedVoice.name.includes('Microsoft')) {
        // Microsoft 语音稍微调整
        utterance.pitch = pitch !== undefined ? pitch : 1.02;
        utterance.rate = rate !== undefined ? rate : 0.88;
    } else {
        // 其他语音需要更多优化
        utterance.pitch = pitch !== undefined ? pitch : 1.05;
        utterance.rate = rate !== undefined ? rate : 0.85;
    }

    utterance.volume = 1.0;

    // 设置回调
    if (onstart) utterance.onstart = onstart;
    if (onend) utterance.onend = onend;

    synth.cancel();
    synth.speak(utterance);
}

// 导出获取可用语音列表的函数
export function getAvailableFrenchVoices() {
    // 确保语音已加载
    if (voices.length === 0) {
        getVoices();
    }
    return voices.filter(voice => voice.lang && voice.lang.toLowerCase().startsWith('fr'));
}

if (recognition) {
    recognition.continuous = false;
    recognition.interimResults = false;
} else {
    console.warn("Speech Recognition not supported in this browser.");
}
