# Render 云端部署指南

本指南将帮助你把 AI FranchTeacher 的认证服务器和数据库部署到 Render，让你的 GitHub Pages 前端可以正常访问。

## 📋 部署架构

```
┌──────────────────────────────────────────────┐
│    GitHub Pages (baronsue.github.io)         │
│         前端静态页面                          │
└────────┬─────────────────────────┬───────────┘
         │ HTTPS                    │ HTTPS
         ↓                          ↓
┌─────────────────┐        ┌─────────────────┐
│  Render Web     │        │  Render Web     │
│  认证服务器      │        │  Qwen 代理      │
│  (已有)         │        │  (你已部署)     │
└────────┬────────┘        └─────────────────┘
         │ PostgreSQL
         ↓
┌─────────────────┐
│  Render         │
│  PostgreSQL     │
│  (免费数据库)    │
└─────────────────┘
```

## 🚀 部署步骤

### 第 1 步: 准备 GitHub 仓库

确保代码已推送到 GitHub：

```bash
cd /Users/baron/Downloads/yYVJhOE
git add .
git commit -m "准备 Render 部署"
git push origin main
```

### 第 2 步: 登录 Render

1. 访问 https://render.com
2. 使用你的 GitHub 账号登录
3. 进入 Dashboard

### 第 3 步: 创建 PostgreSQL 数据库

1. 点击 **New +** → **PostgreSQL**
2. 填写信息：
   ```
   Name: ai-franchteacher-db
   Database: ai_franchteacher
   User: (自动生成)
   Region: Oregon (US West)
   Plan: Free
   ```
3. 点击 **Create Database**
4. 等待数据库创建完成（约 1-2 分钟）
5. **重要**: 复制以下信息（稍后需要）：
   - Internal Database URL
   - External Database URL

### 第 4 步: 初始化数据库

**方法 A: 使用 Render Shell (推荐)**

1. 在数据库详情页，点击 **Connect** → **External Connection**
2. 复制 **PSQL Command**，类似：
   ```bash
   PGPASSWORD=xxx psql -h dpg-xxx.oregon-postgres.render.com -U ai_franchteacher_user ai_franchteacher
   ```

3. 在本地终端运行：
   ```bash
   # 连接到数据库
   PGPASSWORD=你的密码 psql -h dpg-xxx.oregon-postgres.render.com -U 你的用户名 ai_franchteacher

   # 连接成功后，粘贴 database/init.sql 的内容
   # 或者直接执行文件
   \i /Users/baron/Downloads/yYVJhOE/database/init.sql
   ```

**方法 B: 使用 Node.js 脚本**

```bash
# 设置环境变量
export DATABASE_URL="你的 Internal Database URL"

# 运行初始化脚本
cd /Users/baron/Downloads/yYVJhOE/auth-server
node scripts/init-render-db.js
```

### 第 5 步: 创建 Web 服务（认证服务器）

1. 在 Render Dashboard，点击 **New +** → **Web Service**
2. 选择你的 GitHub 仓库 `AI_FranchTeacher`
3. 填写配置：

   **Basic**:
   ```
   Name: ai-franchteacher-auth
   Region: Oregon (US West)
   Branch: main
   Root Directory: auth-server
   Runtime: Node
   ```

   **Build & Deploy**:
   ```
   Build Command: npm install
   Start Command: npm start
   ```

   **Plan**: Free

4. 点击 **Advanced** → **Add Environment Variable**

   添加以下环境变量：

   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `PORT` | `10000` |
   | `DATABASE_URL` | `你的 Internal Database URL` |
   | `JWT_SECRET` | `生成的随机密钥` ⚠️ |
   | `REFRESH_TOKEN_SECRET` | `生成的随机密钥` ⚠️ |
   | `JWT_EXPIRES_IN` | `7d` |
   | `REFRESH_TOKEN_EXPIRES_IN` | `30d` |
   | `BCRYPT_ROUNDS` | `10` |
   | `ALLOWED_ORIGINS` | `https://baronsue.github.io` |

   **⚠️ 生成 JWT 密钥**:
   ```bash
   # 在本地终端运行
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   # 复制输出的密钥
   ```

5. 点击 **Create Web Service**

### 第 6 步: 等待部署完成

1. Render 会自动构建和部署（约 5-10 分钟）
2. 查看 **Logs** 标签监控进度
3. 等待看到：
   ```
   🚀 认证服务器启动成功
   📡 端口: 10000
   ✅ 数据库连接成功
   ```
4. 部署成功后，你会得到一个 URL，类似：
   ```
   https://ai-franchteacher-auth.onrender.com
   ```

### 第 7 步: 测试 API

```bash
# 测试健康检查
curl https://ai-franchteacher-auth.onrender.com/health

# 预期响应
{
  "status": "ok",
  "timestamp": "2024-01-17T...",
  "uptime": 123.45
}

# 测试数据库连接
curl https://ai-franchteacher-auth.onrender.com/health/db

# 预期响应
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2024-01-17T..."
}
```

### 第 8 步: 更新前端配置

1. **编辑 `services/auth_service.js`**:

   ```javascript
   // 修改 API_BASE_URL
   const API_BASE_URL = 'https://ai-franchteacher-auth.onrender.com/api';
   ```

2. **提交并推送到 GitHub**:

   ```bash
   cd /Users/baron/Downloads/yYVJhOE
   git add services/auth_service.js
   git commit -m "更新 API URL 指向 Render 部署"
   git push origin main
   ```

3. **等待 GitHub Pages 自动部署** (约 1-2 分钟)

### 第 9 步: 验证完整系统

1. 访问 https://baronsue.github.io/AI_FranchTeacher
2. 应该看到登录页面
3. 尝试注册新用户
4. 登录测试

如果一切正常，恭喜！🎉 你的系统已完全部署到云端！

---

## 🔧 故障排查

### 问题 1: 数据库连接失败

**错误**: `Error: connect ECONNREFUSED`

**解决**:
1. 检查 `DATABASE_URL` 是否正确
2. 确保使用 **Internal Database URL**（不是 External）
3. 检查数据库是否已创建成功

### 问题 2: CORS 错误

**错误**: `Access-Control-Allow-Origin`

**解决**:
1. 检查 Render 环境变量 `ALLOWED_ORIGINS`
2. 确保包含 `https://baronsue.github.io`
3. 没有多余的空格或逗号
4. 重启 Web Service

### 问题 3: 服务启动失败

**错误**: `Application failed to respond`

**解决**:
1. 查看 Render Logs
2. 检查 `package.json` 的 `start` 脚本
3. 确保 `PORT` 环境变量设为 `10000`
4. 检查依赖是否正确安装

### 问题 4: 数据库表不存在

**错误**: `relation "users" does not exist`

**解决**:
1. 重新运行数据库初始化脚本
2. 检查 `init.sql` 是否执行成功
3. 使用 psql 手动连接验证

---

## 📊 Render 免费计划限制

### PostgreSQL 数据库
- ✅ 1 GB 存储
- ✅ 足够存储数千个用户
- ⚠️ 90 天后如果没有付费计划会被删除

### Web 服务
- ✅ 750 小时/月运行时间
- ✅ 512 MB RAM
- ⚠️ 15 分钟不活动后会休眠
- ⚠️ 首次访问需要 30-60 秒唤醒

### 优化建议

**1. 保持服务活跃**

使用免费的监控服务定期访问你的 API：

- [UptimeRobot](https://uptimerobot.com) - 每 5 分钟检查一次
- [Cron-job.org](https://cron-job.org) - 定时访问

**2. 数据库备份**

```bash
# 定期备份数据库
pg_dump $(echo $DATABASE_URL) > backup.sql

# 压缩
gzip backup.sql
```

**3. 监控日志**

在 Render Dashboard → Logs 查看：
- 错误信息
- 性能问题
- 数据库查询

---

## 🔐 安全建议

### 环境变量
- ✅ 使用强随机密钥（JWT_SECRET）
- ✅ 定期轮换密钥
- ✅ 不要在代码中硬编码

### CORS 配置
- ✅ 只允许你的域名
- ✅ 不要使用 `*` 通配符

### 数据库
- ✅ 使用 SSL 连接
- ✅ 定期备份
- ✅ 监控异常查询

---

## 🚀 生产环境优化

### 1. 自定义域名

在 Render Dashboard → Settings:
```
Custom Domain: auth.yourdomain.com
```

需要添加 DNS CNAME 记录。

### 2. 环境分离

创建多个环境：
- `ai-franchteacher-auth-dev` - 开发
- `ai-franchteacher-auth-staging` - 测试
- `ai-franchteacher-auth-prod` - 生产

### 3. 监控和告警

使用 Render 的内置监控或集成：
- Sentry - 错误追踪
- LogDNA - 日志管理
- New Relic - 性能监控

---

## 📝 部署检查清单

部署前确认：

- [ ] ✅ 数据库已创建
- [ ] ✅ 数据库已初始化（表已创建）
- [ ] ✅ 所有环境变量已设置
- [ ] ✅ JWT_SECRET 使用强随机密钥
- [ ] ✅ ALLOWED_ORIGINS 包含 GitHub Pages URL
- [ ] ✅ DATABASE_URL 使用 Internal URL
- [ ] ✅ 健康检查通过
- [ ] ✅ 数据库连接检查通过
- [ ] ✅ 前端 API URL 已更新
- [ ] ✅ 前端代码已推送
- [ ] ✅ 可以注册和登录

---

## 🆘 获取帮助

### Render 资源
- [Render 文档](https://render.com/docs)
- [Render 社区](https://community.render.com)
- [Render 状态](https://status.render.com)

### 项目资源
- [项目文档](./README.md)
- [GitHub Issues](https://github.com/baronsue/AI_FranchTeacher/issues)

---

**部署完成！** 🎉

你的 AI FranchTeacher 现在完全在云端运行了！
