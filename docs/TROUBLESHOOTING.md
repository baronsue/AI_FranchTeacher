# 故障排查手册

## 🚨 快速诊断

遇到问题？按照以下步骤快速诊断：

### 1. 检查所有服务状态

```bash
# 一键检查脚本
cat > check-status.sh << 'EOF'
#!/bin/bash

echo "======================================"
echo "AI FranchTeacher 系统状态检查"
echo "======================================"
echo ""

echo "1. 检查 PostgreSQL"
if command -v psql &> /dev/null; then
    echo "   ✅ PostgreSQL 已安装"
    psql --version

    # 检查服务状态
    if pgrep -x postgres > /dev/null; then
        echo "   ✅ PostgreSQL 正在运行"
    else
        echo "   ❌ PostgreSQL 未运行"
        echo "   → 启动命令: sudo systemctl start postgresql"
    fi
else
    echo "   ❌ PostgreSQL 未安装"
fi
echo ""

echo "2. 检查 Node.js"
if command -v node &> /dev/null; then
    echo "   ✅ Node.js 已安装"
    node --version
else
    echo "   ❌ Node.js 未安装"
fi
echo ""

echo "3. 检查端口占用"
echo "   前端 (8080):"
if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "   ✅ 端口 8080 已使用"
    lsof -i :8080
else
    echo "   ⚠️  端口 8080 空闲"
fi

echo ""
echo "   认证服务器 (3002):"
if lsof -Pi :3002 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "   ✅ 端口 3002 已使用"
    lsof -i :3002
else
    echo "   ⚠️  端口 3002 空闲"
fi

echo ""
echo "   Qwen 代理 (3001):"
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "   ✅ 端口 3001 已使用"
    lsof -i :3001
else
    echo "   ⚠️  端口 3001 空闲"
fi

echo ""
echo "   PostgreSQL (5432):"
if lsof -Pi :5432 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "   ✅ 端口 5432 已使用"
else
    echo "   ❌ 端口 5432 空闲 (PostgreSQL 未运行)"
fi

echo ""
echo "======================================"
echo "检查完成"
echo "======================================"
EOF

chmod +x check-status.sh
./check-status.sh
```

### 2. 测试网络连接

```bash
# 测试认证服务器
curl -v http://localhost:3002/health

# 测试数据库连接
curl -v http://localhost:3002/health/db

# 测试 Qwen 代理
curl -v http://localhost:3001/health

# 测试前端
curl -I http://localhost:8080
```

---

## 🔍 问题分类诊断

### A. 无法访问前端页面

#### 症状
- 浏览器显示 "无法访问此网站"
- 或显示 "ERR_CONNECTION_REFUSED"

#### 诊断步骤

1. **检查前端服务器是否运行**
   ```bash
   lsof -i :8080
   ```

   如果没有输出，说明前端服务器未启动。

2. **启动前端服务器**
   ```bash
   cd /path/to/AI_FranchTeacher
   python -m http.server 8080
   ```

3. **检查防火墙**
   ```bash
   # macOS
   sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate

   # Linux
   sudo ufw status
   ```

4. **尝试其他端口**
   ```bash
   python -m http.server 8081
   # 然后访问 http://localhost:8081
   ```

#### 解决方案

| 问题 | 解决方案 |
|------|----------|
| 端口被占用 | 使用其他端口或关闭占用进程 |
| 防火墙阻止 | 添加防火墙规则允许端口 |
| 权限问题 | 使用管理员权限启动 |

---

### B. 登录页面空白或出错

#### 症状
- 页面空白
- 控制台显示错误
- 无限加载

#### 诊断步骤

1. **打开浏览器开发者工具**
   - Chrome/Edge: F12
   - Firefox: F12
   - Safari: Cmd+Option+I

2. **查看 Console 标签**

   常见错误：

   **错误 A: CORS 错误**
   ```
   Access to fetch at 'http://localhost:3002/api/...' has been blocked by CORS policy
   ```

   **原因**: 认证服务器 CORS 配置不正确

   **解决**:
   ```bash
   # 检查 auth-server/.env
   ALLOWED_ORIGINS=http://localhost:8080,http://127.0.0.1:8080

   # 重启认证服务器
   cd auth-server
   npm run dev
   ```

   **错误 B: 网络错误**
   ```
   Failed to fetch
   TypeError: NetworkError when attempting to fetch resource
   ```

   **原因**: 认证服务器未运行

   **解决**:
   ```bash
   cd auth-server
   npm run dev
   ```

   **错误 C: 模块加载错误**
   ```
   Failed to load module script: Expected a JavaScript module script
   ```

   **原因**: 浏览器缓存问题

   **解决**:
   - 硬刷新: Ctrl+Shift+R (Windows/Linux) 或 Cmd+Shift+R (Mac)
   - 清除缓存
   - 使用隐私模式测试

3. **查看 Network 标签**

   检查请求状态：
   - 红色 = 失败
   - 200 = 成功
   - 404 = 未找到
   - 500 = 服务器错误

#### 快速修复清单

```bash
# 1. 清除浏览器缓存
# Chrome: Ctrl+Shift+Delete → 清除缓存

# 2. 清除 localStorage
# 浏览器控制台执行:
localStorage.clear()

# 3. 重启认证服务器
cd auth-server
# Ctrl+C 停止
npm run dev

# 4. 硬刷新页面
# Ctrl+Shift+R
```

---

### C. 注册/登录失败

#### 症状
- 点击注册/登录无响应
- 显示"网络错误"
- 显示"用户名或密码错误"

#### 诊断步骤

1. **检查认证服务器日志**
   ```bash
   # 在运行 npm run dev 的终端查看输出
   ```

   常见日志：
   ```
   ✅ 正常: POST /api/auth/login 200 OK
   ❌ 错误: POST /api/auth/login 500 Internal Server Error
   ```

2. **测试 API 直接调用**
   ```bash
   # 测试注册
   curl -X POST http://localhost:3002/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "username": "testuser",
       "email": "test@example.com",
       "password": "test123456",
       "displayName": "Test User"
     }'
   ```

   预期响应：
   ```json
   {
     "success": true,
     "message": "注册成功",
     "data": { ... }
   }
   ```

3. **检查数据库连接**
   ```bash
   curl http://localhost:3002/health/db
   ```

   如果返回错误，说明数据库连接有问题。

4. **检查数据库中的用户**
   ```sql
   -- 在 pgAdmin 中执行
   SELECT * FROM users;
   ```

#### 常见错误及解决

| 错误信息 | 原因 | 解决方案 |
|---------|------|----------|
| "用户名或邮箱已被使用" | 用户已存在 | 使用不同的用户名 |
| "密码长度至少为6个字符" | 密码太短 | 使用更长的密码 |
| "用户名只能包含字母、数字和下划线" | 用户名格式错误 | 修改用户名格式 |
| "数据库连接错误" | PostgreSQL 未运行 | 启动 PostgreSQL |
| "无效的令牌" | JWT 配置错误 | 检查 .env 中的 JWT_SECRET |

---

### D. 数据库连接失败

#### 症状
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

#### 完整诊断流程

```bash
# 1. 检查 PostgreSQL 服务
sudo systemctl status postgresql

# 如果未运行
sudo systemctl start postgresql

# 2. 检查端口
lsof -i :5432

# 3. 测试连接
psql -U postgres -d ai_franchteacher

# 4. 检查密码
psql -U postgres
# 提示输入密码，确认密码正确

# 5. 查看 PostgreSQL 日志
# macOS
tail -f /usr/local/var/log/postgres.log

# Linux
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

#### 重置 PostgreSQL 密码

如果忘记密码：

**方法 1: 使用 psql**
```bash
sudo -u postgres psql

# 在 psql 中执行
ALTER USER postgres PASSWORD 'new_password';
\q
```

**方法 2: 修改 pg_hba.conf**
```bash
# 找到配置文件
sudo find / -name pg_hba.conf 2>/dev/null

# 编辑文件，临时改为 trust
sudo nano /etc/postgresql/14/main/pg_hba.conf

# 找到这行：
# local   all   postgres   peer
# 改为：
# local   all   postgres   trust

# 重启 PostgreSQL
sudo systemctl restart postgresql

# 修改密码
psql -U postgres
ALTER USER postgres PASSWORD 'new_password';
\q

# 改回配置文件
# 重启 PostgreSQL
```

---

### E. JWT 令牌问题

#### 症状
- 登录后立即登出
- 显示"令牌已过期"
- 显示"无效的令牌"

#### 诊断

```javascript
// 浏览器控制台
console.log('Token:', localStorage.getItem('access_token'));
console.log('User:', localStorage.getItem('user'));
console.log('Refresh Token:', localStorage.getItem('refresh_token'));
```

#### 解决方案

1. **清除所有令牌**
   ```javascript
   localStorage.clear();
   // 刷新页面，重新登录
   ```

2. **检查 JWT 密钥**
   ```bash
   # 确认 .env 中有 JWT_SECRET
   cat auth-server/.env | grep JWT_SECRET

   # 如果为空或无效，生成新的
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

   # 更新 .env
   JWT_SECRET=<生成的密钥>
   ```

3. **清除数据库会话**
   ```sql
   -- 删除所有会话
   DELETE FROM user_sessions;
   ```

4. **重启认证服务器**
   ```bash
   cd auth-server
   npm run dev
   ```

---

### F. 端口冲突

#### 症状
```
Error: listen EADDRINUSE :::3002
```

#### 解决步骤

**步骤 1: 找到占用进程**

```bash
# macOS/Linux
lsof -ti:3002

# Windows
netstat -ano | findstr :3002
```

**步骤 2: 关闭进程**

```bash
# macOS/Linux
kill -9 <PID>

# 或一键关闭
lsof -ti:3002 | xargs kill -9

# Windows
taskkill /PID <PID> /F
```

**步骤 3: 更改端口（如果需要）**

```bash
# 修改 .env
PORT=3003

# 修改前端配置
# services/auth_service.js
const API_BASE_URL = 'http://localhost:3003/api';
```

---

### G. 权限错误

#### 症状
```
EACCES: permission denied
Error: EACCES: permission denied, open '.env'
```

#### 解决方案

```bash
# 修复文件权限
chmod 644 auth-server/.env
chmod 755 auth-server

# macOS/Linux: 修复 npm 权限
sudo chown -R $USER:$GROUP ~/.npm
sudo chown -R $USER:$GROUP ~/.config

# 重新安装依赖
cd auth-server
rm -rf node_modules
npm install
```

---

## 🛠️ 维护命令

### 数据库维护

```sql
-- 清理数据库
VACUUM ANALYZE;

-- 检查表大小
SELECT
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 查看活动连接
SELECT * FROM pg_stat_activity;

-- 终止闲置连接
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'ai_franchteacher'
  AND state = 'idle'
  AND state_change < current_timestamp - INTERVAL '1 hour';
```

### 清理测试数据

```sql
-- 谨慎：删除所有用户数据
DELETE FROM user_sessions;
DELETE FROM dialogue_history;
DELETE FROM user_mistakes;
DELETE FROM user_checkins;
DELETE FROM user_badges;
DELETE FROM user_points_history;
DELETE FROM user_points;
DELETE FROM user_stats;
DELETE FROM user_exercises;
DELETE FROM user_course_progress;
DELETE FROM users;

-- 重置序列
ALTER SEQUENCE users_id_seq RESTART WITH 1;
```

### 备份和恢复

```bash
# 备份
pg_dump -U postgres ai_franchteacher > backup_$(date +%Y%m%d).sql

# 压缩备份
gzip backup_$(date +%Y%m%d).sql

# 恢复
psql -U postgres ai_franchteacher < backup_20240117.sql
```

---

## 📞 寻求帮助

### 收集诊断信息

提交问题前，请收集以下信息：

```bash
# 创建诊断报告
cat > diagnostic-report.txt << EOF
=== 系统信息 ===
操作系统: $(uname -a)
Node.js: $(node --version)
npm: $(npm --version)
PostgreSQL: $(psql --version)

=== 端口状态 ===
$(lsof -i :8080)
$(lsof -i :3001)
$(lsof -i :3002)
$(lsof -i :5432)

=== 错误日志 ===
(请粘贴浏览器控制台错误)
(请粘贴服务器终端错误)

=== 配置信息 ===
# 注意：不要包含密码和密钥
$(cat auth-server/.env | grep -v PASSWORD | grep -v SECRET)

EOF

cat diagnostic-report.txt
```

### 提交 Issue

访问: https://github.com/baronsue/AI_FranchTeacher/issues

包含：
1. 问题描述
2. 复现步骤
3. 预期行为
4. 实际行为
5. 诊断报告
6. 截图（如果有）

---

## ✅ 验证检查清单

完成部署后，验证所有功能：

- [ ] PostgreSQL 正在运行
- [ ] 可以使用 pgAdmin 连接数据库
- [ ] 数据库包含 11 个表
- [ ] 认证服务器启动成功 (端口 3002)
- [ ] 健康检查返回正常: `curl http://localhost:3002/health`
- [ ] 数据库连接正常: `curl http://localhost:3002/health/db`
- [ ] 前端可以访问: http://localhost:8080
- [ ] 可以注册新用户
- [ ] 可以登录用户
- [ ] Header 显示用户信息
- [ ] 可以登出
- [ ] 未登录时自动跳转到登录页
- [ ] 数据库中可以看到用户记录

---

**故障排查完成！** 如问题仍未解决，请提交 Issue 或查看完整部署文档。
