# AI FranchTeacher API 文档

完整的 RESTful API 文档，用于用户认证和学习数据管理。

## 基础信息

- **Base URL**: `http://localhost:3001/api` (开发环境)
- **Production URL**: `https://your-app.onrender.com/api`
- **认证方式**: JWT Bearer Token
- **数据格式**: JSON

## 认证 (Authentication)

### 1. 用户注册

**POST** `/api/auth/register`

注册新用户账号。

**请求体**:
```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "password123",
  "displayName": "Display Name" // 可选
}
```

**验证规则**:
- Email: 有效的邮箱格式
- Username: 3-20个字符，仅字母、数字、下划线
- Password: 最少6个字符

**响应** (201 Created):
```json
{
  "success": true,
  "message": "注册成功",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "username": "username",
      "displayName": "Display Name",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. 用户登录

**POST** `/api/auth/login`

使用邮箱或用户名登录。

**请求体**:
```json
{
  "email": "user@example.com", // 或使用 username
  "password": "password123"
}
```

**响应** (200 OK):
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "username": "username",
      "displayName": "Display Name",
      "avatarUrl": null
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 3. 获取当前用户信息

**GET** `/api/auth/me`

**Headers**: `Authorization: Bearer <token>`

**响应** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "username": "username",
    "display_name": "Display Name",
    "avatar_url": null,
    "total_points": 150,
    "daily_points": 20,
    "courses_completed": 2,
    "current_streak": 5,
    "max_streak": 10,
    "total_study_time": 3600,
    "badgesCount": 3
  }
}
```

### 4. 更新用户资料

**PUT** `/api/auth/profile`

**Headers**: `Authorization: Bearer <token>`

**请求体**:
```json
{
  "displayName": "New Name",
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

**响应** (200 OK):
```json
{
  "success": true,
  "message": "资料更新成功",
  "data": {
    "id": 1,
    "email": "user@example.com",
    "username": "username",
    "display_name": "New Name",
    "avatar_url": "https://example.com/avatar.jpg"
  }
}
```

### 5. 修改密码

**PUT** `/api/auth/password`

**Headers**: `Authorization: Bearer <token>`

**请求体**:
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

**响应** (200 OK):
```json
{
  "success": true,
  "message": "密码修改成功"
}
```

---

## 课程进度 (Progress)

### 1. 获取所有课程进度

**GET** `/api/progress`

**Headers**: `Authorization: Bearer <token>`

**响应** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "course_id": "lesson_1",
      "started": true,
      "completed": true,
      "score": 95,
      "attempts": 2,
      "time_spent": 1800,
      "exercises_completed": ["fill", "choice"],
      "started_at": "2024-01-01T00:00:00.000Z",
      "completed_at": "2024-01-01T01:00:00.000Z"
    }
  ]
}
```

### 2. 获取单个课程进度

**GET** `/api/progress/:courseId`

**Headers**: `Authorization: Bearer <token>`

**响应** (200 OK):
```json
{
  "success": true,
  "data": {
    "course_id": "lesson_1",
    "started": true,
    "completed": false,
    "score": 80,
    "attempts": 1,
    "time_spent": 900
  }
}
```

### 3. 更新课程进度

**PUT** `/api/progress/:courseId`

**Headers**: `Authorization: Bearer <token>`

**请求体**:
```json
{
  "started": true,
  "completed": false,
  "score": 85,
  "attempts": 1,
  "timeSpent": 600,
  "exercisesCompleted": ["fill", "choice"]
}
```

**响应** (200 OK):
```json
{
  "success": true,
  "message": "课程进度已更新",
  "data": { /* updated progress */ }
}
```

### 4. 重置课程进度

**DELETE** `/api/progress/:courseId`

**Headers**: `Authorization: Bearer <token>`

**响应** (200 OK):
```json
{
  "success": true,
  "message": "课程进度已重置"
}
```

---

## 积分系统 (Points)

### 1. 获取积分

**GET** `/api/points`

**Headers**: `Authorization: Bearer <token>`

**响应** (200 OK):
```json
{
  "success": true,
  "data": {
    "total": 350,
    "today": 50,
    "lastUpdated": "2024-01-01T12:00:00.000Z"
  }
}
```

### 2. 添加积分

**POST** `/api/points`

**Headers**: `Authorization: Bearer <token>`

**请求体**:
```json
{
  "amount": 20,
  "reason": "完成课程"
}
```

**响应** (200 OK):
```json
{
  "success": true,
  "message": "积分已添加",
  "data": {
    "total": 370,
    "today": 70,
    "added": 20
  }
}
```

### 3. 获取积分历史

**GET** `/api/points/history?limit=20`

**Headers**: `Authorization: Bearer <token>`

**响应** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "amount": 20,
      "reason": "完成课程",
      "created_at": "2024-01-01T12:00:00.000Z"
    }
  ]
}
```

---

## 徽章系统 (Badges)

### 1. 获取用户徽章

**GET** `/api/badges`

**Headers**: `Authorization: Bearer <token>`

**响应** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "first_lesson",
      "name": "初识法语",
      "description": "完成第一课",
      "icon": "🎯",
      "points": 10,
      "earnedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### 2. 获取所有可用徽章

**GET** `/api/badges/all`

**Headers**: `Authorization: Bearer <token>`

**响应** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "first_lesson",
      "name": "初识法语",
      "description": "完成第一课",
      "icon": "🎯",
      "points": 10,
      "earned": true,
      "earnedAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": "streak_3",
      "name": "坚持三天",
      "description": "连续学习3天",
      "icon": "🔥",
      "points": 30,
      "earned": false,
      "earnedAt": null
    }
  ]
}
```

### 3. 授予徽章

**POST** `/api/badges`

**Headers**: `Authorization: Bearer <token>`

**请求体**:
```json
{
  "badgeId": "first_lesson"
}
```

**响应** (200 OK):
```json
{
  "success": true,
  "message": "徽章已获得",
  "data": {
    "id": "first_lesson",
    "name": "初识法语",
    "icon": "🎯",
    "points": 10,
    "earnedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## 学习统计 (Stats)

### 1. 获取学习统计

**GET** `/api/stats`

**Headers**: `Authorization: Bearer <token>`

**响应** (200 OK):
```json
{
  "success": true,
  "data": {
    "courses_completed": 2,
    "exercises_completed": 50,
    "correct_answers": 120,
    "wrong_answers": 15,
    "words_learned": 150,
    "conversation_rounds": 30,
    "total_study_time": 7200,
    "current_streak": 5,
    "max_streak": 10,
    "last_study_date": "2024-01-01T12:00:00.000Z"
  }
}
```

### 2. 更新学习统计

**PUT** `/api/stats`

**Headers**: `Authorization: Bearer <token>`

**请求体** (所有字段都是增量):
```json
{
  "coursesCompleted": 1,
  "exercisesCompleted": 5,
  "correctAnswers": 10,
  "wrongAnswers": 2,
  "wordsLearned": 20,
  "conversationRounds": 1,
  "totalStudyTime": 600
}
```

**响应** (200 OK):
```json
{
  "success": true,
  "message": "学习统计已更新",
  "data": { /* updated stats */ }
}
```

### 3. 每日打卡

**POST** `/api/stats/checkin`

**Headers**: `Authorization: Bearer <token>`

**响应** (200 OK):
```json
{
  "success": true,
  "message": "打卡成功",
  "data": {
    "currentStreak": 6,
    "maxStreak": 10,
    "points": 10
  }
}
```

### 4. 获取打卡历史

**GET** `/api/stats/checkin/history?limit=30`

**Headers**: `Authorization: Bearer <token>`

**响应** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "checkin_date": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

## 错题本 (Mistakes)

### 1. 获取错题

**GET** `/api/mistakes?unreviewedOnly=false`

**Headers**: `Authorization: Bearer <token>`

**参数**:
- `unreviewedOnly`: 是否只返回未复习的错题 (true/false)

**响应** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "question_id": "q1",
      "exercise_type": "fill",
      "question": "Bonjour, comment ___ vous?",
      "user_answer": "est",
      "correct_answer": "allez",
      "wrong_count": 2,
      "reviewed": false,
      "last_attempt": "2024-01-01T12:00:00.000Z",
      "reviewed_at": null
    }
  ]
}
```

### 2. 记录错题

**POST** `/api/mistakes`

**Headers**: `Authorization: Bearer <token>`

**请求体**:
```json
{
  "questionId": "q1",
  "exerciseType": "fill",
  "question": "Bonjour, comment ___ vous?",
  "userAnswer": "est",
  "correctAnswer": "allez"
}
```

**响应** (200 OK):
```json
{
  "success": true,
  "message": "错题已记录",
  "data": { /* mistake record */ }
}
```

### 3. 标记为已复习

**PUT** `/api/mistakes/:mistakeId/review`

**Headers**: `Authorization: Bearer <token>`

**响应** (200 OK):
```json
{
  "success": true,
  "message": "已标记为已复习",
  "data": { /* updated mistake */ }
}
```

### 4. 删除错题

**DELETE** `/api/mistakes/:mistakeId`

**Headers**: `Authorization: Bearer <token>`

**响应** (200 OK):
```json
{
  "success": true,
  "message": "错题已删除"
}
```

---

## AI对话历史 (Dialogue)

### 1. 获取对话历史

**GET** `/api/dialogue?limit=50&offset=0`

**Headers**: `Authorization: Bearer <token>`

**响应** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_message": "Comment dit-on 'hello' en français?",
      "ai_response": "On dit 'Bonjour' en français.",
      "created_at": "2024-01-01T12:00:00.000Z"
    }
  ]
}
```

### 2. 保存对话

**POST** `/api/dialogue`

**Headers**: `Authorization: Bearer <token>`

**请求体**:
```json
{
  "userMessage": "Comment dit-on 'hello' en français?",
  "aiResponse": "On dit 'Bonjour' en français."
}
```

**响应** (200 OK):
```json
{
  "success": true,
  "message": "对话已保存",
  "data": { /* dialogue record */ }
}
```

### 3. 删除对话

**DELETE** `/api/dialogue/:dialogueId`

**Headers**: `Authorization: Bearer <token>`

**响应** (200 OK):
```json
{
  "success": true,
  "message": "对话记录已删除"
}
```

### 4. 清空对话历史

**DELETE** `/api/dialogue`

**Headers**: `Authorization: Bearer <token>`

**响应** (200 OK):
```json
{
  "success": true,
  "message": "对话历史已清空"
}
```

---

## 错误响应

所有错误响应遵循统一格式：

```json
{
  "success": false,
  "message": "错误描述"
}
```

### 常见状态码

- `200 OK`: 请求成功
- `201 Created`: 资源创建成功
- `400 Bad Request`: 请求参数错误
- `401 Unauthorized`: 未授权或token无效
- `403 Forbidden`: 无权访问
- `404 Not Found`: 资源不存在
- `500 Internal Server Error`: 服务器内部错误

---

## 速率限制

- 一般API: 15分钟内最多100个请求
- 登录/注册: 15分钟内最多5个请求

超过限制返回 429 状态码：
```json
{
  "success": false,
  "message": "请求过于频繁，请稍后再试"
}
```

---

## 使用示例

### JavaScript Fetch

```javascript
// 登录
const login = async (email, password) => {
  const response = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();

  if (data.success) {
    localStorage.setItem('token', data.data.token);
    return data.data.user;
  }

  throw new Error(data.message);
};

// 获取课程进度（需要认证）
const getProgress = async (courseId) => {
  const token = localStorage.getItem('token');

  const response = await fetch(`http://localhost:3001/api/progress/${courseId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();
  return data.data;
};
```

---

## 安全建议

1. **生产环境JWT密钥**: 使用强随机字符串
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

2. **HTTPS**: 生产环境必须使用 HTTPS

3. **密码**: 已使用 bcrypt 加密（10轮）

4. **Token有效期**: 默认7天，可配置

5. **CORS**: 配置允许的来源域名

6. **速率限制**: 已启用，防止暴力攻击
