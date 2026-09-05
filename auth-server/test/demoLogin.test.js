const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const express = require('express');

process.env.JWT_SECRET = 'test-access-secret-with-enough-entropy';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret-with-enough-entropy';
process.env.BCRYPT_ROUNDS = '4';

const database = require('../config/database');
const calls = [];
let released = false;

database.getClient = async () => ({
    async query(text, params = []) {
        calls.push({ text, params });
        if (text.includes('INSERT INTO users')) {
            return {
                rows: [{
                    id: 42,
                    username: params[0],
                    email: params[1],
                    display_name: params[3],
                    avatar: params[4],
                    is_demo: true
                }]
            };
        }
        return { rows: [], rowCount: 0 };
    },
    release() {
        released = true;
    }
});

const { demoLogin } = require('../controllers/authController');
const authRoutes = require('../routes/auth');

function createResponse() {
    return {
        statusCode: 200,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(body) {
            this.body = body;
            return this;
        }
    };
}

test('demo login stays unavailable unless explicitly enabled', async () => {
    process.env.DEMO_LOGIN_ENABLED = 'false';
    const response = createResponse();

    await demoLogin({}, response);

    assert.equal(response.statusCode, 404);
    assert.equal(response.body.success, false);
});

test('demo login creates an isolated temporary user and valid tokens', async () => {
    process.env.DEMO_LOGIN_ENABLED = 'true';
    calls.length = 0;
    released = false;
    const response = createResponse();

    await demoLogin({}, response);

    assert.equal(response.statusCode, 201);
    assert.equal(response.body.success, true);
    assert.equal(response.body.data.user.displayName, '演示访客');
    assert.equal(response.body.data.user.isDemo, true);
    assert.match(response.body.data.user.username, /^demo_[a-f0-9]{16}$/);
    assert.equal(released, true);

    const accessPayload = jwt.verify(response.body.data.accessToken, process.env.JWT_SECRET);
    const refreshPayload = jwt.verify(response.body.data.refreshToken, process.env.REFRESH_TOKEN_SECRET);
    assert.equal(accessPayload.userId, 42);
    assert.equal(accessPayload.isDemo, true);
    assert.equal(refreshPayload.isDemo, true);
    assert.ok(accessPayload.exp - accessPayload.iat <= 8 * 60 * 60);

    assert.equal(calls[0].text, 'BEGIN');
    assert.equal(calls.at(-1).text, 'COMMIT');
    assert.ok(calls.some(({ text }) => text.includes('WHERE is_demo = true')));
    assert.ok(calls.some(({ text }) => text.includes('INSERT INTO user_points')));
    assert.ok(calls.some(({ text }) => text.includes('INSERT INTO user_stats')));
    assert.ok(calls.some(({ text }) => text.includes('INSERT INTO user_sessions')));
});

test('POST /api/auth/demo exposes the passwordless demo flow', async (t) => {
    process.env.DEMO_LOGIN_ENABLED = 'true';
    const app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);

    const server = app.listen(0, '127.0.0.1');
    await new Promise((resolve, reject) => {
        server.once('listening', resolve);
        server.once('error', reject);
    });
    t.after(() => new Promise((resolve) => server.close(resolve)));

    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/demo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}'
    });
    const body = await response.json();

    assert.equal(response.status, 201);
    assert.equal(body.success, true);
    assert.equal(body.data.user.isDemo, true);
    assert.ok(body.data.accessToken);
    assert.ok(body.data.refreshToken);
});
