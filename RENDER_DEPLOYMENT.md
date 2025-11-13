# Render 云端代理部署指南

本指南将帮助你在 Render 平台上部署 Qwen 代理服务。

## 前置准备

1. 注册 [Render](https://render.com/) 账号（支持 GitHub 登录）
2. 获取通义千问 API Key（参见 `QWEN_SETUP_GUIDE.md`）
3. 确保你的 GitHub 仓库已推送最新代码

## 部署步骤

### 方法一：使用 render.yaml 自动部署（推荐）

1. **连接 GitHub 仓库**
   - 登录 Render Dashboard
   - 点击 "New +" → "Blueprint"
   - 选择你的 GitHub 仓库 `AI_FranchTeacher`
   - Render 会自动检测根目录的 `render.yaml` 配置

2. **配置环境变量**
   - 在创建服务时，Render 会提示配置环境变量
   - **必须配置** `QWEN_API_KEY`：填入你的通义千问 API Key
   - 其他变量已在 `render.yaml` 中预设：
     - `PORT=10000`（Render 默认端口）
     - `ALLOWED_ORIGINS`（已包含 GitHub Pages 域名）
     - `NODE_ENV=production`

3. **部署**
   - 点击 "Apply" 开始部署
   - 等待构建完成（约 1-3 分钟）
   - 部署成功后会获得一个 URL，格式如：`https://your-app.onrender.com`

### 方法二：手动创建 Web Service

1. **创建新服务**
   - Render Dashboard → "New +" → "Web Service"
   - 连接你的 GitHub 仓库

2. **配置服务**
   - **Name**: `franch-teacher-proxy`（或自定义名称）
   - **Region**: 选择离你最近的区域（推荐 Singapore 或 Oregon）
   - **Branch**: `main`（或你的主分支）
   - **Root Directory**: `proxy`（重要！）
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

3. **添加环境变量**

   点击 "Advanced" → "Add Environment Variable"，添加以下变量：

   | Key | Value |
   |-----|-------|
   | `PORT` | `10000` |
   | `QWEN_API_KEY` | `sk-your-actual-api-key` |
   | `ALLOWED_ORIGINS` | `https://baronsue.github.io,http://localhost:5500` |
   | `NODE_ENV` | `production` |

4. **选择计划**
   - 选择 "Free" 计划（每月 750 小时免费）
   - 注意：Free 计划在 15 分钟无活动后会休眠

5. **创建服务**
   - 点击 "Create Web Service"
   - 等待首次部署完成

## 部署后配置

### 1. 获取服务 URL

部署成功后，Render 会分配一个 URL，例如：
```
https://franch-teacher-proxy.onrender.com
```

你的代理端点将是：
```
https://franch-teacher-proxy.onrender.com/qwen
```

### 2. 更新前端配置

修改 `main.js` 中的代理 URL：

```javascript
// main.js 第 16 行
const deployedProxy = 'https://franch-teacher-proxy.onrender.com/qwen';
```

将 URL 替换为你的实际 Render 服务地址。

### 3. 测试部署

访问以下端点测试服务：

- **根路径**: `https://your-app.onrender.com/`
  - 应返回：`{"status":"ok","message":"Qwen proxy is running..."}`

- **健康检查**: `https://your-app.onrender.com/health`
  - 应返回：`{"status":"ok","provider":"qwen","hasApiKey":true,...}`

## 常见问题

### Q: 构建失败 "Exited with status 1"

**原因**：
- 缺少 `render.yaml` 配置文件
- 未指定正确的 Root Directory (`proxy`)
- Node 版本不兼容

**解决**：
- 确保使用最新提交的代码（包含 `render.yaml`）
- 手动创建时，务必设置 Root Directory 为 `proxy`
- 在 `proxy/package.json` 中添加 Node 版本（可选）：
  ```json
  "engines": {
    "node": ">=18.0.0"
  }
  ```

### Q: CORS 错误

**原因**：前端域名未在 `ALLOWED_ORIGINS` 中

**解决**：
1. 在 Render Dashboard → 你的服务 → "Environment"
2. 修改 `ALLOWED_ORIGINS` 变量，添加你的 GitHub Pages 域名：
   ```
   https://baronsue.github.io,http://localhost:5500
   ```
3. 保存后会自动重新部署

### Q: 服务休眠（Free 计划）

**现象**：首次访问很慢（15-30 秒）

**原因**：Free 计划在 15 分钟无活动后自动休眠

**解决方案**：
1. 升级到 Starter 计划（$7/月，无休眠）
2. 使用定时 ping 服务保持唤醒（如 UptimeRobot）
3. 接受首次访问的延迟

### Q: API 密钥泄露风险

**防护措施**：
- ✅ API Key 仅存储在 Render 环境变量中（加密）
- ✅ 前端代码不包含 API Key
- ✅ CORS 保护限制访问源
- ⚠️ 定期检查 DashScope 控制台的用量
- ⚠️ 设置月度配额限制

## 更新部署

### 自动部署（推荐）

Render 默认开启自动部署：
1. 推送代码到 GitHub
2. Render 自动检测并部署
3. 等待构建完成

### 手动部署

Render Dashboard → 你的服务 → "Manual Deploy" → "Deploy latest commit"

## 监控和日志

### 查看日志
Render Dashboard → 你的服务 → "Logs"

查找关键信息：
```
[Qwen Proxy] Server is running on http://0.0.0.0:10000
[Qwen Proxy] Allowed origins: https://baronsue.github.io,...
```

### 查看指标
Render Dashboard → 你的服务 → "Metrics"
- CPU 使用率
- 内存使用
- 请求数量

## 成本估算

| 计划 | 价格 | 特性 |
|-----|------|-----|
| Free | $0 | 750小时/月，15分钟后休眠 |
| Starter | $7/月 | 无休眠，更好性能 |

**推荐**：
- 开发/测试：Free 计划
- 生产环境：Starter 计划

## 备选方案

如果 Render 不适合，可以考虑：
- **Vercel**（需要 Serverless Functions 配置）
- **Railway**（类似 Render，有 $5 免费额度）
- **Fly.io**（全球边缘部署，有免费额度）
- **阿里云函数计算**（国内访问更快，当前使用）

## 技术支持

遇到问题？
1. 检查 Render 日志是否有错误信息
2. 测试健康检查端点：`https://your-app.onrender.com/health`
3. 查看浏览器控制台的网络请求
4. 参考 `proxy/README.md` 了解代理服务器详情

---

**提示**：首次部署建议使用"方法一：render.yaml 自动部署"，配置更简单且不易出错。
