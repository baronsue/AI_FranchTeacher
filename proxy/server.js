const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3001;
const QWEN_API_KEY = process.env.QWEN_API_KEY;
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim())
    : ['http://localhost:5500', 'http://127.0.0.1:5500'];

const DASHSCOPE_API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';

if (!QWEN_API_KEY) {
    console.warn('[Qwen Proxy] Missing QWEN_API_KEY environment variable. Requests will fail until it is provided.');
}

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || ALLOWED_ORIGINS.includes(origin)) {
                callback(null, true);
            } else {
                console.warn(`[Qwen Proxy] Blocked origin: ${origin}`);
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: false,
    })
);

app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        provider: 'qwen',
        hasApiKey: Boolean(QWEN_API_KEY),
        allowedOrigins: ALLOWED_ORIGINS,
    });
});

app.post('/qwen', async (req, res) => {
    if (!QWEN_API_KEY) {
        return res.status(500).json({
            error: 'QWEN_API_KEY is not configured on the proxy server.',
        });
    }

    try {
        const dashScopeResponse = await axios.post(DASHSCOPE_API_URL, req.body, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${QWEN_API_KEY}`,
                'X-DashScope-SSE': 'disable',
            },
            timeout: 30000,
        });

        res.status(dashScopeResponse.status).json(dashScopeResponse.data);
    } catch (error) {
        if (error.response) {
            console.error('[Qwen Proxy] API Error:', error.response.data);
            res.status(error.response.status).json({
                error: error.response.data,
            });
        } else if (error.request) {
            console.error('[Qwen Proxy] No response received from DashScope:', error.message);
            res.status(504).json({
                error: 'No response received from DashScope API.',
            });
        } else {
            console.error('[Qwen Proxy] Unexpected error:', error.message);
            res.status(500).json({
                error: 'Unexpected proxy error.',
            });
        }
    }
});

app.listen(PORT, () => {
    console.log(`[Qwen Proxy] Server is running on http://localhost:${PORT}`);
    console.log(`[Qwen Proxy] Allowed origins: ${ALLOWED_ORIGINS.join(', ')}`);
});

