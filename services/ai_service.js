/**
 * AI 对话服务 - 支持多个 AI 提供商
 */

import { callQwenAPI } from './qwen_service.js';

// AI 提供商类型
export const AI_PROVIDERS = {
    QWEN: 'qwen',           // 通义千问（推荐）
    HUGGINGFACE: 'huggingface'  // HuggingFace 免费 API
};

// 当前使用的提供商
let currentProvider = AI_PROVIDERS.QWEN; // 默认使用 Qwen

// HuggingFace 免费推理 API 端点
const HF_API_URL = 'https://api-inference.huggingface.co/models/';

// 推荐的多语言对话模型（免费，支持中文和法语）
const MODELS = {
    // 主模型：Meta 的 Llama 2，支持多语言
    primary: 'meta-llama/Llama-2-7b-chat-hf',
    // 备用模型：较小但速度快
    fallback: 'microsoft/DialoGPT-medium',
    // 多语言模型
    multilingual: 'bigscience/bloom-560m'
};

// 当前使用的模型
let currentModel = MODELS.primary;

// API 请求配置
const REQUEST_CONFIG = {
    timeout: 30000, // 30秒超时
    maxRetries: 2
};

/**
 * 构建对话系统提示词
 */
function buildSystemPrompt() {
    return `Tu es Aurélie, une professeure de français virtuelle sympathique et patiente. 
Tu aides les étudiants chinois à apprendre le français.

Instructions:
- Réponds TOUJOURS en français simple et clair
- Sois encourageante et positive
- Corrige les erreurs gentiment
- Donne des exemples concrets
- Adapte ton niveau au niveau de l'étudiant
- Limite tes réponses à 2-3 phrases pour rester conversationnel`;
}

/**
 * 调用 HuggingFace Inference API
 */
async function callHuggingFaceAPI(messages, modelName = currentModel) {
    const url = `${HF_API_URL}${modelName}`;
    
    // 将对话历史转换为提示词
    const prompt = formatMessagesForModel(messages);
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // 注意：免费 API 不需要 token，但有速率限制
                // 如果你有 HuggingFace token，可以添加：
                // 'Authorization': `Bearer ${YOUR_HF_TOKEN}`
            },
            body: JSON.stringify({
                inputs: prompt,
                parameters: {
                    max_new_tokens: 150,
                    temperature: 0.8,
                    top_p: 0.9,
                    do_sample: true,
                    return_full_text: false
                }
            })
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error || `API Error: ${response.status}`);
        }

        const data = await response.json();
        
        // 处理不同的响应格式
        if (Array.isArray(data) && data.length > 0) {
            return data[0].generated_text || data[0].text || '';
        } else if (data.generated_text) {
            return data.generated_text;
        } else if (typeof data === 'string') {
            return data;
        }
        
        throw new Error('Unexpected API response format');
        
    } catch (error) {
        console.error('HuggingFace API Error:', error);
        throw error;
    }
}

/**
 * 格式化消息为模型输入格式
 */
function formatMessagesForModel(messages) {
    const systemPrompt = buildSystemPrompt();
    
    // 构建对话历史
    let prompt = systemPrompt + '\n\n';
    
    messages.forEach(msg => {
        if (msg.role === 'user') {
            prompt += `Étudiant: ${msg.content}\n`;
        } else if (msg.role === 'assistant') {
            prompt += `Aurélie: ${msg.content}\n`;
        }
    });
    
    prompt += 'Aurélie:';
    
    return prompt;
}

/**
 * 设置 AI 提供商
 */
export function setAIProvider(provider) {
    if (Object.values(AI_PROVIDERS).includes(provider)) {
        currentProvider = provider;
        console.log(`AI Provider switched to: ${provider}`);
        return true;
    }
    return false;
}

/**
 * 获取当前 AI 提供商
 */
export function getCurrentProvider() {
    return currentProvider;
}

/**
 * 生成 AI 回复
 * @param {Array} conversationHistory - 对话历史 [{role: 'user'|'assistant', content: string}]
 * @param {string} userInput - 用户最新输入
 * @returns {Promise<string>} AI 回复
 */
export async function generateAIResponse(conversationHistory, userInput) {
    try {
        let response;
        
        // 根据提供商选择 API
        if (currentProvider === AI_PROVIDERS.QWEN) {
            try {
                response = await callQwenAPI(conversationHistory, userInput);
                return response;
            } catch (error) {
                console.warn('Qwen API unavailable, falling back to HuggingFace:', error.message);
                currentProvider = AI_PROVIDERS.HUGGINGFACE;
            }
        }
        
        // 使用 HuggingFace API（免费备选）
        if (currentProvider === AI_PROVIDERS.HUGGINGFACE) {
            const messages = [
                ...conversationHistory.slice(-6),
                { role: 'user', content: userInput }
            ];
            
            response = await callHuggingFaceAPI(messages);
            const cleanedResponse = cleanResponse(response);
            return cleanedResponse;
        }
        
        throw new Error('No valid AI provider configured');
        
    } catch (error) {
        console.error('AI Response Generation Error:', error);
        
        // 错误时返回友好的回退响应
        return getFallbackResponse(error, userInput);
    }
}

/**
 * 清理 AI 响应文本
 */
function cleanResponse(text) {
    if (!text) return '';
    
    // 移除可能的前缀
    let cleaned = text
        .replace(/^(Aurélie:|Assistant:|AI:)\s*/i, '')
        .trim();
    
    // 如果响应过长，截取到第一个完整句子
    const sentences = cleaned.match(/[^.!?]+[.!?]+/g);
    if (sentences && sentences.length > 3) {
        cleaned = sentences.slice(0, 3).join(' ');
    }
    
    // 确保以标点结束
    if (cleaned && !/[.!?]$/.test(cleaned)) {
        cleaned += '.';
    }
    
    return cleaned;
}

/**
 * 获取回退响应（当 API 失败时）
 */
function getFallbackResponse(error, userInput) {
    console.warn('Using fallback response due to:', error.message);
    
    const input = userInput.toLowerCase();
    
    // 基于关键词的简单回退
    if (input.includes('bonjour') || input.includes('salut')) {
        return "Bonjour ! Je suis désolée, j'ai un petit problème technique. Mais je suis là pour vous aider ! Que voulez-vous apprendre ?";
    }
    
    if (input.includes('merci')) {
        return "De rien ! N'hésitez pas si vous avez d'autres questions.";
    }
    
    if (input.includes('au revoir') || input.includes('bye')) {
        return "Au revoir ! À bientôt pour continuer à pratiquer le français !";
    }
    
    // 检测疑问词
    if (input.includes('?') || /\b(comment|pourquoi|quand|où|qui|que|quel)\b/.test(input)) {
        return "C'est une bonne question ! Pouvez-vous reformuler ou donner plus de détails ? Je vais mieux comprendre.";
    }
    
    // 默认回退响应
    const fallbacks = [
        "Intéressant ! Pouvez-vous m'en dire plus ?",
        "Je vous écoute. Continuez, s'il vous plaît.",
        "D'accord. Qu'aimeriez-vous pratiquer maintenant ?",
        "Très bien ! Parlons de cela en français. Donnez-moi un exemple.",
        "Je comprends. Comment puis-je vous aider avec votre français ?"
    ];
    
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

/**
 * 检查 API 是否可用
 */
export async function checkAPIAvailability() {
    try {
        const testPrompt = "Bonjour";
        const response = await fetch(`${HF_API_URL}${currentModel}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                inputs: testPrompt,
                parameters: { max_new_tokens: 10 }
            })
        });
        
        return response.ok || response.status === 503; // 503 表示模型正在加载，但可用
        
    } catch (error) {
        console.error('API availability check failed:', error);
        return false;
    }
}

/**
 * 切换模型
 */
export function switchModel(modelKey) {
    if (MODELS[modelKey]) {
        currentModel = MODELS[modelKey];
        console.log(`Switched to model: ${currentModel}`);
        return true;
    }
    return false;
}

/**
 * 获取当前模型信息
 */
export function getCurrentModel() {
    return {
        name: currentModel,
        provider: 'HuggingFace',
        isFree: true
    };
}

