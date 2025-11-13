# 用户认证系统完整指南

本指南介绍 AI FranchTeacher 完整的用户认证系统，包括前端UI、后端API和数据库。

## 系统架构

```
Frontend (GitHub Pages)
    ↓ HTTPS
API Server (Render)
    ↓ PostgreSQL
Database (Render PostgreSQL)
```

## 功能特性

### ✅ 已实现功能

**用户认证**
- ✅ 用户注册（邮箱 + 用户名 + 密码）
- ✅ 用户登录（邮箱或用户名）
- ✅ JWT Token 认证
- ✅ 密码加密（bcrypt, 10轮）
- ✅ 登出功能
- ✅ Token 自动刷新
- ✅ 未授权自动跳转登录

**用户资料**
- ✅ 显示名称
- ✅ 头像（URL）
- ✅ 资料更新
- ✅ 密码修改

**学习数据管理**
- ✅ 课程进度同步
- ✅ 积分系统
- ✅ 徽章成就
- ✅ 学习统计
- ✅ 每日打卡
- ✅ 错题本
- ✅ AI对话历史

**安全特性**
- ✅ HTTPS 连接
- ✅ CORS 保护
- ✅ 速率限制
- ✅ SQL 注入防护
- ✅ XSS 防护（Helmet）

### ⏳ 计划中功能

- ⏳ 邮箱验证
- ⏳ 密码重置（邮件）
- ⏳ 社交登录（Google, GitHub）
- ⏳ 双因素认证（2FA）
- ⏳ OAuth2 集成

---

## 快速开始

### 1. 数据库设置

参考 [server/DATABASE_SETUP.md](./server/DATABASE_SETUP.md) 完成 PostgreSQL 数据库设置。

**本地开发**:
```bash
# 创建数据库
createdb french_teacher

# 执行schema
psql -U postgres -d french_teacher -f database/schema.sql
```

**Render 生产环境**:
1. 在 Render Dashboard 创建 PostgreSQL 数据库
2. 使用 PgAdmin 连接并执行 `database/schema.sql`

### 2. 启动后端服务器

```bash
cd server
npm install
cp .env.example .env
# 编辑 .env 配置数据库连接和JWT密钥
npm start
```

服务器启动在 `http://localhost:3001`

### 3. 配置前端

编辑 `services/auth_service.js` 第 6-8 行:

```javascript
const API_BASE_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:3001/api'
    : 'https://your-api.onrender.com/api'; // 替换为你的 Render API URL
```

### 4. 测试认证流程

1. 打开应用 `http://localhost:5500` (使用 Live Server)
2. 点击右上角"注册"按钮
3. 填写注册表单
4. 登录成功后，用户信息显示在右上角
5. 点击用户头像查看下拉菜单

---

## 前端实现

### 文件结构

```
/services/
  auth_service.js          # 认证API服务
/components/
  auth_modal.js            # 登录/注册模态框
  header.js                # 导航栏（含用户菜单）
```

### 认证服务 API

**`services/auth_service.js`**

提供所有认证相关的 API 调用：

```javascript
import { login, register, logout, isLoggedIn, getCurrentUser } from './services/auth_service.js';

// 注册
const result = await register(email, username, password, displayName);

// 登录
const result = await login(email, password);

// 检查登录状态
if (isLoggedIn()) {
    const user = getCurrentUser();
    console.log('当前用户:', user);
}

// 登出
logout();
```

**完整 API 列表**:
- `register(email, username, password, displayName)` - 用户注册
- `login(email, password)` - 用户登录
- `logout()` - 用户登出
- `isLoggedIn()` - 检查登录状态
- `getCurrentUser()` - 获取当前用户信息
- `fetchCurrentUser()` - 从服务器刷新用户信息
- `updateProfile(displayName, avatarUrl)` - 更新资料
- `changePassword(currentPassword, newPassword)` - 修改密码
- `progressAPI` - 课程进度API
- `pointsAPI` - 积分API
- `badgesAPI` - 徽章API
- `statsAPI` - 统计API
- `mistakesAPI` - 错题本API
- `dialogueAPI` - 对话历史API

### 登录/注册模态框

**`components/auth_modal.js`**

```javascript
import { showLoginModal, showRegisterModal } from './components/auth_modal.js';

// 显示登录模态框
showLoginModal();

// 显示注册模态框
showRegisterModal();
```

**特性**:
- 响应式设计
- 实时表单验证
- 密码可见性切换
- 错误/成功消息提示
- 登录/注册模式切换
- ESC 键关闭
- 点击背景关闭

### 认证事件

监听认证状态变化：

```javascript
// 登录成功
window.addEventListener('auth:login', (event) => {
    const user = event.detail;
    console.log('用户已登录:', user);
});

// 登出
window.addEventListener('auth:logout', () => {
    console.log('用户已登出');
});

// 未授权（token过期或无效）
window.addEventListener('auth:unauthorized', () => {
    console.log('需要重新登录');
    showLoginModal();
});

// 资料更新
window.addEventListener('auth:profileUpdate', (event) => {
    const user = event.detail;
    console.log('资料已更新:', user);
});
```

---

## 后端实现

### 文件结构

```
server/
├── server.js                 # Express 应用入口
├── config/
│   └── database.js          # PostgreSQL 连接池
├── middleware/
│   └── auth.js              # JWT 认证中间件
├── controllers/
│   ├── authController.js    # 认证控制器
│   ├── progressController.js
│   ├── pointsController.js
│   ├── badgesController.js
│   ├── statsController.js
│   ├── mistakesController.js
│   └── dialogueController.js
└── routes/
    ├── authRoutes.js        # 认证路由
    └── ...
```

### API 端点

完整 API 文档: [server/API_DOCUMENTATION.md](./server/API_DOCUMENTATION.md)

**认证端点**:
```
POST   /api/auth/register     # 注册
POST   /api/auth/login        # 登录
GET    /api/auth/me           # 获取当前用户
PUT    /api/auth/profile      # 更新资料
PUT    /api/auth/password     # 修改密码
```

**需要认证的端点** (需要 `Authorization: Bearer <token>` header):
```
GET/PUT  /api/progress/:courseId
GET/POST /api/points
GET/POST /api/badges
GET/PUT  /api/stats
POST     /api/stats/checkin
GET/POST /api/mistakes
GET/POST /api/dialogue
```

### 中间件使用

**`verifyToken` - 验证JWT**:
```javascript
import { verifyToken } from '../middleware/auth.js';

router.get('/protected', verifyToken, (req, res) => {
    const userId = req.user.id; // 从token解析的用户ID
    res.json({ message: `你好, 用户 ${userId}` });
});
```

**`optionalAuth` - 可选认证**:
```javascript
import { optionalAuth } from '../middleware/auth.js';

router.get('/content', optionalAuth, (req, res) => {
    if (req.user) {
        // 已登录用户
        return res.json({ content: '个性化内容' });
    }
    // 未登录用户
    res.json({ content: '公开内容' });
});
```

---

## 数据库架构

### 9个核心表

参考 [database/schema.sql](./database/schema.sql)

1. **users** - 用户账号
   - id, email, username, password_hash, display_name, avatar_url
   - 约束: email UNIQUE, username UNIQUE

2. **user_progress** - 课程进度
   - user_id, course_id, completed, score, time_spent
   - 外键: user_id → users(id)

3. **user_points** - 积分
   - user_id, total_points, daily_points
   - 外键: user_id → users(id)

4. **points_history** - 积分历史
   - user_id, amount, reason, created_at

5. **user_badges** - 徽章
   - user_id, badge_id, earned_at

6. **user_checkins** - 打卡记录
   - user_id, checkin_date

7. **user_mistakes** - 错题本
   - user_id, question_id, wrong_count, reviewed

8. **user_stats** - 学习统计
   - user_id, courses_completed, current_streak, total_study_time

9. **dialogue_history** - 对话历史
   - user_id, user_message, ai_response, created_at

---

## 部署指南

### Render 部署步骤

#### 1. 部署 PostgreSQL 数据库

1. Render Dashboard → **New PostgreSQL**
2. 配置:
   - Name: `french-teacher-db`
   - Database: `french_teacher`
   - Region: `Oregon (US West)`
   - Plan: `Free`
3. 创建后，复制 **Internal Database URL**

#### 2. 初始化数据库

使用 PgAdmin 4 连接到 Render 数据库:
1. 使用 **External Database URL** 连接
2. 打开 Query Tool
3. 执行 `database/schema.sql`

#### 3. 部署 API 服务器

1. Render Dashboard → **New Web Service**
2. 连接 GitHub 仓库
3. 配置:
   - Name: `french-teacher-api`
   - Runtime: `Node`
   - Build Command: `cd server && npm ci`
   - Start Command: `cd server && npm start`
   - Plan: `Free`

4. 环境变量:
   ```
   DATABASE_URL=<从数据库复制 Internal URL>
   JWT_SECRET=<使用 crypto 生成随机字符串>
   NODE_ENV=production
   ALLOWED_ORIGINS=https://baronsue.github.io,https://your-custom-domain.com
   PORT=3001
   ```

   生成 JWT_SECRET:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

5. 部署完成后，复制 API URL (例如 `https://french-teacher-api.onrender.com`)

#### 4. 更新前端配置

编辑 `services/auth_service.js`:
```javascript
const API_BASE_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:3001/api'
    : 'https://french-teacher-api.onrender.com/api'; // ← 更新这里
```

提交并推送到 GitHub，GitHub Pages 会自动部署。

#### 5. 测试完整流程

1. 访问 `https://baronsue.github.io/AI_FranchTeacher`
2. 点击"注册"创建账号
3. 登录成功
4. 完成一个课程，刷新页面验证数据持久化
5. 打卡、获得徽章等功能

---

## 开发工作流

### 本地开发

**终端 1 - 后端**:
```bash
cd server
npm run dev  # 使用 nodemon 自动重启
```

**终端 2 - 前端**:
```bash
# 使用 VS Code Live Server
# 或 python -m http.server 8000
```

**终端 3 - 数据库**:
```bash
# PgAdmin 4 GUI 管理
# 或 psql -U postgres -d french_teacher
```

### 测试 API

**使用 curl**:
```bash
# 注册
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser","password":"test123"}'

# 登录
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# 获取用户信息
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**使用 Postman**:
1. 导入环境变量: `BASE_URL = http://localhost:3001`
2. 在 Auth 标签选择 "Bearer Token"
3. 测试各个端点

---

## 安全最佳实践

### ✅ 已实现

1. **密码安全**
   - bcrypt 哈希（10轮）
   - 最少6个字符要求
   - 不在日志中记录密码

2. **Token 安全**
   - JWT 签名验证
   - 7天过期时间
   - HttpOnly (前端使用 localStorage)
   - 过期自动清除

3. **API 安全**
   - CORS 白名单
   - 速率限制（登录: 5次/15分钟）
   - Helmet 安全头
   - SQL 参数化查询

4. **输入验证**
   - 前端 HTML5 验证
   - 后端正则表达式验证
   - 邮箱格式检查
   - 用户名格式限制

### ⚠️ 建议改进

1. **生产环境**
   - 使用环境变量管理敏感信息
   - 定期更新依赖包
   - 启用数据库备份
   - 配置监控告警

2. **增强安全性**
   - 添加邮箱验证
   - 实现密码重置
   - 添加CAPTCHA防机器人
   - 启用2FA

---

## 故障排除

### 前端问题

**Q: 点击登录/注册按钮没反应**
- 打开浏览器控制台查看错误
- 检查 `auth_service.js` 中的 API_BASE_URL 是否正确
- 确认后端服务器正在运行

**Q: 登录后刷新页面就退出了**
- Token 保存在 localStorage，应该持久化
- 检查浏览器是否禁用了 localStorage
- 查看控制台是否有 401 Unauthorized 错误

### 后端问题

**Q: 数据库连接失败**
```
Error: connect ECONNREFUSED
```
- 检查 PostgreSQL 是否运行: `sudo systemctl status postgresql`
- 验证 `.env` 中的 DATABASE_URL 格式正确
- 确认数据库用户名和密码

**Q: JWT verification failed**
```
Error: JsonWebTokenError: invalid signature
```
- 前后端 JWT_SECRET 必须一致
- 检查 `.env` 文件是否正确加载

**Q: CORS错误**
```
Access to fetch has been blocked by CORS policy
```
- 检查 `ALLOWED_ORIGINS` 环境变量
- 确保前端 URL 在白名单中
- 开发环境确保包含 `http://localhost:5500`

---

## 下一步

认证系统已完成，接下来可以：

1. ✅ **数据同步服务** - 将 localStorage 数据迁移到 PostgreSQL
2. ✅ **用户仪表板** - 显示个人学习数据
3. ⏳ **邮箱验证** - 注册后发送验证邮件
4. ⏳ **密码重置** - 忘记密码功能
5. ⏳ **社交登录** - Google/GitHub OAuth
6. ⏳ **移动应用** - React Native/Flutter

---

## 相关文档

- [API 文档](./server/API_DOCUMENTATION.md)
- [数据库设置](./server/DATABASE_SETUP.md)
- [数据库架构](./database/schema.sql)
- [服务器 README](./server/README.md)
