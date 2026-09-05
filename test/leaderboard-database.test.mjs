import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('课程页排行榜从认证服务读取数据库数据', async () => {
    const source = await readFile(
        new URL('../views/course_view_enhanced_entry.js', import.meta.url),
        'utf8'
    );

    assert.match(source, /userDataService\.getLeaderboard\(10\)/);
    assert.doesNotMatch(source, /showLeaderboardModal\(getLeaderboard\(\)\)/);
    assert.match(source, /请先登录，或使用免登录快速演示查看排行榜/);
    assert.match(source, /user\.total_points/);
    assert.match(source, /user\.is_me/);
});
