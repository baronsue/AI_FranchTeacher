import { navigateTo } from './router.js';
import { createHeader } from './components/header.js';
import { renderDashboard } from './views/dashboard_view.js';
import { renderCourseMode } from './views/course_view.js';
import { renderEnhancedCourse } from './views/course_view_enhanced_entry.js';
import { renderDialogueMode } from './views/dialogue_view.js';
import { setQwenProxyUrl, testQwenAPI, getQwenModelInfo } from './services/qwen_service.js';
import { setAIProvider, AI_PROVIDERS } from './services/ai_service.js';
import { authService } from './services/auth_service.js';

const routes = {
    'dashboard': renderDashboard,
    'course': renderEnhancedCourse,  // 使用增强版课程视图
    'dialogue': renderDialogueMode,
};

// 从URL hash获取路由
function getRouteFromHash() {
    const hash = window.location.hash.slice(1); // 移除#
    if (hash.startsWith('/')) {
        return hash.slice(1); // 移除开头的/
    }
    return hash || 'dashboard';
}

function initializeApp() {
    const deployedProxy = 'https://qwen-proxy.onrender.com/qwen';
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
                console.info(result.message || '✓ 通义千问代理已就绪');
                setAIProvider(AI_PROVIDERS.QWEN);
            } else {
                console.warn('Qwen proxy not ready:', result.error);
                setAIProvider(AI_PROVIDERS.HUGGINGFACE);
                console.warn(
                    'AI 模式已启用，但未检测到通义千问代理。系统将临时使用免费的 HuggingFace API（响应较慢）。'
                );
            }
        })
        .catch((error) => {
            console.error('Failed to check Qwen proxy:', error);
            setAIProvider(AI_PROVIDERS.HUGGINGFACE);
            console.warn(
                '无法连接通义千问代理。请确保已启动 proxy 服务，或点击"配置 API"查看指南。'
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

        // 监听自定义导航事件
        window.addEventListener('navigate', (event) => {
            const { view } = event.detail;
            navigateTo(view, appContainer, routes);
        });

        // 监听URL hash变化
        window.addEventListener('hashchange', () => {
            const route = getRouteFromHash();
            navigateTo(route, appContainer, routes);
        });

        // 初始路由：检查登录状态
        const initialRoute = getRouteFromHash();
        const isAuthenticated = authService.isAuthenticated();

        if (!isAuthenticated && initialRoute !== 'login') {
            // 未登录且不是访问登录页，跳转到登录页
            window.location.hash = '#/login';
        } else if (isAuthenticated && initialRoute === 'login') {
            // 已登录但访问登录页，跳转到dashboard
            window.location.hash = '#/dashboard';
        } else {
            // 正常导航
            navigateTo(initialRoute, appContainer, routes);
        }
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
