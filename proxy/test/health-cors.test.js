const test = require('node:test');
const assert = require('node:assert/strict');

process.env.QWEN_API_KEY = 'test-key-for-health-check';
process.env.ALLOWED_ORIGINS = 'https://baronsue.github.io';
process.env.NODE_ENV = 'production';

const { app } = require('../server');

async function withServer(callback) {
    const server = app.listen(0, '127.0.0.1');
    await new Promise((resolve, reject) => {
        server.once('listening', resolve);
        server.once('error', reject);
    });

    try {
        const address = server.address();
        await callback(`http://127.0.0.1:${address.port}`);
    } finally {
        await new Promise((resolve, reject) => {
            server.close((error) => error ? reject(error) : resolve());
        });
    }
}

test('health check allows Render requests without an Origin header', async () => {
    await withServer(async (baseUrl) => {
        const response = await fetch(`${baseUrl}/health`);
        assert.equal(response.status, 200);
        assert.equal(response.headers.get('access-control-allow-origin'), null);
    });
});

test('health check exposes CORS headers to the deployed GitHub Pages origin', async () => {
    await withServer(async (baseUrl) => {
        const response = await fetch(`${baseUrl}/health`, {
            headers: { Origin: 'https://baronsue.github.io' },
        });

        assert.equal(response.status, 200);
        assert.equal(
            response.headers.get('access-control-allow-origin'),
            'https://baronsue.github.io'
        );
        assert.equal(response.headers.get('access-control-allow-credentials'), 'true');
    });
});

test('health check does not expose CORS headers to untrusted origins', async () => {
    await withServer(async (baseUrl) => {
        const response = await fetch(`${baseUrl}/health`, {
            headers: { Origin: 'https://example.invalid' },
        });

        assert.equal(response.status, 200);
        assert.equal(response.headers.get('access-control-allow-origin'), null);
    });
});
