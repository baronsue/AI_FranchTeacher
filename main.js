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
    lucide.createIcons();
    
    const headerContainer = document.getElementById('app-header');
    headerContainer.appendChild(createHeader());

    const appContainer = document.getElementById('app-container');

    window.addEventListener('navigate', (event) => {
        const { view } = event.detail;
        navigateTo(view, appContainer, routes);
    });

    navigateTo('dashboard', appContainer, routes);
}

document.addEventListener('DOMContentLoaded', initializeApp);
