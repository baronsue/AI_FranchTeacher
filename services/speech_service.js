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

// 中文方言/地区优先级
const CHINESE_LOCALE_PRIORITY = {
    'zh-CN': 100,  // 简体中文（中国大陆）
    'zh-TW': 90,   // 繁体中文（台湾）
    'zh-HK': 85,   // 粤语（香港）
    'zh': 80       // 通用中文
};

function getVoices() {
    const availableVoices = synth.getVoices();
    if (availableVoices.length > 0) {
        voices = availableVoices;
        voicesLoaded = true;

        // 调试：打印所有法语和中文语音
        const frenchVoices = voices.filter(v => v.lang.toLowerCase().startsWith('fr'));
        const chineseVoices = voices.filter(v => v.lang.toLowerCase().startsWith('zh'));
        console.log('Available French voices:', frenchVoices.map(v => ({
            name: v.name,
            lang: v.lang,
            local: v.localService,
            default: v.default
        })));
        console.log('Available Chinese voices:', chineseVoices.map(v => ({
            name: v.name,
            lang: v.lang,
            local: v.localService,
            default: v.default
        })));
    }
}

// 计算语音质量分数
function calculateVoiceScore(voice, targetLang = 'fr') {
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
    const priorityMap = targetLang === 'zh' ? CHINESE_LOCALE_PRIORITY : FRENCH_LOCALE_PRIORITY;

    for (const [locale, points] of Object.entries(priorityMap)) {
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
        nameLower.includes('audrey') ||
        nameLower.includes('yaoyao') ||
        nameLower.includes('xiaoxiao')) {
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
        score: calculateVoiceScore(voice, 'fr')
    })).sort((a, b) => b.score - a.score);

    const bestVoice = scoredVoices[0].voice;
    console.log(`Selected best French voice: ${bestVoice.name} (lang: ${bestVoice.lang}, score: ${scoredVoices[0].score})`);

    return bestVoice;
}

// 选择最佳中文语音
function selectBestChineseVoice() {
    if (voices.length === 0) {
        return null;
    }

    // 筛选中文语音
    const chineseVoices = voices.filter(voice =>
        voice.lang.toLowerCase().startsWith('zh')
    );

    if (chineseVoices.length === 0) {
        console.warn('No Chinese voices found');
        return null;
    }

    // 计算每个语音的分数并排序
    const scoredVoices = chineseVoices.map(voice => ({
        voice,
        score: calculateVoiceScore(voice, 'zh')
    })).sort((a, b) => b.score - a.score);

    const bestVoice = scoredVoices[0].voice;
    console.log(`Selected best Chinese voice: ${bestVoice.name} (lang: ${bestVoice.lang}, score: ${scoredVoices[0].score})`);

    return bestVoice;
}

getVoices();
if (synth.onvoiceschanged !== undefined) {
    synth.onvoiceschanged = getVoices;
}

/**
 * 智能分割混合语言文本
 * 将文本分为法语部分和中文部分（通常在括号里）
 */
function splitMixedLanguageText(text) {
    const segments = [];
    // 匹配括号里的中文内容
    const pattern = /([^(（]+)|([(（][\u4e00-\u9fa5\s，。！？、]+[)）])/g;
    let match;

    while ((match = pattern.exec(text)) !== null) {
        if (match[1]) {
            // 法语部分
            const frenchText = match[1].trim();
            if (frenchText) {
                segments.push({ text: frenchText, lang: 'fr' });
            }
        } else if (match[2]) {
            // 中文部分（去掉括号）
            const chineseText = match[2].replace(/[()（）]/g, '').trim();
            if (chineseText) {
                segments.push({ text: chineseText, lang: 'zh' });
            }
        }
    }

    return segments;
}

/**
 * 按顺序朗读多个文本段落
 */
function speakSegments(segments, options = {}) {
    if (segments.length === 0) {
        if (options.onend) options.onend();
        return;
    }

    const currentSegment = segments[0];
    const remainingSegments = segments.slice(1);

    // 递归朗读下一段
    const nextOnEnd = () => {
        if (remainingSegments.length > 0) {
            speakSegments(remainingSegments, options);
        } else if (options.onend) {
            options.onend();
        }
    };

    // 朗读当前段落
    speakSingleLanguage(currentSegment.text, {
        ...options,
        lang: currentSegment.lang === 'zh' ? 'zh-CN' : 'fr-FR',
        onend: nextOnEnd
    });
}

/**
 * 朗读单一语言的文本
 */
function speakSingleLanguage(text, options = {}) {
    const { lang = 'fr-FR', rate, pitch, voiceURI, onstart, onend } = options;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;

    let selectedVoice = null;

    // 优先使用用户指定的语音
    if (voiceURI) {
        selectedVoice = voices.find(v => v.voiceURI === voiceURI);
    }

    // 根据语言选择最佳语音
    if (!selectedVoice) {
        if (lang.startsWith('zh')) {
            selectedVoice = selectBestChineseVoice();
        } else {
            selectedVoice = selectBestFrenchVoice();
        }
    }

    if (selectedVoice) {
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang;
    }

    // 根据语音类型调整参数
    if (selectedVoice) {
        const voiceName = selectedVoice.name;
        if (voiceName.includes('Google')) {
            utterance.pitch = pitch !== undefined ? pitch : 1.0;
            utterance.rate = rate !== undefined ? rate : (lang.startsWith('zh') ? 1.0 : 0.9);
        } else if (voiceName.includes('Microsoft')) {
            utterance.pitch = pitch !== undefined ? pitch : 1.02;
            utterance.rate = rate !== undefined ? rate : (lang.startsWith('zh') ? 1.0 : 0.88);
        } else {
            utterance.pitch = pitch !== undefined ? pitch : 1.05;
            utterance.rate = rate !== undefined ? rate : (lang.startsWith('zh') ? 0.95 : 0.85);
        }
    } else {
        utterance.pitch = pitch !== undefined ? pitch : 1.0;
        utterance.rate = rate !== undefined ? rate : 0.9;
    }

    utterance.volume = 1.0;

    // 设置回调
    if (onstart) utterance.onstart = onstart;
    if (onend) utterance.onend = onend;

    synth.speak(utterance);
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

    // 取消之前的朗读
    synth.cancel();

    // 兼容旧的调用方式：speak(text, lang)
    const config = typeof options === 'string' ? { lang: options } : options;
    const {
        lang = 'fr-FR',
        rate,
        pitch,
        voiceURI,
        onstart,
        onend,
        skipChinese = false  // 新增选项：是否跳过中文部分
    } = config;

    // 检测文本中是否包含中文
    const hasChinese = /[\u4e00-\u9fa5]/.test(text);

    if (hasChinese && !skipChinese) {
        // 如果包含中文且不跳过中文，使用智能分割和混合朗读
        const segments = splitMixedLanguageText(text);

        if (segments.length > 0) {
            // 使用多语言朗读
            speakSegments(segments, { rate, pitch, voiceURI, onstart, onend });
        } else {
            // 分割失败，回退到单语言朗读
            speakSingleLanguage(text, config);
        }
    } else if (skipChinese && hasChinese) {
        // 跳过中文部分，只朗读法语
        const frenchOnly = text.replace(/[(（][\u4e00-\u9fa5\s，。！？、]+[)）]/g, '').trim();
        if (frenchOnly) {
            speakSingleLanguage(frenchOnly, config);
        } else if (onend) {
            onend();
        }
    } else {
        // 纯法语文本，直接朗读
        speakSingleLanguage(text, config);
    }
}

// 导出获取可用语音列表的函数
export function getAvailableFrenchVoices() {
    // 确保语音已加载
    if (voices.length === 0) {
        getVoices();
    }
    return voices.filter(voice => voice.lang && voice.lang.toLowerCase().startsWith('fr'));
}

export function getAvailableChineseVoices() {
    // 确保语音已加载
    if (voices.length === 0) {
        getVoices();
    }
    return voices.filter(voice => voice.lang && voice.lang.toLowerCase().startsWith('zh'));
}

if (recognition) {
    recognition.continuous = false;
    recognition.interimResults = false;
} else {
    console.warn("Speech Recognition not supported in this browser.");
}
