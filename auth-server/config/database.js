const { Pool } = require('pg');
require('dotenv').config();

// 创建PostgreSQL连接池
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'ai_franchteacher',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    max: 20, // 最大连接数
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// 测试数据库连接
pool.on('connect', () => {
    console.log('✅ 数据库连接成功');
});

pool.on('error', (err) => {
    console.error('❌ 数据库连接错误:', err);
    process.exit(-1);
});

// 查询辅助函数
const query = async (text, params) => {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('执行查询:', { text, duration, rows: res.rowCount });
        return res;
    } catch (error) {
        console.error('查询错误:', error);
        throw error;
    }
};

// 获取客户端连接（用于事务）
const getClient = async () => {
    const client = await pool.connect();
    const query = client.query.bind(client);
    const release = client.release.bind(client);

    // 设置超时
    const timeout = setTimeout(() => {
        console.error('客户端连接超时，可能忘记释放');
    }, 5000);

    client.release = () => {
        clearTimeout(timeout);
        client.release();
    };

    return { query, release };
};

module.exports = {
    pool,
    query,
    getClient
};
