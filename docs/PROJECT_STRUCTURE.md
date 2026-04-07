# 项目目录结构说明

本仓库为 **单体仓库（monorepo）**：静态前端在仓库根目录（便于 GitHub Pages），后端服务按子目录拆分。

## 根目录

| 路径 | 说明 |
|------|------|
| `index.html` | 单页应用入口 |
| `main.js` / `router.js` | 启动与路由 |
| `style.css` | 全局样式 |
| `package.json` | 仓库级脚本（`npm run serve` 等），**不声明前端依赖**（CDN 引入） |
| `README.md` | 项目说明 |
| `render.yaml` | Render 一键蓝图：PostgreSQL + 认证服务 + Qwen 代理 |

## 前端（可部署到 GitHub Pages 的部分）

| 路径 | 说明 |
|------|------|
| `components/` | 可复用 UI（如顶栏） |
| `views/` | 各路由页面（课程、登录、学习面板等） |
| `services/` | 前端服务：认证 API 客户端、AI、语音、用户数据同步 |
| `utils/` | 工具：课程状态、游戏化、模态框、云端状态推导等 |
| `data/` | 课程内容与文化数据（Markdown / JS） |

GitHub Actions 仅将上述静态资源打包到 `_site` 上传，**不包含** `auth-server/`、`proxy/`、`node_modules` 等。

## 后端服务

| 路径 | 说明 |
|------|------|
| `auth-server/` | Express + JWT + PostgreSQL，用户与练习等 REST API |
| `proxy/` | 可选：通义千问 API 转发代理 |
| `database/init.sql` | PostgreSQL 表结构（部署时手动或通过脚本执行） |

## 文档与配置

| 路径 | 说明 |
|------|------|
| `docs/` | 部署、认证、排错等指南 |
| `.github/workflows/` | CI（如 Pages 部署） |

## 本地命令速查

```bash
# 根目录：启动静态前端（需本机已装 Node，首次会拉取 serve）
npm run serve

# 认证服务
npm run dev:auth

# Qwen 代理（需先在 proxy 目录 npm install）
npm run dev:proxy
```

## 约定

- 各子项目的依赖在各自目录的 `package.json` 内管理；根目录不生成与前端重复的 `node_modules`。
- 勿将 `.env` 提交入库；示例环境变量见各服务下的 `.env.example`。
