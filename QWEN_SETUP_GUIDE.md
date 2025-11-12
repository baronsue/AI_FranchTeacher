# 通义千问 API 配置指南

## 快速开始（5分钟）

### 步骤 1：获取 API Key

1. **注册/登录阿里云**
   - 访问：https://www.aliyun.com/
   - 使用支付宝扫码或手机号注册

2. **开通通义千问服务**
   - 访问：https://dashscope.console.aliyun.com/
   - 首次使用会提示开通服务（免费）
   - 新用户赠送 100 万 tokens（约可用 1-2 个月）

3. **创建 API Key**
   - 访问：https://dashscope.console.aliyun.com/apiKey
   - 点击"创建新的API-KEY"
   - **复制并保存** API Key（只显示一次！）

### 步骤 2：在应用中配置

1. **刷新浏览器**打开你的法语学习应用
2. 进入**对话模式**
3. 点击右上角的 **"配置 API"** 按钮
4. 在弹窗中粘贴你的 API Key
5. 点击**"测试"**按钮验证连接
6. 点击**"保存"**完成配置

### 步骤 3：开始使用

- 确保 **AI 智能模式**开关是打开状态
- 输入法语问候：`Bonjour, je veux apprendre le français`
- 等待 1-3 秒（比免费 API 快很多！）
- 享受智能的法语对话！

---

## 价格说明

### 免费额度
- 新用户：**100 万 tokens**（约 50-100 小时对话）
- 每日限额：100 万 tokens/天

### 付费价格（超出免费额度后）
| 模型 | 价格 | 说明 |
|------|------|------|
| **qwen-turbo** (默认) | ¥0.002/千tokens | 最快，适合对话 |
| qwen-plus | ¥0.008/千tokens | 平衡速度和质量 |
| qwen-max | ¥0.04/千tokens | 最强推理能力 |

**实际成本估算**：
- 平均每次对话：约 200 tokens
- **¥0.002/千tokens** = 每 1000 次对话约 ¥0.40
- 相当于每小时对话成本 < ¥0.05

---

## 功能特点

### ✅ 相比免费 HuggingFace API

| 特性 | 通义千问 | HuggingFace 免费 |
|------|----------|-----------------|
| **响应速度** | 1-3 秒 ⚡ | 10-30 秒 🐌 |
| **中文支持** | 完美 ✓ | 一般 |
| **法语质量** | 优秀 ✓ | 中等 |
| **稳定性** | 99.9% ✓ | 经常不可用 ✗ |
| **速率限制** | 100万/天 | 很低 |

### 🎯 优化的提示词

系统已针对法语教学优化：
- 用简单清晰的法语回复（A1-B1 级别）
- 温柔纠正错误并给出示例
- 2-3 句话保持对话流畅
- 适时用中文解释复杂概念

---

## 故障排查

### 问题：保存后仍提示未配置

**解决方案**：
1. 确保 API Key 是完整的（以 `sk-` 开头）
2. 检查浏览器控制台是否有错误
3. 清除缓存后重新配置

### 问题：API 测试失败

**可能原因**：
1. **API Key 错误** - 重新复制粘贴
2. **服务未开通** - 访问 DashScope 控制台开通
3. **网络问题** - 检查网络连接
4. **额度用完** - 查看控制台使用情况

### 问题：回复还是很慢

**检查**：
1. 确认使用的是 `qwen-turbo` 模型
2. 查看控制台日志确认是否真的在使用 Qwen
3. 网络延迟问题

---

## 高级配置

### 切换模型

编辑 `services/qwen_service.js`：

```javascript
// 改为更强大的模型
let currentModel = QWEN_MODELS.plus;  // 或 max
```

### 调整回复长度

编辑 `services/qwen_service.js`：

```javascript
parameters: {
    max_tokens: 300,  // 增加到 300（更长回复）
    temperature: 1.0   // 增加创造性
}
```

### 查看使用统计

访问：https://dashscope.console.aliyun.com/usage

---

## 安全提示

⚠️ **保护你的 API Key**：
- 不要分享给他人
- 不要提交到 Git 仓库
- 如果泄露，立即在控制台删除并创建新的

✅ **Key 存储位置**：
- 浏览器 localStorage（本地存储）
- 不会上传到服务器
- 可随时在配置弹窗中更新

---

## 需要帮助？

### 官方文档
- API 文档：https://help.aliyun.com/zh/dashscope/
- 控制台：https://dashscope.console.aliyun.com/

### 常见问题
1. **没有支付宝**怎么注册？
   - 可以用手机号注册阿里云账号

2. **免费额度用完了怎么办**？
   - 可以充值继续使用（很便宜）
   - 或切换到免费的 HuggingFace API

3. **可以用其他 AI 吗**？
   - 可以！代码支持扩展，可以集成 OpenAI、Claude 等

---

## 效果对比示例

### 使用通义千问
**用户**: "Bonjour, je veux apprendre le présent"

**Aurélie** (1.5秒后):
> "Bonjour ! Le présent est très important. Par exemple : 'Je mange' (我吃), 'Tu parles' (你说). Quel verbe voulez-vous pratiquer ?"

### 使用免费 API
**用户**: "Bonjour, je veux apprendre le présent"

**Aurélie** (15秒后):
> "That's interesting. Can you tell me more?"

*明显可以看出通义千问的法语质量和响应速度都更好！*

---

## 开始配置！

1. 获取 API Key：https://dashscope.console.aliyun.com/apiKey
2. 打开应用 → 对话模式 → 配置 API
3. 粘贴并保存
4. 开始智能法语对话！

🎉 **配置完成后，你将拥有一个真正智能的法语老师！**

