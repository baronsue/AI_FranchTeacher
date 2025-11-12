import { navigateTo } from './router.js';
import { createHeader } from './components/header.js';
import { renderDashboard } from './views/dashboard_view.js';
import { renderCourseMode } from './views/course_view.js';
import { renderDialogueMode } from './views/dialogue_view.js';
import { setQwenProxyUrl, testQwenAPI, getQwenModelInfo } from './services/qwen_service.js';
import { setAIProvider, AI_PROVIDERS } from './services/ai_service.js';

const routes = {
    'dashboard': renderDashboard,
    'course': renderCourseMode,
    'dialogue': renderDialogueMode,
};

function initializeApp() {
    const deployedProxy = 'https://ai-teaher-otyeorynbe.cn-hangzhou.fcapp.run/qwen';
    const isLocal =
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname === '';
    const isPlaceholder =
        !deployedProxy ||
        deployedProxy.includes('<your-render-app>') ||
        deployedProxy.includes('<region>') ||
        deployedProxy.includes('<service>');

    if (!isLocal && !isPlaceholder) {
        setQwenProxyUrl(deployedProxy);
    } else if (isLocal) {
        console.info('[Qwen] 本地环境运行，使用默认代理地址 http://localhost:3001/qwen');
    } else {
        console.warn(
            '[Qwen] 未配置线上代理地址（仍包含占位符）。默认将尝试使用本地代理或回退到 HuggingFace。'
        );
    }

    testQwenAPI()
        .then((result) => {
            if (result.success) {
                const modelInfo = getQwenModelInfo();
                console.log('Using Qwen Proxy:', modelInfo);
                showNotification(result.message || '✓ 通义千问代理已就绪', 'success');
                setAIProvider(AI_PROVIDERS.QWEN);
            } else {
                console.warn('Qwen proxy not ready:', result.error);
                setAIProvider(AI_PROVIDERS.HUGGINGFACE);
                showNotification(
                    'AI 模式已启用，但未检测到通义千问代理。点击"配置 API"查看配置步骤，系统将临时使用免费的 HuggingFace API（响应较慢）。',
                    'warning'
                );
            }
        })
        .catch((error) => {
            console.error('Failed to check Qwen proxy:', error);
            setAIProvider(AI_PROVIDERS.HUGGINGFACE);
            showNotification(
                '无法连接通义千问代理。请确保已启动 proxy 服务，或点击"配置 API"查看指南。',
                'warning'
            );
        });

    try {
        lucide.createIcons();

        const headerContainer = document.getElementById('app-header');
        if (!headerContainer) {
            throw new Error('Header container not found');
        }
        headerContainer.appendChild(createHeader());

        const appContainer = document.getElementById('app-container');
        if (!appContainer) {
            throw new Error('App container not found');
        }

        window.addEventListener('navigate', (event) => {
            const { view } = event.detail;
            navigateTo(view, appContainer, routes);
        });

        navigateTo('dashboard', appContainer, routes);
    } catch (error) {
        console.error('Failed to initialize app:', error);
        document.body.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; height: 100vh; flex-direction: column; font-family: sans-serif;">
                <h1 style="color: #e53e3e;">应用初始化失败</h1>
                <p style="color: #718096;">请刷新页面重试。如果问题持续，请检查浏览器控制台。</p>
                <pre style="background: #f7fafc; padding: 1rem; border-radius: 0.5rem; margin-top: 1rem;">${error.message}</pre>
            </div>
        `;
    }
}

// 全局错误处理
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    event.preventDefault(); // 防止页面崩溃
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    event.preventDefault(); // 防止页面崩溃
});

document.addEventListener('DOMContentLoaded', initializeApp);
