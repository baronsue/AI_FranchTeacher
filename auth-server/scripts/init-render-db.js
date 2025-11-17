const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function initDatabase() {
    console.log('🚀 开始初始化 Render 数据库...');

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false,
        },
    });

    try {
        // 读取 SQL 初始化脚本
        const sqlPath = path.join(__dirname, '../../database/init.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('📄 执行初始化 SQL 脚本...');

        // 执行 SQL（分割成单独的语句）
        const statements = sql
            .split(';')
            .map((s) => s.trim())
            .filter((s) => s.length > 0);

        for (const statement of statements) {
            try {
                await pool.query(statement);
            } catch (error) {
                // 忽略 "already exists" 错误
                if (!error.message.includes('already exists')) {
                    console.error('SQL 错误:', error.message);
                }
            }
        }

        console.log('✅ 数据库初始化成功！');

        // 验证表创建
        const result = await pool.query(`
            SELECT tablename
            FROM pg_tables
            WHERE schemaname = 'public'
            ORDER BY tablename
        `);

        console.log('📊 已创建的表:');
        result.rows.forEach((row) => {
            console.log(`  - ${row.tablename}`);
        });

        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ 数据库初始化失败:', error);
        await pool.end();
        process.exit(1);
    }
}

initDatabase();
