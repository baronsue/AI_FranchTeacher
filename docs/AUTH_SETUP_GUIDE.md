# AI FranchTeacher 用户认证系统部署指南

## 📋 目录
1. [系统概述](#系统概述)
2. [环境要求](#环境要求)
3. [数据库设置](#数据库设置)
4. [后端服务部署](#后端服务部署)
5. [前端配置](#前端配置)
6. [pgAdmin 4 数据库管理](#pgadmin-4-数据库管理)
7. [API 接口文档](#api-接口文档)
8. [常见问题](#常见问题)

---

## 系统概述

AI FranchTeacher 现已集成完整的用户认证和数据管理系统，包括：

### ✅ 已实现功能
- 用户注册/登录系统（JWT认证）
- 用户学习数据云端存储
- 课程进度同步
- 积分和徽章系统
- 打卡记录
- 错题本
- 对话历史
- 排行榜
- 本地数据自动迁移到数据库

### 🏗️ 技术栈
- **前端**: Vanilla JavaScript (ES6+), Tailwind CSS
- **后端**: Node.js + Express.js
- **数据库**: PostgreSQL 14+
- **认证**: JWT (JSON Web Tokens)
- **密码加密**: bcrypt

---

## 环境要求

### 必需软件
- **Node.js**: >= 16.x
- **PostgreSQL**: >= 14.x
- **pgAdmin 4**: 最新版本（用于数据库管理）
- **npm**: >= 8.x

### 检查环境
```bash
# 检查 Node.js 版本
node --version

# 检查 PostgreSQL 版本
psql --version

# 检查 npm 版本
npm --version
```

---

## 数据库设置

### 步骤 1: 安装 PostgreSQL

#### Windows
1. 下载 PostgreSQL：https://www.postgresql.org/download/windows/
2. 运行安装程序，设置密码（记住这个密码！）
3. 默认端口：5432

#### macOS
```bash
# 使用 Homebrew
brew install postgresql@14
brew services start postgresql@14
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 步骤 2: 创建数据库

打开终端或 pgAdmin 4 SQL 工具：

```sql
-- 创建数据库
CREATE DATABASE ai_franchteacher;

-- 创建专用用户（可选，推荐）
CREATE USER ai_franchteacher_app WITH PASSWORD 'your_secure_password';

-- 授予权限
GRANT ALL PRIVILEGES ON DATABASE ai_franchteacher TO ai_franchteacher_app;
```

### 步骤 3: 初始化数据库表

有两种方法初始化数据库：

#### 方法 A: 使用 pgAdmin 4（推荐）

1. 打开 pgAdmin 4
2. 连接到 PostgreSQL 服务器
3. 右键点击 `ai_franchteacher` 数据库
4. 选择 `Query Tool`
5. 打开文件：`database/init.sql`
6. 点击 ▶️ 执行按钮

#### 方法 B: 使用命令行

```bash
# 进入项目目录
cd /path/to/AI_FranchTeacher

# 执行 SQL 脚本
psql -U postgres -d ai_franchteacher -f database/init.sql
```

### 步骤 4: 验证表创建

在 pgAdmin 4 中：
1. 展开 `ai_franchteacher` 数据库
2. 展开 `Schemas` → `public` → `Tables`
3. 应该看到以下表：
   - `users` - 用户账户表
   - `user_course_progress` - 课程进度
   - `user_exercises` - 练习记录
   - `user_points` - 积分统计
   - `user_points_history` - 积分历史
   - `user_badges` - 徽章
   - `user_checkins` - 打卡记录
   - `user_mistakes` - 错题本
   - `user_stats` - 学习统计
   - `dialogue_history` - 对话历史
   - `user_sessions` - 会话管理

---

## 后端服务部署

### 步骤 1: 安装依赖

```bash
# 进入认证服务器目录
cd auth-server

# 安装依赖
npm install
```

### 步骤 2: 配置环境变量

复制 `.env.example` 创建 `.env` 文件：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# 服务器配置
PORT=3001
NODE_ENV=development

# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ai_franchteacher
DB_USER=postgres
DB_PASSWORD=你的数据库密码

# JWT配置（重要：请更改为随机字符串！）
JWT_SECRET=请生成一个随机密钥替换这里
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=请生成另一个随机密钥替换这里
REFRESH_TOKEN_EXPIRES_IN=30d

# CORS配置
ALLOWED_ORIGINS=http://localhost:8080,http://127.0.0.1:8080

# 其他配置
BCRYPT_ROUNDS=10
```

#### 生成安全的密钥
```bash
# 在 Node.js 中生成随机密钥
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 步骤 3: 启动认证服务器

```bash
# 开发模式（自动重启）
npm run dev

# 生产模式
npm start
```

成功启动后会看到：
```
===========================================
🚀 认证服务器启动成功
📡 端口: 3001
🌍 环境: development
🔗 健康检查: http://localhost:3001/health
===========================================
✅ 数据库连接成功
```

### 步骤 4: 测试服务器

```bash
# 测试健康检查
curl http://localhost:3001/health

# 测试数据库连接
curl http://localhost:3001/health/db
```

---

## 前端配置

前端代码已经配置完成，无需额外修改。

### 启动前端服务器

```bash
# 在项目根目录
# 如果使用 Live Server (VS Code)
# 右键 index.html → Open with Live Server

# 或使用 Python 简单服务器
python -m http.server 8080

# 或使用 Node.js http-server
npx http-server -p 8080
```

### 访问应用

浏览器打开：http://localhost:8080

首次访问会自动跳转到登录页面。

---

## pgAdmin 4 数据库管理

### 安装 pgAdmin 4

#### Windows
1. 下载：https://www.pgadmin.org/download/pgadmin-4-windows/
2. 运行安装程序

#### macOS
```bash
brew install --cask pgadmin4
```

#### Linux
```bash
# Ubuntu/Debian
sudo apt install pgadmin4
```

### 连接到数据库

1. **启动 pgAdmin 4**
2. **创建服务器连接**：
   - 右键 `Servers` → `Register` → `Server...`
   - **General** 标签：
     - Name: `AI FranchTeacher Local`
   - **Connection** 标签：
     - Host: `localhost`
     - Port: `5432`
     - Database: `ai_franchteacher`
     - Username: `postgres`（或你创建的用户）
     - Password: 你的数据库密码
     - Save password: ✅
3. **点击 Save**

### 常用管理任务

#### 查看用户列表
```sql
SELECT id, username, email, display_name, created_at, last_login
FROM users
ORDER BY created_at DESC;
```

#### 查看用户积分排行榜
```sql
SELECT * FROM leaderboard LIMIT 10;
```

#### 查看用户学习统计
```sql
SELECT
    u.username,
    u.display_name,
    s.total_study_time,
    s.words_learned,
    s.current_streak,
    s.max_streak
FROM users u
LEFT JOIN user_stats s ON u.id = s.user_id
ORDER BY s.total_study_time DESC;
```

#### 重置用户密码
```sql
-- 注意：密码需要使用 bcrypt 哈希
-- 建议通过 API 或应用程序修改密码
UPDATE users
SET password_hash = '$2b$10$new_hash_here'
WHERE username = 'target_username';
```

#### 删除用户（及所有相关数据）
```sql
-- 注意：由于设置了 CASCADE，会自动删除用户的所有关联数据
DELETE FROM users WHERE username = 'target_username';
```

#### 备份数据库
```bash
# 使用 pg_dump
pg_dump -U postgres ai_franchteacher > backup.sql

# 恢复备份
psql -U postgres ai_franchteacher < backup.sql
```

#### 查看数据库大小
```sql
SELECT
    pg_size_pretty(pg_database_size('ai_franchteacher')) as database_size;
```

#### 查看表行数
```sql
SELECT
    schemaname,
    tablename,
    n_live_tup as row_count
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;
```

---

## API 接口文档

### 基础URL
```
http://localhost:3001/api
```

### 认证接口

#### 1. 用户注册
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123",
  "displayName": "John Doe"
}
```

**响应**:
```json
{
  "success": true,
  "message": "注册成功",
  "data": {
    "user": {
      "id": 1,
      "username": "john_doe",
      "email": "john@example.com",
      "displayName": "John Doe",
      "avatar": "🎓"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### 2. 用户登录
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "john_doe",
  "password": "password123"
}
```

#### 3. 刷新令牌
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "your_refresh_token_here"
}
```

#### 4. 登出
```http
POST /api/auth/logout
Authorization: Bearer your_access_token_here
Content-Type: application/json

{
  "refreshToken": "your_refresh_token_here"
}
```

#### 5. 获取当前用户信息
```http
GET /api/auth/me
Authorization: Bearer your_access_token_here
```

### 用户数据接口

所有以下接口都需要在请求头中包含：
```
Authorization: Bearer your_access_token_here
```

#### 课程进度
```http
# 获取所有课程进度
GET /api/user/progress

# 获取特定课程进度
GET /api/user/progress/:courseId

# 保存课程进度
POST /api/user/progress
{
  "courseId": "french_basics_1",
  "progress": {
    "currentLesson": 5,
    "completed": false
  }
}
```

#### 积分系统
```http
# 获取积分
GET /api/user/points

# 添加积分
POST /api/user/points
{
  "points": 10,
  "reason": "完成练习",
  "activityType": "exercise"
}

# 获取积分历史
GET /api/user/points/history?limit=100
```

#### 徽章系统
```http
# 获取徽章
GET /api/user/badges

# 添加徽章
POST /api/user/badges
{
  "badgeId": "first_lesson",
  "badgeName": "初学者",
  "badgeIcon": "🌟"
}
```

#### 打卡系统
```http
# 获取打卡记录
GET /api/user/checkins

# 每日打卡
POST /api/user/checkins
```

#### 学习统计
```http
# 获取统计
GET /api/user/stats

# 更新统计
POST /api/user/stats
{
  "studyTime": 30,
  "wordsLearned": 10,
  "exercisesCompleted": 1
}
```

#### 排行榜
```http
# 获取排行榜
GET /api/user/leaderboard?limit=10
```

---

## 常见问题

### Q1: 数据库连接失败
**错误**: `数据库连接错误: ECONNREFUSED`

**解决方案**:
1. 确认 PostgreSQL 服务正在运行
   ```bash
   # Windows
   服务 → PostgreSQL → 启动

   # macOS
   brew services start postgresql@14

   # Linux
   sudo systemctl start postgresql
   ```
2. 检查 `.env` 中的数据库配置
3. 确认防火墙未阻止 5432 端口

### Q2: 认证服务器启动失败
**错误**: `Error: listen EADDRINUSE :::3001`

**解决方案**:
1. 端口 3001 已被占用
2. 更改 `.env` 中的 `PORT` 值
3. 或关闭占用端口的程序：
   ```bash
   # 查找占用端口的进程
   # Windows
   netstat -ano | findstr :3001

   # macOS/Linux
   lsof -i :3001
   ```

### Q3: CORS 错误
**错误**: `Access-Control-Allow-Origin`

**解决方案**:
1. 确认前端地址在 `.env` 的 `ALLOWED_ORIGINS` 中
2. 格式：`http://localhost:8080,http://127.0.0.1:8080`

### Q4: JWT 令牌过期
**错误**: `令牌已过期`

**解决方案**:
- 前端会自动使用 refresh token 刷新
- 如果 refresh token 也过期，需要重新登录

### Q5: 密码验证失败
**问题**: 无法登录

**检查**:
1. 密码长度至少 6 个字符
2. 用户名/邮箱是否正确
3. 检查数据库中的用户记录

### Q6: 数据迁移失败
**问题**: 本地数据未同步到数据库

**解决方案**:
1. 删除 `localStorage` 中的 `data_migrated` 键
2. 重新登录
3. 检查浏览器控制台的迁移日志

---

## 安全建议

### 生产环境部署

1. **使用 HTTPS**
   - 配置 SSL 证书
   - 使用 Nginx 或 Apache 反向代理

2. **环境变量保护**
   - 不要提交 `.env` 到 Git
   - 使用环境变量管理服务（如 dotenv-vault）

3. **数据库安全**
   - 使用强密码
   - 限制数据库远程访问
   - 定期备份数据

4. **JWT 密钥**
   - 使用长且随机的密钥
   - 定期轮换密钥

5. **速率限制**
   - 已内置基本速率限制
   - 生产环境考虑使用 Redis

---

## 技术支持

如有问题，请查看：
- 浏览器控制台日志
- 认证服务器终端日志
- PostgreSQL 日志

需要帮助请联系开发团队。

---

**文档版本**: 1.0
**最后更新**: 2024-01-17
