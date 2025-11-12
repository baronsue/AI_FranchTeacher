# AI 集成说明

## 当前配置

项目已集成 **HuggingFace Inference API**（免费版），使用开源的多语言对话模型。

### 默认模型
- **主模型**: `meta-llama/Llama-2-7b-chat-hf` (Meta 的 Llama 2)
- **备用模型**: `microsoft/DialoGPT-medium`
- **多语言模型**: `bigscience/bloom-560m`

---

## 免费 API 的限制

HuggingFace 免费推理 API 有以下限制：
1. **速率限制**: 每小时有请求次数限制
2. **响应速度**: 免费服务器可能较慢（5-15秒）
3. **模型加载**: 首次请求时模型需要加载（可能需要 30 秒）
4. **可用性**: 服务器繁忙时可能不可用

---

## 升级选项

### 方案 1：使用 HuggingFace Token（推荐）

**优点**: 免费但更稳定，速率限制更高

**步骤**:
1. 注册 [HuggingFace 账号](https://huggingface.co/join)
2. 生成 API Token：https://huggingface.co/settings/tokens
3. 在 `services/ai_service.js` 中添加：

```javascript
headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_HF_TOKEN_HERE'  // 取消注释并替换
}
```

### 方案 2：使用 通义千问 Qwen API

**优点**: 中文和法语效果最好，响应快

**价格**: 约 ¥0.002/1K tokens

**步骤**:
1. 注册 [阿里云账号](https://www.aliyun.com/)
2. 开通通义千问服务并在控制台创建 API Key
3. 启动项目自带代理：
   ```bash
   cd proxy
   cp env.example .env   # 填入 QWEN_API_KEY
   npm install
   npm start
   ```
4. 在前端对话界面点击“配置 API”，测试连接是否成功
5. 代理正常后系统会自动切换到通义千问（无需修改前端代码）

### 方案 3：使用 OpenAI GPT-4

**优点**: 最佳效果，多语言能力强

**价格**: 约 $0.03/1K tokens

**步骤**:
1. 注册 [OpenAI 账号](https://platform.openai.com/)
2. 获取 API Key
3. 修改 `services/ai_service.js`：

```javascript
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_API_KEY = 'YOUR_OPENAI_KEY';

async function callOpenAI(messages) {
    const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: 'gpt-4',
            messages: messages,
            temperature: 0.8,
            max_tokens: 150
        })
    });
    return await response.json();
}
```

### 方案 4：本地部署 Ollama（完全免费）

**优点**: 完全免费，无限制，隐私安全

**缺点**: 需要本地安装，占用资源

**步骤**:
1. 安装 [Ollama](https://ollama.ai/)
2. 下载模型：`ollama pull llama2`
3. 启动服务：`ollama serve`
4. 修改 `services/ai_service.js` 调用本地 API：

```javascript
const OLLAMA_API_URL = 'http://localhost:11434/api/generate';

async function callOllama(messages) {
    const prompt = formatMessagesForModel(messages);
    const response = await fetch(OLLAMA_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: 'llama2',
            prompt: prompt,
            stream: false
        })
    });
    return await response.json();
}
```

---

## 功能说明

### AI 模式切换
- 在对话界面顶部有 **AI 智能模式** 开关
- 开启：使用 AI 生成智能回复
- 关闭：使用预设规则回复（速度快，无需网络）
- 点击旁边的“配置 API”按钮可查看代理配置步骤并测试连接

### 对话历史管理
- 自动保存最近 3 轮对话（6 条消息）
- 提供上下文连贯性

### 错误处理
- API 失败时自动回退到规则模式
- 显示友好的提示消息

---

## 测试建议

1. **刷新页面**
2. 打开对话模式
3. 确认 AI 模式开关是**打开**状态
4. 输入法语问候语如 "Bonjour, comment ça va?"
5. 等待 5-15 秒看到 AI 回复（首次可能需要更长时间）
6. 查看浏览器控制台是否有错误信息

---

## 故障排查

### 问题：AI 响应很慢
- **原因**: 免费 API 服务器负载高或模型正在加载
- **解决**: 等待或切换到规则模式，考虑升级到付费 API

### 问题：收到错误回复
- **原因**: API 速率限制或服务不可用
- **解决**: 查看控制台错误信息，系统会自动回退到规则模式

### 问题：回复是英文而非法语
- **原因**: 模型可能不理解指令
- **解决**: 考虑使用更好的模型（Qwen、GPT-4）

---

## 推荐配置

### 预算充足
**OpenAI GPT-4** - 效果最好，多语言支持完美

### 中等预算
**通义千问 Qwen** - 性价比高，中文和法语都很好

### 免费使用
**HuggingFace + Token** - 获取免费 token 提高稳定性

### 本地部署
**Ollama** - 完全免费，隐私安全，但需要配置

---

需要帮助配置其他 API？请告诉我你的选择！

