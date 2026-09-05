import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
    DEPLOYED_QWEN_PROXY_URL,
    buildQwenHealthUrl,
    resolveDefaultQwenProxyUrl,
} from '../services/qwen_proxy_config.mjs';

test('线上页面默认使用 Render 代理', () => {
    assert.equal(
        resolveDefaultQwenProxyUrl({ protocol: 'https:', hostname: 'baronsue.github.io' }),
        DEPLOYED_QWEN_PROXY_URL
    );
});

test('本地开发页面仍使用本地代理', () => {
    assert.equal(
        resolveDefaultQwenProxyUrl({ protocol: 'http:', hostname: 'localhost' }),
        'http://localhost:3001/qwen'
    );
});

test('健康检查地址与当前代理保持同源', () => {
    assert.equal(
        buildQwenHealthUrl(DEPLOYED_QWEN_PROXY_URL),
        'https://franch-teacher-proxy.onrender.com/health'
    );
});

test('配置弹窗不再包含写死的本地健康检查链接', async () => {
    const source = await readFile(
        new URL('../views/dialogue_view.js', import.meta.url),
        'utf8'
    );

    assert.doesNotMatch(source, /href=["']http:\/\/localhost:3001\/health/);
    assert.match(source, /healthLink\.href = modelInfo\.healthUrl/);
});
