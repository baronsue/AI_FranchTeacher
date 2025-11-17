# AI FranchTeacher - 用户认证系统快速开始

## 🚀 快速开始（5分钟部署）

### 前提条件
- ✅ 已安装 PostgreSQL
- ✅ 已安装 Node.js
- ✅ 已安装 pgAdmin 4

### 第一步：设置数据库

1. **打开 pgAdmin 4**

2. **创建数据库**：
   - 右键 `Databases` → `Create` → `Database...`
   - 名称：`ai_franchteacher`
   - 点击 `Save`

3. **执行初始化脚本**：
   - 右键 `ai_franchteacher` → `Query Tool`
   - 菜单：`File` → `Open` → 选择 `database/init.sql`
   - 点击 ▶️ 执行

4. **验证表创建**：
   - 展开 `ai_franchteacher` → `Schemas` → `public` → `Tables`
   - 应该看到 11 个表

### 第二步：配置后端服务

```bash
# 1. 进入认证服务器目录
cd auth-server

# 2. 安装依赖
npm install

# 3. 复制环境变量文件
cp .env.example .env

# 4. 编辑 .env 文件
# Windows: notepad .env
# macOS: open .env
# Linux: nano .env
```

**必须修改的配置**：
```env
DB_PASSWORD=你的PostgreSQL密码

# 生成随机密钥（重要！）
JWT_SECRET=运行命令生成: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
REFRESH_TOKEN_SECRET=运行命令生成: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 第三步：启动服务

```bash
# 启动认证服务器（在 auth-server 目录）
npm run dev

# 成功后会显示：
# 🚀 认证服务器启动成功
# 📡 端口: 3001
```

### 第四步：启动前端

```bash
# 返回项目根目录
cd ..

# 使用 Python (推荐)
python -m http.server 8080

# 或使用 Node.js
npx http-server -p 8080
```

### 第五步：访问应用

浏览器打开：**http://localhost:8080**

1. 点击「还没有账户？立即注册」
2. 填写注册信息
3. 注册成功后自动登录
4. 开始学习！

---

## 📚 重要文档

- **完整部署指南**：`docs/AUTH_SETUP_GUIDE.md`
- **API 接口文档**：见 `docs/AUTH_SETUP_GUIDE.md` 的 API 部分
- **数据库架构**：`database/init.sql`

---

## 🔧 常用操作

### 查看用户列表（pgAdmin 4）
```sql
SELECT username, email, display_name, created_at
FROM users
ORDER BY created_at DESC;
```

### 查看积分排行榜
```sql
SELECT * FROM leaderboard LIMIT 10;
```

### 备份数据库
```bash
pg_dump -U postgres ai_franchteacher > backup_$(date +%Y%m%d).sql
```

### 重启认证服务器
```bash
# Ctrl+C 停止服务器
# 然后重新启动
npm run dev
```

---

## ❓ 遇到问题？

### 1. 数据库连接失败
- 检查 PostgreSQL 是否运行
- 检查 `.env` 中的密码是否正确

### 2. 端口被占用
- 修改 `.env` 中的 `PORT`
- 或关闭占用端口的程序

### 3. 无法登录
- 检查认证服务器是否运行
- 查看浏览器控制台错误信息
- 确认用户名/密码正确

### 4. CORS 错误
- 确认 `.env` 中的 `ALLOWED_ORIGINS` 包含前端地址
- 格式：`http://localhost:8080`

---

## 📊 系统架构

```
┌─────────────────┐
│   浏览器前端     │
│  (Port 8080)    │
└────────┬────────┘
         │ HTTP
         ↓
┌─────────────────┐
│  认证服务器      │
│  (Port 3001)    │
└────────┬────────┘
         │ SQL
         ↓
┌─────────────────┐
│  PostgreSQL     │
│  (Port 5432)    │
└─────────────────┘
```

---

## 🎯 核心功能

✅ 用户注册/登录
✅ JWT 令牌认证
✅ 自动刷新令牌
✅ 学习进度云端存储
✅ 积分和徽章系统
✅ 打卡记录
✅ 错题本
✅ 排行榜
✅ 本地数据自动迁移

---

## 📝 下一步

1. 修改用户头像（在注册时选择 emoji）
2. 完成第一课，获得徽章
3. 每天打卡，保持连续学习
4. 查看排行榜，与其他学习者竞争

**祝学习愉快！** 🎓

---

**需要详细文档？** 查看 `docs/AUTH_SETUP_GUIDE.md`
