## Qwen Proxy Server

这是一个轻量级的 Node.js 代理服务，用于在服务器端安全地转发请求至阿里云通义千问（DashScope）API。通过代理可以避免浏览器端的 CORS 限制，并且保护你的 API Key 不被暴露。

### 目录结构

```
proxy/
  ├─ package.json
  ├─ server.js
  └─ env.example
```

### 环境要求

- Node.js 16 或更高版本（推荐使用 Node 18+）
- npm 或 pnpm/yarn

### 安装与运行

1. **安装依赖**

   ```bash
   cd proxy
   npm install
   ```

2. **配置环境变量**

   复制示例配置文件并填写实际值：

   ```bash
   cp env.example .env
   ```

   `.env` 文件内容说明：

   - `PORT`：代理服务监听端口，默认 `3001`
   - `QWEN_API_KEY`：你的 DashScope API Key，必须填写
   - `ALLOWED_ORIGINS`：允许访问代理的前端来源，逗号分隔（默认允许 `http://localhost:5500` 和 `http://127.0.0.1:5500`）

3. **启动代理服务**

   ```bash
   npm start
   ```

   若开发阶段需要自动重启，可使用：

   ```bash
   npm run dev
   ```

4. **确认服务正常**

   浏览器访问 http://localhost:3001/health  
   若配置正确，将看到 `{"status":"ok","hasApiKey":true,...}` 的 JSON 响应。

### 前端配置说明

前端 `services/qwen_service.js` 已默认指向本地代理地址 `http://localhost:3001/qwen`。只需确保代理服务运行，即可正常调用。

### 部署建议

- **生产环境**：部署在自己的服务器或 Serverless 平台（例如阿里云函数、Cloudflare Workers、Vercel 等）。
- **安全性**：将 `.env` 保存为私密文件，不要提交到版本控制系统。
- **CORS**：根据实际部署的前端地址调整 `ALLOWED_ORIGINS`。

### 常见问题

| 问题 | 可能原因 | 解决方案 |
|------|----------|----------|
| `Missing QWEN_API_KEY` | 未在 `.env` 中配置 API Key | 填写正确的 Key 并重启服务 |
| `Blocked origin` | 前端地址不在 `ALLOWED_ORIGINS` 列表中 | 在 `.env` 中添加对应的前端地址 |
| `No response received from DashScope` | 网络问题或 DashScope 不可达 | 检查网络、防火墙，稍后重试 |
| `API Error 401` | API Key 无效或已失效 | 在 DashScope 控制台重新生成 API Key |

如需帮助，可复制终端中的错误日志或代理返回的错误信息并反馈。README.md

