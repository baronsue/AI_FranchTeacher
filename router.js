import { authService } from './services/auth_service.js';
import { userDataService } from './services/user_data_service.js';

// 防止重定向循环的标志
let isRedirecting = false;
let redirectCount = 0;
const MAX_REDIRECTS = 3;

const dynamicLoaders = {
    login: {
        load: () => import('./views/auth_view.js'),
        exportName: 'AuthView',
        requireAuth: false,
        isClass: true
    },
    dashboard: {
        load: () => import('./views/dashboard_view.js'),
        exportName: 'renderDashboard',
        requireAuth: true,
    },
    course: {
        load: () => import('./views/course_view.js'),
        exportName: 'renderCourseMode',
        requireAuth: true,
    },
    dialogue: {
        load: () => import('./views/dialogue_view.js'),
        exportName: 'renderDialogueMode',
        requireAuth: true,
    },
    grammar: {
        load: () => import('./views/grammar_view.js'),
        exportName: 'renderGrammarView',
        requireAuth: true,
    },
    culture: {
        load: () => import('./views/culture_view.js'),
        exportName: 'renderCultureView',
        requireAuth: true,
    },
};

export async function navigateTo(view, container, routes = {}) {
    window.scrollTo(0, 0);

    try {
        // 检测重定向循环
        if (isRedirecting) {
            redirectCount++;
            if (redirectCount > MAX_REDIRECTS) {
                console.error('检测到重定向循环，停止重定向');
                isRedirecting = false;
                redirectCount = 0;
                container.innerHTML = `<div class="text-center p-8 bg-white rounded-lg shadow-md">
                    <h1 class="text-2xl font-bold text-red-600">导航错误</h1>
                    <p class="text-gray-600 mt-2">检测到重定向循环，请刷新页面重试。</p>
                </div>`;
                return;
            }
        } else {
            redirectCount = 0;
        }

        container.innerHTML = '';

        const registeredRenderer = routes[view];
        if (typeof registeredRenderer === 'function') {
            await registeredRenderer(container);
            isRedirecting = false;
            return;
        }

        const loaderConfiguration = dynamicLoaders[view];
        if (!loaderConfiguration) {
            throw new Error(`Route non définie pour la vue : ${view}`);
        }

        // 认证检查
        if (loaderConfiguration.requireAuth && !authService.isAuthenticated()) {
            console.log('需要登录，跳转到登录页面');
            isRedirecting = true;
            window.location.hash = '#/login';
            return;
        }

        // 如果已登录且访问登录页，跳转到dashboard
        if (view === 'login' && authService.isAuthenticated()) {
            isRedirecting = true;
            window.location.hash = '#/dashboard';
            return;
        }

        // 成功导航，重置重定向标志
        isRedirecting = false;
        redirectCount = 0;

        const renderModule = await loaderConfiguration.load();
        const renderFunction = renderModule[loaderConfiguration.exportName];

        // 支持类和函数两种形式
        if (loaderConfiguration.isClass) {
            const viewInstance = new renderFunction();
            viewInstance.render(container);
        } else if (typeof renderFunction === 'function') {
            await renderFunction(container);
        } else {
            throw new Error(`La fonction de rendu '${loaderConfiguration.exportName}' est introuvable pour la vue : ${view}`);
        }

        // 登录后首次访问时，尝试迁移本地数据
        if (loaderConfiguration.requireAuth && authService.isAuthenticated()) {
            const migrated = localStorage.getItem('data_migrated');
            if (!migrated) {
                console.log('首次登录，开始迁移本地数据...');
                await userDataService.migrateLocalData();
                localStorage.setItem('data_migrated', 'true');
            }
        }

    } catch (error) {
        console.error(`加载视图 '${view}' 时出错:`, error);
        container.innerHTML = `<div class="text-center p-8 bg-white rounded-lg shadow-md">
            <h1 class="text-2xl font-bold text-red-600">加载错误</h1>
            <p class="text-gray-600 mt-2">抱歉，加载此页面时发生错误。</p>
            <p class="text-sm text-gray-400 mt-4">详情: ${error.message}</p>
        </div>`;
    }
}
