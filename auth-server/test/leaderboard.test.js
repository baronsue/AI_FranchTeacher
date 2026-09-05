const test = require('node:test');
const assert = require('node:assert/strict');

const database = require('../config/database');
const calls = [];

database.query = async (text, params) => {
    calls.push({ text, params });
    return {
        rows: [{
            id: 42,
            username: 'database_user',
            display_name: '数据库用户',
            avatar: '🎓',
            total_points: 120,
            words_learned: 18,
            current_streak: 4,
            rank: '1',
            is_me: true
        }]
    };
};

const { getLeaderboard } = require('../controllers/userController');

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

test('排行榜直接查询数据库表并标记当前用户', async () => {
    calls.length = 0;
    const response = createResponse();

    await getLeaderboard({ user: { userId: 42 }, query: { limit: '500' } }, response);

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.success, true);
    assert.equal(response.body.data[0].is_me, true);
    assert.equal(calls.length, 1);
    assert.match(calls[0].text, /FROM users u/);
    assert.match(calls[0].text, /LEFT JOIN user_points/);
    assert.match(calls[0].text, /LEFT JOIN user_stats/);
    assert.match(calls[0].text, /\(u\.is_demo = false OR u\.id = \$1\)/);
    assert.match(calls[0].text, /\(id = \$1\) AS is_me/);
    assert.deepEqual(calls[0].params, [42, 100]);
});

test('排行榜使用安全的默认数量', async () => {
    calls.length = 0;
    const response = createResponse();

    await getLeaderboard({ user: { userId: 7 }, query: { limit: 'invalid' } }, response);

    assert.equal(response.body.success, true);
    assert.deepEqual(calls[0].params, [7, 10]);
});
