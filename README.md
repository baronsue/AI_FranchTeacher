<p align="center">
  <strong>语言 / Language</strong><br>
  <a href="#readme-zh">简体中文</a>
  &nbsp;·&nbsp;
  <a href="#readme-en">English</a>
</p>

---

<h2 id="readme-zh">简体中文</h2>

<p align="right"><a href="#">↑ 回到顶部</a> · <a href="#readme-en">English</a></p>

### Aurélie — 你的 AI 法语老师

基于浏览器的法语学习应用：互动课文与练习（填空、选择、匹配）、AI 对话、文化内容，以及游戏化（积分、徽章、打卡）和**学习面板**；在配置后端并登录后，学习数据可与账户云端同步。

### 功能概览

- **课程** — Markdown 课文、增强版布局与侧边栏；登录用户可将进度、练习记录、错题等同步至服务器。
- **认证与云端数据** — 注册 / 登录（JWT）；通过 `auth-server` 提供的 REST API 读写进度、练习、积分、徽章、打卡、错题与统计。
- **学习面板** — 与同一套 API 对齐的学习时长、完成度、打卡日历、徽章与积分展示。
- **部署** — 前端静态托管（如 GitHub Pages）+ Render 上的 Node 服务 + PostgreSQL。详细步骤见 [docs/RENDER_DEPLOYMENT.md](docs/RENDER_DEPLOYMENT.md)。

### 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | 原生 ES Module、Tailwind（CDN）、Lucide、Marked |
| 后端 | Express、PostgreSQL（`pg`）、JWT、bcrypt |
| 可选 | `proxy/` 通义千问等模型代理 |

### 仓库结构（摘要）

更完整的说明见 [docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md)。

```
├── index.html, main.js, router.js, style.css, package.json  # 前端入口与根脚本
├── components/, views/, services/, utils/, data/            # 可部署的静态前端
├── auth-server/                  # 认证与用户数据 API（Node + PostgreSQL）
├── proxy/                        # 可选：Qwen 代理
├── database/init.sql             # 数据库结构
├── render.yaml                   # Render 蓝图（数据库 + 认证 + 代理）
└── docs/                         # 部署与排错文档
```

### 本地运行

1. **前端** — 必须在 HTTP 服务下打开（ES Module 要求），例如：

   ```bash
   npm run serve
   # 或: npx serve .
   # 浏览器访问终端提示的本地地址
   ```

2. **认证服务** — 在 `auth-server/` 目录：

   ```bash
   cd auth-server
   cp .env.example .env   # 填写 DATABASE_URL、JWT_SECRET、ALLOWED_ORIGINS 等
   npm install
   npm run dev            # 默认端口需与 services/auth_service.js 中本地 API 一致（常见 3002）
   ```

3. **数据库** — 在 PostgreSQL 中执行 `database/init.sql`。

线上环境请将前端中的认证服务地址设为已部署的 API（见 `services/auth_service.js` 中的 `AUTH_API_PRODUCTION`）。**CORS 的 `ALLOWED_ORIGINS`** 需填写浏览器 **Origin**（如 `https://用户名.github.io`），不要带仓库路径后缀。

### 许可证

MIT（见 `auth-server/package.json` 等）。CDN 引入的第三方库遵循各自许可证。

<p align="center"><a href="#readme-zh">简体中文</a> &nbsp;·&nbsp; <a href="#readme-en">English</a> &nbsp;·&nbsp; <a href="#">↑ 回到顶部</a></p>

---

<h2 id="readme-en">English</h2>

<p align="right"><a href="#">↑ Top</a> · <a href="#readme-zh">简体中文</a></p>

### Aurélie — AI French Teacher

A browser-based French learning app: interactive lessons, exercises (fill-in-the-blank, multiple choice, matching), AI dialogue, culture notes, gamification (points, badges, check-ins), and a **learning dashboard** synced to your account when the backend is configured.

### Features

- **Courses** — Markdown-driven content, enhanced layout with sidebar; progress, exercises, and mistakes can sync to the server for logged-in users.
- **Auth & cloud data** — Register / login (JWT); progress, exercises, points, badges, check-ins, mistakes, and stats via REST API (`auth-server`).
- **Learning dashboard** — Stats, completion, calendar from check-ins, badges, and points from the same API.
- **Deployment-friendly** — Static frontend (e.g. GitHub Pages) + Node API on Render + PostgreSQL. See [docs/RENDER_DEPLOYMENT.md](docs/RENDER_DEPLOYMENT.md).

### Tech stack

| Layer | Technologies |
|--------|----------------|
| Frontend | Vanilla ES modules, Tailwind (CDN), Lucide, Marked |
| Backend | Express, PostgreSQL (`pg`), JWT, bcrypt |
| Optional | Qwen proxy (`proxy/`) for AI features |

### Repository layout (high level)

See [docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md) for details.

```
├── index.html, main.js, router.js, style.css, package.json  # SPA entry + root scripts
├── components/, views/, services/, utils/, data/            # Static frontend (Pages)
├── auth-server/                  # Auth & user-data API
├── proxy/                        # Optional Qwen proxy
├── database/init.sql
├── render.yaml                   # Render blueprint (DB + auth + proxy)
└── docs/
```

### Local development

1. **Frontend** — Serve the repo root over HTTP (ES modules require a server), for example:

   ```bash
   npm run serve
   # or: npx serve .
   ```

2. **Auth API** — From `auth-server/`:

   ```bash
   cd auth-server
   cp .env.example .env   # fill DATABASE_URL, JWT_SECRET, ALLOWED_ORIGINS, etc.
   npm install
   npm run dev            # default port often 3002 — match services/auth_service.js for localhost
   ```

3. **Database** — Apply `database/init.sql` to your PostgreSQL instance.

For production, set the frontend’s auth base URL (see `services/auth_service.js`, `AUTH_API_PRODUCTION`) to your deployed API (e.g. `https://your-service.onrender.com/api`). **`ALLOWED_ORIGINS`** must be the browser origin only (e.g. `https://yourname.github.io`), without path suffixes.

### License

MIT (see `auth-server/package.json` and project conventions). Third-party CDN assets follow their respective licenses.

<p align="center"><a href="#readme-zh">简体中文</a> &nbsp;·&nbsp; <a href="#readme-en">English</a> &nbsp;·&nbsp; <a href="#">↑ Top</a></p>
