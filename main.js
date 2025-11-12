import { navigateTo } from './router.js';
import { createHeader } from './components/header.js';
import { renderDashboard } from './views/dashboard_view.js';
import { renderCourseMode } from './views/course_view.js';
import { renderDialogueMode } from './views/dialogue_view.js';

const routes = {
    'dashboard': renderDashboard,
    'course': renderCourseMode,
    'dialogue': renderDialogueMode,
};

function initializeApp() {
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
