const dynamicLoaders = {
    dashboard: {
        load: () => import('./views/dashboard_view.js'),
        exportName: 'renderDashboard',
    },
    course: {
        load: () => import('./views/course_view.js'),
        exportName: 'renderCourseMode',
    },
    dialogue: {
        load: () => import('./views/dialogue_view.js'),
        exportName: 'renderDialogueMode',
    },
    grammar: {
        load: () => import('./views/grammar_view.js'),
        exportName: 'renderGrammarView',
    },
    culture: {
        load: () => import('./views/culture_view.js'),
        exportName: 'renderCultureView',
    },
};

export async function navigateTo(view, container, routes = {}) {
    window.scrollTo(0, 0);

    try {
        container.innerHTML = ''; 
        
        const registeredRenderer = routes[view];
        if (typeof registeredRenderer === 'function') {
            registeredRenderer(container);
            return;
        }

        const loaderConfiguration = dynamicLoaders[view];
        if (!loaderConfiguration) {
            throw new Error(`Route non définie pour la vue : ${view}`);
        }
        
        const renderModule = await loaderConfiguration.load();
        const renderFunction = renderModule[loaderConfiguration.exportName];
        
        if (typeof renderFunction === 'function') {
            renderFunction(container);
        } else {
            throw new Error(`La fonction de rendu '${loaderConfiguration.exportName}' est introuvable pour la vue : ${view}`);
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
