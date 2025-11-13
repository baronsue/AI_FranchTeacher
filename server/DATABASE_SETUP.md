# PostgreSQL 数据库设置指南

本指南介绍如何设置 PostgreSQL 数据库用于 AI FranchTeacher 应用。

## 目录

1. [本地开发环境设置](#本地开发环境设置)
2. [PgAdmin 4 管理](#pgadmin-4-管理)
3. [Render 云端数据库](#render-云端数据库)
4. [数据库初始化](#数据库初始化)
5. [常见问题](#常见问题)

---

## 本地开发环境设置

### 1. 安装 PostgreSQL

#### Windows
1. 下载 PostgreSQL: https://www.postgresql.org/download/windows/
2. 运行安装程序
3. 设置超级用户(postgres)密码
4. 默认端口: 5432

#### macOS (使用 Homebrew)
```bash
brew install postgresql@15
brew services start postgresql@15
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. 创建数据库

```bash
# 切换到 postgres 用户
sudo -u postgres psql

# 或者直接连接（如果已设置密码）
psql -U postgres

# 创建数据库
CREATE DATABASE french_teacher;

# 创建专用用户（可选）
CREATE USER french_teacher_user WITH PASSWORD 'your_password';

# 授予权限
GRANT ALL PRIVILEGES ON DATABASE french_teacher TO french_teacher_user;

# 退出
\q
```

### 3. 配置环境变量

在 `server/` 目录创建 `.env` 文件：

```bash
cd server
cp .env.example .env
```

编辑 `.env`:

```env
# 使用 postgres 超级用户
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/french_teacher

# 或使用专用用户
DATABASE_URL=postgresql://french_teacher_user:your_password@localhost:5432/french_teacher

JWT_SECRET=your-generated-secret-key
NODE_ENV=development
PORT=3001
ALLOWED_ORIGINS=http://localhost:5500,http://127.0.0.1:5500
```

---

## PgAdmin 4 管理

### 1. 安装 PgAdmin 4

下载地址: https://www.pgadmin.org/download/

### 2. 连接到数据库

1. 打开 PgAdmin 4
2. 右键 "Servers" → "Create" → "Server"
3. **General 标签**:
   - Name: `Local PostgreSQL` (任意名称)
4. **Connection 标签**:
   - Host: `localhost`
   - Port: `5432`
   - Maintenance database: `postgres`
   - Username: `postgres`
   - Password: (你设置的密码)
   - Save password: ✓
5. 点击 "Save"

### 3. 创建数据库（通过 PgAdmin）

1. 展开服务器 → `PostgreSQL 15`
2. 右键 "Databases" → "Create" → "Database"
3. Name: `french_teacher`
4. Owner: `postgres`
5. 点击 "Save"

### 4. 执行 SQL 脚本

1. 选中 `french_teacher` 数据库
2. 点击工具栏的 "Query Tool" (查询工具)
3. 打开 `database/schema.sql` 文件
4. 复制所有内容粘贴到查询窗口
5. 点击 "Execute/Refresh" (F5) 执行

### 5. 验证表结构

1. 展开 `french_teacher` → `Schemas` → `public` → `Tables`
2. 应该看到 9 个表:
   - users
   - user_progress
   - user_points
   - points_history
   - user_badges
   - user_checkins
   - user_mistakes
   - user_stats
   - dialogue_history

### 6. 查看数据

右键任意表 → "View/Edit Data" → "All Rows"

---

## Render 云端数据库

### 1. 创建 PostgreSQL 数据库

1. 登录 Render: https://render.com
2. Dashboard → "New" → "PostgreSQL"
3. 配置:
   - Name: `french-teacher-db`
   - Database: `french_teacher`
   - User: `french_teacher_user` (自动生成)
   - Region: `Oregon (US West)` (与你的服务器相同)
   - PostgreSQL Version: `15`
   - Plan: `Free` (开始时)
4. 点击 "Create Database"

### 2. 获取连接信息

创建完成后，在数据库详情页找到：

- **Internal Database URL** (用于 Render 服务器连接):
  ```
  postgresql://user:password@hostname:5432/french_teacher
  ```

- **External Database URL** (用于本地 PgAdmin 连接):
  ```
  postgresql://user:password@external-hostname:5432/french_teacher
  ```

### 3. 在 PgAdmin 中连接 Render 数据库

1. PgAdmin → "Create" → "Server"
2. **General**:
   - Name: `Render PostgreSQL`
3. **Connection**:
   - Host: (从 External URL 复制主机名)
   - Port: `5432`
   - Maintenance database: `french_teacher`
   - Username: (从 External URL 复制)
   - Password: (从 External URL 复制)
   - SSL mode: `Require`
4. **SSL 标签**:
   - SSL mode: `require`
5. 保存

### 4. 初始化 Render 数据库

在 PgAdmin 连接到 Render 数据库后：

1. 打开 Query Tool
2. 执行 `database/schema.sql`
3. 验证表创建成功

---

## 数据库初始化

### 方法 1: 手动执行 SQL

```bash
# 本地数据库
psql -U postgres -d french_teacher -f database/schema.sql

# Render 数据库（使用 External URL）
psql "postgresql://user:password@hostname:5432/french_teacher?sslmode=require" -f database/schema.sql
```

### 方法 2: 通过 Node.js 脚本（推荐）

创建 `server/scripts/setup-db.js`:

```javascript
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function setupDatabase() {
    const client = new pg.Client({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production'
            ? { rejectUnauthorized: false }
            : false
    });

    try {
        await client.connect();
        console.log('Connected to database');

        const schemaPath = join(__dirname, '../../database/schema.sql');
        const schema = readFileSync(schemaPath, 'utf-8');

        await client.query(schema);
        console.log('✓ Database schema created successfully');

    } catch (error) {
        console.error('✗ Database setup failed:', error);
        process.exit(1);
    } finally {
        await client.end();
    }
}

setupDatabase();
```

运行脚本:

```bash
cd server
npm run db:setup
```

---

## 数据库备份与恢复

### 备份

#### 本地数据库
```bash
pg_dump -U postgres french_teacher > backup.sql
```

#### Render 数据库
在 Render Dashboard:
1. 选择数据库
2. "Backups" 标签
3. "Create Backup" → "Manual Snapshot"

### 恢复

```bash
# 本地
psql -U postgres french_teacher < backup.sql

# Render（通过 psql）
psql "postgresql://user:password@hostname:5432/french_teacher?sslmode=require" < backup.sql
```

---

## 数据迁移

### 从 localStorage 迁移到 PostgreSQL

如果用户已有本地数据，需要提供迁移工具：

```javascript
// 示例迁移逻辑
async function migrateLocalData(userId, token) {
    // 1. 读取 localStorage 数据
    const courseProgress = JSON.parse(localStorage.getItem('aurelie_app_courses') || '{}');
    const gamePoints = JSON.parse(localStorage.getItem('aurelie_game_points') || '{}');
    const gameBadges = JSON.parse(localStorage.getItem('aurelie_game_badges') || '[]');

    // 2. 发送到服务器
    for (const [courseId, progress] of Object.entries(courseProgress)) {
        await fetch(`/api/progress/${courseId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(progress)
        });
    }

    // 3. 清除本地数据（可选）
    // localStorage.clear();
}
```

---

## 性能优化

### 索引（已在 schema.sql 中定义）

```sql
-- 用户查询优化
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- 进度查询优化
CREATE INDEX idx_user_progress_user_course ON user_progress(user_id, course_id);

-- 积分历史查询优化
CREATE INDEX idx_points_history_user ON points_history(user_id, created_at DESC);
```

### 查询优化建议

1. **使用 EXPLAIN ANALYZE** 分析慢查询
2. **限制返回结果**: 使用 LIMIT 和 OFFSET
3. **避免 SELECT ***: 只查询需要的列
4. **使用事务**: 批量操作使用 BEGIN/COMMIT

---

## 常见问题

### Q: 连接被拒绝 "connection refused"

**A**: 检查：
1. PostgreSQL 服务是否运行: `sudo systemctl status postgresql`
2. 端口是否正确: 默认 5432
3. 防火墙设置

### Q: 密码认证失败

**A**:
1. 检查 `pg_hba.conf` 文件
2. 确认密码正确
3. 尝试重置密码:
   ```bash
   sudo -u postgres psql
   ALTER USER postgres PASSWORD 'newpassword';
   ```

### Q: Render 数据库连接超时

**A**:
1. 确保使用 **Internal Database URL** 在 Render 服务中
2. 确保使用 **External Database URL** 在本地连接
3. 检查 SSL 设置: `sslmode=require`

### Q: 表已存在错误

**A**:
```sql
-- 删除所有表（谨慎操作！）
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;

-- 然后重新执行 schema.sql
```

### Q: PgAdmin 无法连接到 Render

**A**:
1. 使用 External Database URL
2. SSL mode 设置为 `Require`
3. 检查网络防火墙

---

## 监控与维护

### 查看数据库大小

```sql
SELECT
    pg_database.datname,
    pg_size_pretty(pg_database_size(pg_database.datname)) AS size
FROM pg_database;
```

### 查看表大小

```sql
SELECT
    table_name,
    pg_size_pretty(pg_total_relation_size(table_name::regclass)) AS size
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY pg_total_relation_size(table_name::regclass) DESC;
```

### 查看活动连接

```sql
SELECT * FROM pg_stat_activity WHERE datname = 'french_teacher';
```

---

## 下一步

数据库设置完成后：

1. ✅ 验证表结构正确
2. ✅ 测试数据库连接
3. ✅ 启动 API 服务器
4. ✅ 测试 API 端点
5. ✅ 实现前端认证界面

查看 [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) 了解 API 使用方法。
