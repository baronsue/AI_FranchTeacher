/**
 * 数据库连接配置
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// 数据库连接池配置
const poolConfig = process.env.DATABASE_URL
    ? {
          connectionString: process.env.DATABASE_URL,
          ssl: process.env.NODE_ENV === 'production'
              ? { rejectUnauthorized: false }
              : false,
      }
    : {
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '5432'),
          user: process.env.DB_USER || 'postgres',
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME || 'french_teacher',
          ssl: process.env.NODE_ENV === 'production'
              ? { rejectUnauthorized: false }
              : false,
      };

// 创建连接池
const pool = new Pool(poolConfig);

// 测试连接
pool.on('connect', () => {
    console.log('✓ Database connected successfully');
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

// 查询辅助函数
export const query = async (text, params) => {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('executed query', { text, duration, rows: res.rowCount });
        return res;
    } catch (error) {
        console.error('Query error:', error);
        throw error;
    }
};

// 事务辅助函数
export const getClient = async () => {
    const client = await pool.connect();
    const query = client.query.bind(client);
    const release = client.release.bind(client);

    // 设置超时
    const timeout = setTimeout(() => {
        console.error('A client has been checked out for more than 5 seconds!');
    }, 5000);

    client.release = () => {
        clearTimeout(timeout);
        client.release();
    };

    return { query, release };
};

// 检查数据库连接
export const checkConnection = async () => {
    try {
        const result = await pool.query('SELECT NOW()');
        console.log('Database connection test:', result.rows[0]);
        return true;
    } catch (error) {
        console.error('Database connection failed:', error);
        return false;
    }
};

export default pool;
