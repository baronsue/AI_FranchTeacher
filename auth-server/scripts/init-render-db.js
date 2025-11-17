const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function initDatabase() {
    console.log('🚀 开始初始化数据库...');

    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
        console.error('❌ 错误: DATABASE_URL 环境变量未设置');
        console.log('请运行: export DATABASE_URL="你的数据库URL"');
        process.exit(1);
    }

    // 检测是否是本地数据库 (localhost 或 127.0.0.1)
    const isLocalDatabase = databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1');

    console.log(`📍 数据库类型: ${isLocalDatabase ? '本地' : '远程 (Render)'}`);
    console.log(`🔗 连接 URL: ${databaseUrl.replace(/:[^:@]+@/, ':****@')}`); // 隐藏密码

    const poolConfig = {
        connectionString: databaseUrl,
    };

    // 只有远程数据库才需要 SSL
    if (!isLocalDatabase) {
        poolConfig.ssl = {
            rejectUnauthorized: false,
        };
    }

    const pool = new Pool(poolConfig);
    let client;

    try {
        // 获取一个客户端连接
        console.log('📡 正在连接数据库...');
        client = await pool.connect();
        console.log('✅ 连接成功！');

        // 读取 SQL 初始化脚本
        const sqlPath = path.join(__dirname, '../../database/init.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('📄 执行初始化 SQL 脚本...');
        console.log('⏳ 这可能需要几秒钟...');

        // 直接执行整个 SQL 文件（PostgreSQL 支持多语句）
        try {
            await client.query(sql);
            console.log('✅ SQL 脚本执行成功！');
        } catch (error) {
            // 如果整体执行失败，可能是因为某些对象已存在，尝试逐条执行
            console.log('⚠️  整体执行失败，尝试逐条执行...');

            // 更智能的分割：按照 ; 分割，但忽略函数体内的分号
            const statements = sql
                .split(/;\s*$/m) // 按行尾的分号分割
                .map(s => s.trim())
                .filter(s => s.length > 0 && !s.startsWith('--'));

            let successCount = 0;
            let skipCount = 0;

            for (let i = 0; i < statements.length; i++) {
                const statement = statements[i];
                try {
                    await client.query(statement);
                    successCount++;
                    process.stdout.write(`\r✓ 执行进度: ${i + 1}/${statements.length}`);
                } catch (error) {
                    // 忽略 "already exists" 错误
                    if (error.message.includes('already exists')) {
                        skipCount++;
                    } else {
                        console.error(`\n⚠️  语句执行警告: ${error.message.substring(0, 100)}`);
                    }
                }
            }
            console.log(`\n✅ 完成: ${successCount} 成功, ${skipCount} 已存在`);
        }

        // 验证表创建
        console.log('\n📊 验证数据库表...');
        const result = await client.query(`
            SELECT tablename
            FROM pg_tables
            WHERE schemaname = 'public'
            ORDER BY tablename
        `);

        if (result.rows.length === 0) {
            console.log('⚠️  警告: 未找到任何表！');
        } else {
            console.log(`✅ 找到 ${result.rows.length} 个表:`);
            result.rows.forEach((row) => {
                console.log(`  ✓ ${row.tablename}`);
            });
        }

        client.release();
        await pool.end();
        console.log('\n🎉 数据库初始化完成！');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ 数据库初始化失败:', error.message);
        console.error('详细错误:', error);
        if (client) client.release();
        await pool.end();
        process.exit(1);
    }
}

initDatabase();
