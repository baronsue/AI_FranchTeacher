/**
 * 通义千问 Qwen API 服务
 * 通过本地/远程代理转发请求，避免在前端暴露 API Key。
 */

const DEFAULT_PROXY_URL =
    typeof window !== 'undefined'
        ? `${window.location.protocol}//${window.location.hostname}:3001/qwen`
        : 'http://localhost:3001/qwen';

const QWEN_MODELS = {
    turbo: 'qwen-turbo',
    plus: 'qwen-plus',
    max: 'qwen-max',
    long: 'qwen-long',
};

let currentModel = QWEN_MODELS.turbo;
let proxyUrl = DEFAULT_PROXY_URL;

export function setQwenProxyUrl(url) {
    if (url) {
        proxyUrl = url;
        console.log(`[Qwen] Proxy URL set to ${proxyUrl}`);
    }
}

function buildSystemPrompt() {
    return {
        role: 'system',
        content: `你是 Aurélie，一位友善、耐心的法语老师，专门帮助中国学生学习法语。

指导原则：
1. 始终用简单清晰的法语回复（A1-B1 级别）
2. 保持鼓励和积极的态度
3. 温柔地纠正错误，并给出正确示例
4. 提供实用的日常对话例句
5. 回复简洁（2-3 句话），保持对话流畅
6. 适时用中文解释复杂概念（用括号标注）
7. 主动引导学生练习

回复风格：
- 热情但专业
- 使用简单词汇和短句
- 多用疑问句引导对话
- 适当使用表情符号让气氛轻松

记住：你的目标是让学生在轻松愉快的对话中自然学会法语。`,
    };
}

function formatMessagesForQwen(conversationHistory, userInput) {
    const messages = [buildSystemPrompt()];
    const recentHistory = conversationHistory.slice(-8);

    recentHistory.forEach((msg) => {
        messages.push({
            role: msg.role,
            content: msg.content,
        });
    });

    messages.push({
        role: 'user',
        content: userInput,
    });

    return messages;
}

export async function callQwenAPI(conversationHistory, userInput) {
    const messages = formatMessagesForQwen(conversationHistory, userInput);

    try {
        const response = await fetch(proxyUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: currentModel,
                input: { messages },
                parameters: {
                    max_tokens: 200,
                    temperature: 0.8,
                    top_p: 0.9,
                    top_k: 50,
                    repetition_penalty: 1.1,
                    enable_search: false,
                    result_format: 'message',
                },
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const message =
                errorData?.error?.message ||
                errorData?.error ||
                `Proxy Error: ${response.status} ${response.statusText}`;
            throw new Error(message);
        }

        const data = await response.json();

        if (data.output && data.output.choices?.length) {
            const choice = data.output.choices[0];
            const content = choice.message.content;

            if (data.usage) {
                console.log('Qwen API Usage:', data.usage);
            }

            return cleanResponse(content);
        }

        throw new Error('Invalid response format from proxy.');
    } catch (error) {
        console.error('Qwen API Error:', error);
        throw error;
    }
}

function cleanResponse(text) {
    if (!text) return '';

    let cleaned = text.trim();
    cleaned = cleaned.replace(/^(Aurélie:|Assistant:|AI:)\s*/i, '');

    const sentences = cleaned.match(/[^.!?]+[.!?]+/g);
    if (sentences && sentences.length > 3) {
        cleaned = sentences.slice(0, 3).join(' ');
    }

    if (cleaned && !/[.!?。！？]$/.test(cleaned)) {
        cleaned += '.';
    }

    return cleaned;
}

export async function testQwenAPI() {
    try {
        const healthUrl = proxyUrl.replace(/\/qwen$/, '/health');
        const response = await fetch(healthUrl);

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error?.error || `Proxy health check failed: ${response.status}`);
        }

        const data = await response.json();

        if (!data.hasApiKey) {
            return {
                success: false,
                error: '代理服务器未配置 QWEN_API_KEY，请在 proxy/.env 中设置并重启代理服务。',
            };
        }

        return { success: true, message: '代理服务可用，Qwen API 已就绪。' };
    } catch (error) {
        console.error('Qwen API Test Failed:', error);
        return { success: false, error: error.message };
    }
}

export function switchQwenModel(modelKey) {
    if (QWEN_MODELS[modelKey]) {
        currentModel = QWEN_MODELS[modelKey];
        console.log(`Switched to Qwen model: ${currentModel}`);
        return true;
    }
    return false;
}

export function getQwenModelInfo() {
    return {
        current: currentModel,
        available: Object.keys(QWEN_MODELS),
        provider: 'Alibaba Cloud (通义千问)',
        proxyUrl,
    };
}

