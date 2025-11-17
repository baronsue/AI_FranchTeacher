# AI FranchTeacher 完整部署指南

## 📖 目录
- [系统要求](#系统要求)
- [安装前准备](#安装前准备)
- [数据库安装与配置](#数据库安装与配置)
- [后端服务部署](#后端服务部署)
- [前端部署](#前端部署)
- [启动系统](#启动系统)
- [功能测试](#功能测试)
- [常见问题解决](#常见问题解决)
- [性能优化](#性能优化)
- [生产环境部署](#生产环境部署)

---

## 系统要求

### 硬件要求
- **CPU**: 双核或以上
- **内存**: 至少 4GB RAM
- **硬盘**: 至少 2GB 可用空间

### 软件要求

| 软件 | 最低版本 | 推荐版本 | 说明 |
|------|---------|---------|------|
| Node.js | 16.x | 18.x 或 20.x | JavaScript 运行环境 |
| PostgreSQL | 14.x | 15.x 或 16.x | 数据库系统 |
| pgAdmin 4 | 6.x | 最新版本 | 数据库管理工具 |
| npm | 8.x | 最新版本 | 包管理器 |
| Python | 3.8+ | 3.11+ | 用于运行简单HTTP服务器（可选） |

### 端口占用情况

**重要：确保以下端口未被占用**

```
┌─────────────────┬──────┬──────────────────────┐
│ 服务            │ 端口 │ 用途                  │
├─────────────────┼──────┼──────────────────────┤
│ 前端Web应用     │ 8080 │ 用户访问界面          │
│ Qwen AI代理     │ 3001 │ AI对话服务（可选）    │
│ 认证服务器      │ 3002 │ 用户认证和数据管理    │
│ PostgreSQL      │ 5432 │ 数据库服务            │
└─────────────────┴──────┴──────────────────────┘
```

**检查端口占用**：
```bash
# Windows
netstat -ano | findstr "8080"
netstat -ano | findstr "3001"
netstat -ano | findstr "3002"
netstat -ano | findstr "5432"

# macOS/Linux
lsof -i :8080
lsof -i :3001
lsof -i :3002
lsof -i :5432
```

---

## 安装前准备

### 1. 安装 Node.js

#### Windows
1. 访问 https://nodejs.org/
2. 下载 LTS 版本安装包
3. 运行安装程序，勾选 "Add to PATH"
4. 验证安装：
   ```cmd
   node --version
   npm --version
   ```

#### macOS
```bash
# 使用 Homebrew
brew install node@18

# 验证安装
node --version
npm --version
```

#### Linux (Ubuntu/Debian)
```bash
# 添加 NodeSource 仓库
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# 安装 Node.js
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version
```

### 2. 安装 PostgreSQL

#### Windows
1. 下载：https://www.postgresql.org/download/windows/
2. 运行安装程序
3. **重要**：记住设置的密码（默认用户是 postgres）
4. 默认端口：5432
5. 安装完成后，PostgreSQL 服务会自动启动

**验证安装**：
```cmd
# 打开命令提示符
psql --version

# 连接测试
psql -U postgres
# 输入密码
```

#### macOS
```bash
# 使用 Homebrew
brew install postgresql@14

# 启动服务
brew services start postgresql@14

# 验证安装
psql --version

# 连接测试
psql postgres
```

#### Linux (Ubuntu/Debian)
```bash
# 安装
sudo apt update
sudo apt install postgresql postgresql-contrib

# 启动服务
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 验证安装
psql --version

# 切换到 postgres 用户
sudo -u postgres psql
```

### 3. 安装 pgAdmin 4

#### Windows
1. 下载：https://www.pgadmin.org/download/pgadmin-4-windows/
2. 运行安装程序
3. 首次打开时设置主密码

#### macOS
```bash
brew install --cask pgadmin4
```

#### Linux (Ubuntu/Debian)
```bash
# 添加仓库
curl -fsS https://www.pgadmin.org/static/packages_pgadmin_org.pub | sudo gpg --dearmor -o /usr/share/keyrings/packages-pgadmin-org.gpg

sudo sh -c 'echo "deb [signed-by=/usr/share/keyrings/packages-pgadmin-org.gpg] https://ftp.postgresql.org/pub/pgadmin/pgadmin4/apt/$(lsb_release -cs) pgadmin4 main" > /etc/apt/sources.list.d/pgadmin4.list'

# 安装
sudo apt update
sudo apt install pgadmin4

# 配置 Web 模式
sudo /usr/pgadmin4/bin/setup-web.sh
```

### 4. 克隆项目

```bash
# 克隆仓库
git clone https://github.com/baronsue/AI_FranchTeacher.git
cd AI_FranchTeacher

# 查看项目结构
ls -la
```

---

## 数据库安装与配置

### 步骤 1: 启动 pgAdmin 4

1. 打开 pgAdmin 4
2. 输入主密码（首次设置的密码）

### 步骤 2: 连接到 PostgreSQL 服务器

1. 左侧面板，右键点击 **Servers**
2. 选择 **Register** → **Server...**
3. 填写连接信息：

**General 标签**：
```
Name: AI FranchTeacher Local
```

**Connection 标签**：
```
Host name/address: localhost
Port: 5432
Maintenance database: postgres
Username: postgres
Password: [你安装时设置的密码]
Save password: ✅ 勾选
```

4. 点击 **Save**

**常见问题**：
- ❌ **无法连接**：检查 PostgreSQL 服务是否运行
  ```bash
  # Windows
  服务管理器 → PostgreSQL → 启动

  # macOS
  brew services start postgresql@14

  # Linux
  sudo systemctl start postgresql
  ```

### 步骤 3: 创建数据库

**方法 A：使用 pgAdmin 4（推荐）**

1. 展开左侧的服务器连接
2. 右键点击 **Databases**
3. 选择 **Create** → **Database...**
4. 填写：
   ```
   Database: ai_franchteacher
   Owner: postgres
   ```
5. 点击 **Save**

**方法 B：使用 SQL 命令**

1. 右键点击服务器 → **Query Tool**
2. 执行：
   ```sql
   CREATE DATABASE ai_franchteacher;
   ```

### 步骤 4: 初始化数据库表

1. 右键点击 `ai_franchteacher` 数据库
2. 选择 **Query Tool**
3. 菜单栏：**File** → **Open**
4. 选择项目中的 `database/init.sql`
5. 点击 ▶️ **Execute/Refresh** 按钮
6. 查看 **Messages** 标签，确认无错误

**预期输出**：
```
CREATE TABLE
CREATE INDEX
CREATE TABLE
...
Query returned successfully in XXX msec.
```

### 步骤 5: 验证表创建

1. 展开 `ai_franchteacher` 数据库
2. 展开 **Schemas** → **public** → **Tables**
3. 应该看到 11 个表：
   ```
   ✓ users
   ✓ user_course_progress
   ✓ user_exercises
   ✓ user_points
   ✓ user_points_history
   ✓ user_badges
   ✓ user_checkins
   ✓ user_mistakes
   ✓ user_stats
   ✓ dialogue_history
   ✓ user_sessions
   ```

**验证查询**：
```sql
-- 查看所有表
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- 查看用户表结构
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users';
```

---

## 后端服务部署

### 认证服务器（端口 3002）

#### 步骤 1: 安装依赖

```bash
# 进入认证服务器目录
cd auth-server

# 安装 Node.js 依赖
npm install
```

**可能的问题**：
```
❌ npm ERR! code EACCES
解决：使用管理员权限或检查文件夹权限

❌ npm WARN deprecated
说明：某些包已过时，可以忽略警告
```

#### 步骤 2: 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# Windows
copy .env.example .env
```

**编辑 .env 文件**：

```bash
# Windows
notepad .env

# macOS
open .env

# Linux
nano .env
```

**必须修改的配置**：

```env
# 服务器配置
PORT=3002
NODE_ENV=development

# 数据库配置（重要！）
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ai_franchteacher
DB_USER=postgres
DB_PASSWORD=你的PostgreSQL密码  # ← 改为实际密码

# JWT配置（重要！生成随机密钥）
JWT_SECRET=生成的64字符随机密钥  # ← 必须更改
REFRESH_TOKEN_SECRET=生成的64字符随机密钥  # ← 必须更改
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_IN=30d

# CORS配置
ALLOWED_ORIGINS=http://localhost:8080,http://127.0.0.1:8080

# 其他配置
BCRYPT_ROUNDS=10
MAX_LOGIN_ATTEMPTS=5
LOCK_TIME=15
```

**生成安全的 JWT 密钥**：

```bash
# 方法 1: 使用 Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# 方法 2: 使用在线工具
# 访问 https://www.random.org/strings/

# 方法 3: 使用 OpenSSL
openssl rand -hex 64
```

复制生成的密钥，分别填入 `JWT_SECRET` 和 `REFRESH_TOKEN_SECRET`。

#### 步骤 3: 测试数据库连接

```bash
# 创建测试脚本
node -e "
const { Pool } = require('pg');
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'ai_franchteacher',
  user: 'postgres',
  password: '你的密码'  // 替换为实际密码
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ 数据库连接失败:', err.message);
  } else {
    console.log('✅ 数据库连接成功:', res.rows[0].now);
  }
  pool.end();
});
"
```

#### 步骤 4: 启动认证服务器

```bash
# 开发模式（自动重启）
npm run dev

# 或生产模式
npm start
```

**成功输出**：
```
===========================================
🚀 认证服务器启动成功
📡 端口: 3002
🌍 环境: development
🔗 健康检查: http://localhost:3002/health
===========================================
✅ 数据库连接成功
```

**常见错误**：

1. **端口被占用**：
   ```
   Error: listen EADDRINUSE :::3002
   ```
   解决：
   ```bash
   # 查找占用进程
   # Windows
   netstat -ano | findstr :3002
   taskkill /PID <进程ID> /F

   # macOS/Linux
   lsof -ti:3002 | xargs kill -9
   ```

2. **数据库连接失败**：
   ```
   Error: connect ECONNREFUSED 127.0.0.1:5432
   ```
   解决：
   - 检查 PostgreSQL 是否运行
   - 检查 `.env` 中的密码是否正确
   - 检查防火墙设置

3. **Missing environment variables**：
   ```
   Error: Missing QWEN_API_KEY environment variable
   ```
   说明：这是正常的，认证服务器不需要 QWEN_API_KEY

#### 步骤 5: 测试 API 接口

**测试健康检查**：
```bash
curl http://localhost:3002/health
```

预期响应：
```json
{
  "status": "ok",
  "timestamp": "2024-01-17T10:30:00.000Z",
  "uptime": 12.345
}
```

**测试数据库连接**：
```bash
curl http://localhost:3002/health/db
```

预期响应：
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2024-01-17T10:30:00.000Z"
}
```

### Qwen AI 代理（端口 3001）- 可选

#### 步骤 1: 配置代理服务器

```bash
# 进入代理目录
cd ../proxy

# 安装依赖
npm install

# 复制环境变量
cp .env.example .env
```

**编辑 .env**：
```env
PORT=3001
QWEN_API_KEY=你的通义千问API密钥
ALLOWED_ORIGINS=http://localhost:8080,http://127.0.0.1:8080
```

**获取 Qwen API Key**：
1. 访问 https://dashscope.console.aliyun.com/
2. 注册/登录阿里云账号
3. 开通 DashScope 服务
4. 创建 API Key

#### 步骤 2: 启动代理服务器

```bash
npm run dev
```

**成功输出**：
```
[Qwen Proxy] Server is running on http://localhost:3001
[Qwen Proxy] Allowed origins: http://localhost:8080, http://127.0.0.1:8080
```

---

## 前端部署

### 步骤 1: 返回项目根目录

```bash
cd ..
# 现在应该在 AI_FranchTeacher 目录
```

### 步骤 2: 检查前端配置

前端配置已经预先设置好，无需修改。但可以验证：

**检查 `services/auth_service.js`**：
```javascript
const API_BASE_URL = 'http://localhost:3002/api';  // 应该是 3002
```

**检查 `services/qwen_service.js`**：
```javascript
this.proxyUrl = 'http://localhost:3001/qwen';  // 应该是 3001
```

### 步骤 3: 启动前端服务器

**方法 A: 使用 Python（推荐）**

```bash
# Python 3
python -m http.server 8080

# 或 Python 2
python -m SimpleHTTPServer 8080
```

**方法 B: 使用 Node.js http-server**

```bash
# 全局安装
npm install -g http-server

# 启动
http-server -p 8080
```

**方法 C: 使用 Live Server（VS Code）**

1. 安装 VS Code 扩展 "Live Server"
2. 右键点击 `index.html`
3. 选择 "Open with Live Server"

**成功输出**：
```
Serving HTTP on 0.0.0.0 port 8080 (http://0.0.0.0:8080/) ...
```

---

## 启动系统

### 完整启动流程

**按照以下顺序启动所有服务**：

```bash
# 终端 1: 启动 PostgreSQL（通常已自动启动）
# Windows: 检查服务管理器
# macOS: brew services start postgresql@14
# Linux: sudo systemctl start postgresql

# 终端 2: 启动认证服务器
cd auth-server
npm run dev
# 等待看到 "✅ 数据库连接成功"

# 终端 3: 启动 Qwen 代理（可选）
cd proxy
npm run dev

# 终端 4: 启动前端
cd ..
python -m http.server 8080
```

### 访问应用

1. 打开浏览器
2. 访问：http://localhost:8080
3. 应该自动跳转到登录页：http://localhost:8080/#/login

---

## 功能测试

### 1. 测试用户注册

1. 访问 http://localhost:8080
2. 点击「还没有账户？立即注册」
3. 填写表单：
   ```
   显示名称: 测试用户
   用户名: testuser
   邮箱: test@example.com
   密码: test123456
   确认密码: test123456
   ```
4. 点击「注册」
5. **预期结果**：
   - ✅ 显示 "注册成功"
   - ✅ 自动登录
   - ✅ 跳转到 dashboard
   - ✅ Header 显示用户名

**验证数据库**：
```sql
-- 在 pgAdmin 中执行
SELECT id, username, email, display_name, created_at
FROM users
WHERE username = 'testuser';
```

### 2. 测试用户登录

1. 点击登出按钮
2. 应该跳转回登录页
3. 输入：
   ```
   用户名: testuser
   密码: test123456
   ```
4. 点击「登录」
5. **预期结果**：
   - ✅ 登录成功
   - ✅ 跳转到 dashboard
   - ✅ Header 显示用户信息

### 3. 测试路由保护

1. 登出账户
2. 手动访问：http://localhost:8080/#/dashboard
3. **预期结果**：
   - ✅ 自动跳转到登录页

### 4. 测试数据持久化

1. 登录账户
2. 完成一些学习活动（如果有）
3. 刷新页面
4. **预期结果**：
   - ✅ 仍然保持登录状态
   - ✅ 学习数据保持不变

### 5. 测试积分系统

在浏览器控制台执行：
```javascript
// 测试添加积分
const response = await fetch('http://localhost:3002/api/user/points', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
  },
  body: JSON.stringify({
    points: 10,
    reason: '测试积分',
    activityType: 'test'
  })
});

const result = await response.json();
console.log(result);
```

**验证数据库**：
```sql
SELECT * FROM user_points WHERE user_id = 1;
SELECT * FROM user_points_history WHERE user_id = 1;
```

---

## 常见问题解决

### 前端问题

#### 1. 页面空白，控制台显示 CORS 错误

**错误信息**：
```
Access to fetch at 'http://localhost:3002/api/auth/login' from origin 'http://localhost:8080' has been blocked by CORS policy
```

**解决方案**：
1. 检查认证服务器的 `.env` 文件：
   ```env
   ALLOWED_ORIGINS=http://localhost:8080,http://127.0.0.1:8080
   ```
2. 确保没有多余空格
3. 重启认证服务器

#### 2. 无法登录，显示"网络错误"

**问题**：认证服务器未启动

**解决方案**：
```bash
cd auth-server
npm run dev
```

#### 3. 登录后立即跳转回登录页

**问题**：JWT 令牌无效或配置错误

**检查**：
1. 浏览器控制台查看错误
2. 检查 `.env` 中的 `JWT_SECRET`
3. 清除 localStorage：
   ```javascript
   localStorage.clear();
   ```
4. 重新登录

#### 4. Header 不显示用户信息

**问题**：localStorage 中无用户数据

**解决**：
```javascript
// 浏览器控制台
console.log(localStorage.getItem('user'));
console.log(localStorage.getItem('access_token'));

// 如果为 null，重新登录
```

### 后端问题

#### 1. 认证服务器无法启动

**错误 A: 端口占用**
```
Error: listen EADDRINUSE :::3002
```
解决：
```bash
# 查找并关闭占用进程
# Windows
netstat -ano | findstr :3002
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3002 | xargs kill -9

# 或更改端口
# 修改 .env: PORT=3003
# 修改 services/auth_service.js: API_BASE_URL
```

**错误 B: 数据库连接失败**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
解决：
1. 启动 PostgreSQL
2. 检查 `.env` 密码
3. 测试连接：
   ```bash
   psql -U postgres -d ai_franchteacher
   ```

**错误 C: Missing dependencies**
```
Error: Cannot find module 'express'
```
解决：
```bash
cd auth-server
rm -rf node_modules
npm install
```

#### 2. 数据库查询错误

**错误**：
```
error: relation "users" does not exist
```

**解决**：
1. 重新执行初始化脚本：
   ```sql
   -- 在 pgAdmin Query Tool 中
   DROP DATABASE IF EXISTS ai_franchteacher;
   CREATE DATABASE ai_franchteacher;
   -- 然后执行 database/init.sql
   ```

#### 3. JWT 令牌验证失败

**错误**：
```
JsonWebTokenError: invalid signature
```

**原因**：JWT_SECRET 不匹配或被更改

**解决**：
1. 确保 `.env` 中的密钥未更改
2. 清除所有用户的 localStorage
3. 重新登录

### 数据库问题

#### 1. pgAdmin 无法连接

**错误**：
```
could not connect to server: Connection refused
```

**解决**：
1. 检查 PostgreSQL 服务：
   ```bash
   # Windows
   服务 → PostgreSQL → 启动

   # macOS
   brew services list
   brew services start postgresql@14

   # Linux
   sudo systemctl status postgresql
   sudo systemctl start postgresql
   ```

2. 检查端口：
   ```bash
   # macOS/Linux
   sudo lsof -i :5432

   # Windows
   netstat -ano | findstr :5432
   ```

3. 检查防火墙设置

#### 2. 权限错误

**错误**：
```
permission denied for table users
```

**解决**：
```sql
-- 授予权限
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
```

#### 3. 数据库已存在

**错误**：
```
ERROR: database "ai_franchteacher" already exists
```

**解决**：
```sql
-- 删除并重新创建
DROP DATABASE ai_franchteacher;
CREATE DATABASE ai_franchteacher;
-- 然后执行 init.sql
```

---

## 性能优化

### 1. 数据库优化

**创建索引**（已在 init.sql 中）：
```sql
-- 检查现有索引
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

**定期清理**：
```sql
-- 清理和分析
VACUUM ANALYZE;

-- 重建索引
REINDEX DATABASE ai_franchteacher;
```

### 2. 连接池配置

编辑 `auth-server/config/database.js`：
```javascript
const pool = new Pool({
    // ... 其他配置
    max: 20,  // 最大连接数（根据负载调整）
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});
```

### 3. 缓存策略

**前端缓存**：
在 `index.html` 中添加：
```html
<meta http-equiv="Cache-Control" content="max-age=3600">
```

**API 响应缓存**：
考虑使用 Redis 缓存常用查询结果。

---

## 生产环境部署

### 1. 环境变量配置

**生产环境 .env**：
```env
PORT=3002
NODE_ENV=production

DB_HOST=your-production-db-host
DB_PORT=5432
DB_NAME=ai_franchteacher
DB_USER=your-db-user
DB_PASSWORD=your-secure-password

JWT_SECRET=your-production-jwt-secret-64-chars
REFRESH_TOKEN_SECRET=your-production-refresh-secret-64-chars
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_IN=30d

ALLOWED_ORIGINS=https://yourdomain.com

BCRYPT_ROUNDS=12  # 提高安全性
```

### 2. 使用 PM2 管理进程

```bash
# 安装 PM2
npm install -g pm2

# 启动认证服务器
cd auth-server
pm2 start server.js --name "auth-server"

# 启动 Qwen 代理
cd ../proxy
pm2 start server.js --name "qwen-proxy"

# 查看状态
pm2 status

# 查看日志
pm2 logs

# 开机自启
pm2 startup
pm2 save
```

### 3. 使用 Nginx 反向代理

**安装 Nginx**：
```bash
# Ubuntu/Debian
sudo apt install nginx

# macOS
brew install nginx
```

**配置文件** (`/etc/nginx/sites-available/ai-franchteacher`):
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # 前端
    location / {
        root /var/www/ai-franchteacher;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # 认证API
    location /api/ {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Qwen 代理
    location /qwen {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

**启用配置**：
```bash
sudo ln -s /etc/nginx/sites-available/ai-franchteacher /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. 配置 SSL/HTTPS

使用 Let's Encrypt：
```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d yourdomain.com

# 自动续期
sudo certbot renew --dry-run
```

### 5. 数据库备份

**自动备份脚本**：
```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/var/backups/postgresql"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/ai_franchteacher_$TIMESTAMP.sql"

mkdir -p $BACKUP_DIR

pg_dump -U postgres ai_franchteacher > $BACKUP_FILE

# 压缩
gzip $BACKUP_FILE

# 删除30天前的备份
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "备份完成: ${BACKUP_FILE}.gz"
```

**添加到 crontab**：
```bash
# 编辑 crontab
crontab -e

# 每天凌晨2点备份
0 2 * * * /path/to/backup.sh
```

### 6. 监控和日志

**PM2 监控**：
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

**数据库监控**：
```sql
-- 查看活动连接
SELECT * FROM pg_stat_activity;

-- 查看数据库大小
SELECT pg_size_pretty(pg_database_size('ai_franchteacher'));

-- 查看表大小
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## 安全检查清单

- [ ] ✅ `.env` 文件已添加到 `.gitignore`
- [ ] ✅ JWT 密钥使用随机生成的强密钥
- [ ] ✅ 数据库密码使用强密码
- [ ] ✅ PostgreSQL 不允许远程连接（生产环境）
- [ ] ✅ CORS 只允许可信域名
- [ ] ✅ 启用 HTTPS（生产环境）
- [ ] ✅ 定期备份数据库
- [ ] ✅ 使用 PM2 或类似工具管理进程
- [ ] ✅ 配置防火墙规则
- [ ] ✅ 定期更新依赖包

---

## 故障排查命令

**快速诊断**：
```bash
# 检查所有服务
echo "=== PostgreSQL ==="
psql --version
sudo systemctl status postgresql || brew services list | grep postgresql

echo "=== Node.js ==="
node --version
npm --version

echo "=== 端口检查 ==="
lsof -i :8080
lsof -i :3001
lsof -i :3002
lsof -i :5432

echo "=== 进程检查 ==="
ps aux | grep node
ps aux | grep postgres

echo "=== 磁盘空间 ==="
df -h

echo "=== 内存使用 ==="
free -h
```

**日志查看**：
```bash
# PM2 日志
pm2 logs auth-server --lines 50

# PostgreSQL 日志
# macOS
tail -f /usr/local/var/log/postgres.log

# Linux
sudo tail -f /var/log/postgresql/postgresql-14-main.log

# Nginx 日志
sudo tail -f /var/log/nginx/error.log
```

---

## 获取帮助

### 官方资源
- PostgreSQL 文档: https://www.postgresql.org/docs/
- Node.js 文档: https://nodejs.org/docs/
- Express 文档: https://expressjs.com/

### 项目文档
- 完整 API 文档: `docs/AUTH_SETUP_GUIDE.md`
- 快速开始: `README_AUTH.md`

### 社区支持
- GitHub Issues: https://github.com/baronsue/AI_FranchTeacher/issues
- Stack Overflow: 标签 `postgresql`, `express`, `jwt`

---

**部署完成！** 🎉

如有任何问题，请查看本文档的常见问题部分或提交 Issue。
