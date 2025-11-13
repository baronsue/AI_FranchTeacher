const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

const port = parsePort(process.env.PORT);
const dashScopeEndpoint =
    process.env.DASHSCOPE_API_URL ||
    'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';
const allowedOrigins = buildAllowedOrigins(process.env.ALLOWED_ORIGINS);
const qwenApiKey = process.env.QWEN_API_KEY;

ensureApiKeyIsPresent(qwenApiKey);

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            console.warn(`[Qwen Proxy] Blocked origin: ${origin}`);
            return callback(new Error('Origin not allowed'));
        },
    })
);

app.use(express.json({ limit: '1mb' }));
app.use(morgan('combined'));

app.get('/', (_req, res) => {
    res.json({
        status: 'ok',
        message: 'Qwen proxy is running. Use /health for status or POST /qwen for requests.',
    });
});

app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        provider: 'qwen',
        hasApiKey: Boolean(qwenApiKey),
        allowedOrigins,
    });
});

app.post('/qwen', async (req, res) => {
    const validationError = validateProxyRequest(req.body);
    if (validationError) {
        return res.status(400).json({ error: validationError });
    }

    try {
        const dashScopeResponse = await forwardToDashScope(req.body, qwenApiKey, dashScopeEndpoint);
        return res.status(200).json(dashScopeResponse);
    } catch (error) {
        console.error('[Qwen Proxy] Forwarding failed:', error);
        return respondWithProxyError(res, error);
    }
});

const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';
app.listen(port, host, () => {
    console.log(`[Qwen Proxy] Server is running on http://${host}:${port}`);
    console.log(`[Qwen Proxy] Allowed origins: ${allowedOrigins.join(', ')}`);
});

function parsePort(portValue) {
    const parsed = Number.parseInt(portValue, 10);
    if (Number.isNaN(parsed) || parsed <= 0) {
        return 3001;
    }
    return parsed;
}

function buildAllowedOrigins(originConfig) {
    if (!originConfig) {
        return ['http://localhost:5500', 'http://127.0.0.1:5500'];
    }
    return originConfig.split(',').map((origin) => origin.trim()).filter(Boolean);
}

function ensureApiKeyIsPresent(apiKey) {
    if (!apiKey) {
        console.error('[Qwen Proxy] Missing QWEN_API_KEY environment variable.');
        process.exit(1);
    }
}

function validateProxyRequest(body) {
    if (!body || typeof body !== 'object') {
        return '请求体不能为空';
    }

    if (!body.model || typeof body.model !== 'string') {
        return '缺少模型参数 model';
    }

    if (!body.input || !Array.isArray(body.input.messages) || body.input.messages.length === 0) {
        return '缺少对话内容 input.messages';
    }

    return '';
}

async function forwardToDashScope(payload, apiKey, endpoint) {
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
            'X-DashScope-SSE': 'disable',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorText = await response.text();
        const dashScopeError = new Error(`DashScope responded with ${response.status}`);
        dashScopeError.status = response.status;
        dashScopeError.details = parseErrorPayload(errorText);
        throw dashScopeError;
    }

    return response.json();
}

function parseErrorPayload(text) {
    try {
        return JSON.parse(text);
    } catch (parseError) {
        return { message: text };
    }
}

function respondWithProxyError(res, error) {
    const status = error.status && Number.isInteger(error.status) ? error.status : 502;
    const errorBody = {
        error:
            error.details?.message ||
            error.message ||
            '代理服务转发请求失败，请稍后重试。',
        details: error.details || undefined,
    };
    return res.status(status).json(errorBody);
}

