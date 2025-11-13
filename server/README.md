# AI FranchTeacher API Server

Node.js + Express + PostgreSQL 后端服务，提供用户认证和学习数据管理。

## 功能特性

✅ **用户认证系统**
- JWT Token 认证
- 用户注册/登录
- 密码加密（bcrypt）
- 用户资料管理

✅ **学习数据管理**
- 课程进度跟踪
- 积分系统
- 徽章成就
- 学习统计
- 每日打卡
- 错题本
- AI对话历史

✅ **安全特性**
- Helmet 安全头
- CORS 跨域控制
- 速率限制（防暴力攻击）
- SQL 注入防护（参数化查询）

✅ **数据库**
- PostgreSQL 15
- 9个数据表
- 自动时间戳
- 外键约束
- 索引优化

## 技术栈

- **Runtime**: Node.js 18+
- **Framework**: Express 4
- **Database**: PostgreSQL 15
- **Authentication**: JWT + bcryptjs
- **Security**: Helmet, CORS, Rate Limiting
- **Logging**: Morgan

## 快速开始

### 1. 安装依赖

```bash
cd server
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件，设置数据库连接和JWT密钥。

### 3. 设置数据库

参考 [DATABASE_SETUP.md](./DATABASE_SETUP.md) 完成数据库初始化。

```bash
# 方法1: 使用 psql
psql -U postgres -d french_teacher -f ../database/schema.sql

# 方法2: 使用 npm 脚本（推荐）
npm run db:setup
```

### 4. 启动服务器

```bash
# 开发模式（带自动重启）
npm run dev

# 生产模式
npm start
```

服务器将在 `http://localhost:3001` 启动。

### 5. 测试 API

访问健康检查端点:
```bash
curl http://localhost:3001/health
```

预期响应:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "AI FranchTeacher API"
}
```

## 项目结构

```
server/
├── server.js              # 主入口文件
├── package.json           # 依赖配置
├── .env.example          # 环境变量模板
├── config/
│   └── database.js       # 数据库连接池
├── middleware/
│   └── auth.js           # JWT 认证中间件
├── controllers/          # 业务逻辑控制器
│   ├── authController.js
│   ├── progressController.js
│   ├── pointsController.js
│   ├── badgesController.js
│   ├── statsController.js
│   ├── mistakesController.js
│   └── dialogueController.js
├── routes/               # 路由定义
│   ├── authRoutes.js
│   ├── progressRoutes.js
│   ├── pointsRoutes.js
│   ├── badgesRoutes.js
│   ├── statsRoutes.js
│   ├── mistakesRoutes.js
│   └── dialogueRoutes.js
└── scripts/
    └── setup-db.js       # 数据库初始化脚本
```

## API 路由

### 认证
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户 (需认证)
- `PUT /api/auth/profile` - 更新资料 (需认证)
- `PUT /api/auth/password` - 修改密码 (需认证)

### 课程进度
- `GET /api/progress` - 获取所有进度 (需认证)
- `GET /api/progress/:courseId` - 获取单个课程进度 (需认证)
- `PUT /api/progress/:courseId` - 更新进度 (需认证)
- `DELETE /api/progress/:courseId` - 重置进度 (需认证)

### 积分
- `GET /api/points` - 获取积分 (需认证)
- `POST /api/points` - 添加积分 (需认证)
- `GET /api/points/history` - 积分历史 (需认证)

### 徽章
- `GET /api/badges` - 获取已获得徽章 (需认证)
- `GET /api/badges/all` - 获取所有徽章 (需认证)
- `POST /api/badges` - 授予徽章 (需认证)

### 统计
- `GET /api/stats` - 获取学习统计 (需认证)
- `PUT /api/stats` - 更新统计 (需认证)
- `POST /api/stats/checkin` - 每日打卡 (需认证)
- `GET /api/stats/checkin/history` - 打卡历史 (需认证)

### 错题本
- `GET /api/mistakes` - 获取错题 (需认证)
- `POST /api/mistakes` - 记录错题 (需认证)
- `PUT /api/mistakes/:id/review` - 标记已复习 (需认证)
- `DELETE /api/mistakes/:id` - 删除错题 (需认证)

### 对话历史
- `GET /api/dialogue` - 获取对话历史 (需认证)
- `POST /api/dialogue` - 保存对话 (需认证)
- `DELETE /api/dialogue/:id` - 删除对话 (需认证)
- `DELETE /api/dialogue` - 清空历史 (需认证)

完整 API 文档: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

## 部署

### Render.com 部署

1. **创建 PostgreSQL 数据库**
   - Dashboard → New → PostgreSQL
   - 复制 Internal Database URL

2. **创建 Web Service**
   - Dashboard → New → Web Service
   - 连接 GitHub 仓库
   - 配置:
     - Build Command: `cd server && npm ci`
     - Start Command: `cd server && npm start`
     - Root Directory: `/`

3. **配置环境变量**
   ```
   DATABASE_URL=<从数据库复制 Internal URL>
   JWT_SECRET=<使用 crypto.randomBytes(64).toString('hex') 生成>
   NODE_ENV=production
   ALLOWED_ORIGINS=https://your-frontend-url.github.io
   ```

4. **初始化数据库**
   - 使用 PgAdmin 连接到 Render 数据库（External URL）
   - 执行 `database/schema.sql`

详细步骤: [DATABASE_SETUP.md](./DATABASE_SETUP.md)

## 开发

### 添加新的 API 端点

1. **创建控制器** (`controllers/xxxController.js`)
```javascript
export const myFunction = async (req, res) => {
    try {
        const userId = req.user.id; // 从认证中间件获取
        // 业务逻辑
        res.json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, message: '错误信息' });
    }
};
```

2. **创建路由** (`routes/xxxRoutes.js`)
```javascript
import express from 'express';
import { myFunction } from '../controllers/xxxController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();
router.get('/', verifyToken, myFunction);
export default router;
```

3. **注册路由** (`server.js`)
```javascript
import xxxRoutes from './routes/xxxRoutes.js';
app.use('/api/xxx', xxxRoutes);
```

### 数据库查询示例

```javascript
// 简单查询
const result = await query('SELECT * FROM users WHERE id = $1', [userId]);

// 事务
const client = await getClient();
try {
    await client.query('BEGIN');
    await client.query('INSERT INTO ...');
    await client.query('UPDATE ...');
    await client.query('COMMIT');
} catch (error) {
    await client.query('ROLLBACK');
    throw error;
} finally {
    client.release();
}
```

## 测试

### 使用 curl 测试

```bash
# 注册
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser","password":"password123"}'

# 登录
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# 获取用户信息（需要 token）
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 使用 Postman

1. 导入环境变量:
   - `BASE_URL`: `http://localhost:3001`
   - `TOKEN`: (登录后获得)

2. 在请求头添加:
   - `Authorization`: `Bearer {{TOKEN}}`

## 故障排除

### 数据库连接失败

```bash
# 检查 PostgreSQL 服务
sudo systemctl status postgresql

# 检查连接字符串格式
postgresql://username:password@localhost:5432/database_name
```

### JWT 验证失败

- 检查 `JWT_SECRET` 是否设置
- 确认 token 格式: `Bearer <token>`
- 检查 token 是否过期（默认7天）

### CORS 错误

- 检查 `ALLOWED_ORIGINS` 环境变量
- 确保前端 URL 在允许列表中

## 性能优化

1. **数据库连接池**: 已配置（最大20个连接）
2. **索引**: 在 schema.sql 中已定义关键索引
3. **查询优化**: 使用 `EXPLAIN ANALYZE` 分析慢查询
4. **缓存**: 考虑使用 Redis（未实现）

## 安全最佳实践

✅ 已实现:
- 密码 bcrypt 加密（10轮）
- JWT token 认证
- SQL 参数化查询
- CORS 限制
- 速率限制
- Helmet 安全头

⚠️ 建议:
- 生产环境使用强 JWT 密钥
- 定期更新依赖包
- 启用 HTTPS
- 监控可疑登录

## 许可证

MIT

## 相关文档

- [API 文档](./API_DOCUMENTATION.md)
- [数据库设置](./DATABASE_SETUP.md)
- [数据库架构](../database/schema.sql)
