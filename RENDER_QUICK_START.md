# 🚀 Render 快速部署（10分钟）

## 📝 部署前准备

确保你有：
- ✅ GitHub 账号
- ✅ Render 账号（可以用 GitHub 登录）
- ✅ 代码已推送到 GitHub

## 🎯 快速部署步骤

### 1️⃣ 生成 JWT 密钥（30秒）

在本地终端运行两次，复制两个密钥：

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

保存这两个密钥，稍后要用。

---

### 2️⃣ 创建数据库（2分钟）

1. 登录 https://dashboard.render.com
2. 点击 **New +** → **PostgreSQL**
3. 填写：
   - Name: `ai-franchteacher-db`
   - Region: `Oregon (US West)`
   - Plan: **Free**
4. 点击 **Create Database**
5. 等待创建完成
6. 复制 **Internal Database URL**（重要！）

---

### 3️⃣ 初始化数据库表（2分钟）

**在本地终端运行**：

```bash
# 1. 设置数据库连接
export DATABASE_URL="你复制的 Internal Database URL"

# 2. 进入项目目录
cd /Users/baron/Downloads/yYVJhOE/auth-server

# 3. 运行初始化脚本
node scripts/init-render-db.js

# 看到 "✅ 数据库初始化成功！" 就OK了
```

---

### 4️⃣ 部署认证服务器（5分钟）

1. 在 Render Dashboard，点击 **New +** → **Web Service**

2. **Connect Repository**:
   - 选择 `AI_FranchTeacher`
   - 点击 **Connect**

3. **配置服务**:
   ```
   Name: ai-franchteacher-auth
   Region: Oregon (US West)
   Branch: main
   Root Directory: auth-server
   Runtime: Node
   Build Command: npm install
   Start Command: npm start
   Plan: Free
   ```

4. **环境变量** - 点击 **Advanced**，添加：

   | Key | Value | 说明 |
   |-----|-------|------|
   | `NODE_ENV` | `production` | 生产环境 |
   | `PORT` | `10000` | Render 默认端口 |
   | `DATABASE_URL` | `粘贴你的 Internal URL` | ⚠️ 重要 |
   | `JWT_SECRET` | `粘贴第1个密钥` | ⚠️ 重要 |
   | `REFRESH_TOKEN_SECRET` | `粘贴第2个密钥` | ⚠️ 重要 |
   | `JWT_EXPIRES_IN` | `7d` | 令牌7天有效 |
   | `REFRESH_TOKEN_EXPIRES_IN` | `30d` | 刷新令牌30天 |
   | `BCRYPT_ROUNDS` | `10` | 密码加密强度 |
   | `ALLOWED_ORIGINS` | `https://baronsue.github.io` | ⚠️ 你的前端域名 |

5. 点击 **Create Web Service**

6. **等待部署** - 查看 Logs，等待看到：
   ```
   🚀 认证服务器启动成功
   📡 端口: 10000
   ✅ 数据库连接成功
   ```

7. **复制服务 URL**，类似：
   ```
   https://ai-franchteacher-auth.onrender.com
   ```

---

### 5️⃣ 测试 API（1分钟）

在终端测试：

```bash
# 替换为你的 URL
curl https://ai-franchteacher-auth.onrender.com/health

# 应该返回：
# {"status":"ok","timestamp":"...","uptime":...}

# 测试数据库
curl https://ai-franchteacher-auth.onrender.com/health/db

# 应该返回：
# {"status":"ok","database":"connected","timestamp":"..."}
```

✅ 如果都返回成功，继续下一步！

---

### 6️⃣ 更新前端配置（2分钟）

1. **编辑文件** `services/auth_service.js`:

   ```javascript
   // 第 3 行，修改为你的 Render URL
   const API_BASE_URL = 'https://ai-franchteacher-auth.onrender.com/api';
   ```

2. **提交代码**:

   ```bash
   cd /Users/baron/Downloads/yYVJhOE
   git add services/auth_service.js
   git commit -m "更新 API URL 指向 Render"
   git push origin main
   ```

3. **等待 GitHub Pages 部署**（1-2分钟）

---

### 7️⃣ 测试完整系统（1分钟）

1. 访问 https://baronsue.github.io/AI_FranchTeacher
2. 看到登录页面 ✅
3. 点击「注册」
4. 填写信息并注册
5. 应该成功创建账户并登录 ✅

**恭喜！** 🎉 你的系统已完全部署到云端！

---

## 🔍 故障排查

### ❌ 注册时显示"网络错误"

**检查**：
1. Render 服务是否运行？访问你的 URL
2. 浏览器控制台有 CORS 错误？
   - 检查 `ALLOWED_ORIGINS` 环境变量
   - 确保是 `https://baronsue.github.io`（没有多余空格）

**修复**：
```bash
# 在 Render Dashboard:
1. 进入你的 Web Service
2. Environment → Edit
3. 修改 ALLOWED_ORIGINS
4. Save Changes（会自动重启）
```

### ❌ 数据库连接失败

**检查**：
1. `DATABASE_URL` 是否正确？
2. 使用的是 **Internal** URL 还是 External？

**修复**：
```bash
# 应该使用 Internal URL，格式：
postgres://user:pass@dpg-xxx-a/dbname
# 不是
postgres://user:pass@dpg-xxx-a.oregon-postgres.render.com/dbname
```

### ❌ Render 服务一直重启

**查看日志**：
1. Render Dashboard → 你的服务
2. Logs 标签
3. 查找错误信息

**常见问题**：
- 环境变量缺失
- 数据库连接失败
- 端口配置错误（应该是 10000）

---

## 📞 需要帮助？

- 📖 完整指南: `docs/RENDER_DEPLOYMENT.md`
- 🔧 故障排查: `docs/TROUBLESHOOTING.md`
- 🐛 提交 Issue: https://github.com/baronsue/AI_FranchTeacher/issues

---

## ✅ 部署检查清单

完成后确认：

- [ ] 数据库已创建并初始化
- [ ] Web 服务显示 "Live"
- [ ] 健康检查返回 OK
- [ ] 数据库连接检查返回 OK
- [ ] 前端可以访问
- [ ] 可以注册新用户
- [ ] 可以登录
- [ ] Header 显示用户信息

全部打勾？**完美！** 🎉
