import { authService } from '../services/auth_service.js';

function navigate(view) {
    window.dispatchEvent(new CustomEvent('navigate', { detail: { view } }));
}

function escapeHtml(value) {
    if (value === undefined || value === null) {
        return '';
    }

    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export function createHeader() {
    const header = document.createElement('header');
    header.className = 'bg-white shadow-md sticky top-0 z-50';

    const isAuthenticated = authService.isAuthenticated();
    const user = isAuthenticated ? authService.getCurrentUser() : null;
    const safeDisplayName = user
        ? escapeHtml(user.displayName || user.display_name || user.username || '')
        : '';
    const safeAvatar = user ? escapeHtml(user.avatar || '🎓') : '';

    header.innerHTML = `
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between h-20">
                <div class="flex items-center cursor-pointer" id="home-link">
                    <img class="h-10 w-auto" src="https://r2.flowith.net/files/png/QE1EX-french_language_learning_app_logo_index_2@1024x1024.png" alt="App Logo">
                    <span class="ml-3 text-2xl font-bold text-[#333]">Aurélie</span>
                </div>

                ${isAuthenticated ? `
                    <nav class="hidden md:flex items-center space-x-8">
                        <a href="#" id="nav-dashboard" class="text-gray-600 hover:text-blue-600 font-medium transition-colors">学习面板</a>
                        <a href="#" id="nav-course" class="text-gray-600 hover:text-blue-600 font-medium transition-colors">课程模式</a>
                        <a href="#" id="nav-dialogue" class="text-gray-600 hover:text-blue-600 font-medium transition-colors">对话模式</a>
                        <a href="#" id="nav-culture" class="text-gray-600 hover:text-blue-600 font-medium transition-colors">文化探索</a>
                    </nav>

                    <!-- 移动端菜单按钮 -->
                    <button id="mobile-menu-btn" class="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors">
                        <i data-lucide="menu" class="w-6 h-6 text-gray-600"></i>
                    </button>
                ` : ''}

                <div class="flex items-center space-x-4">
                    ${isAuthenticated ? `
                        <!-- 用户信息 -->
                        <div class="flex items-center space-x-2">
                            <span class="text-sm font-medium text-gray-600 hidden sm:block">
                                ${safeDisplayName}
                            </span>
                            <div class="text-2xl">${safeAvatar || '🎓'}</div>
                        </div>
                        <!-- 登出按钮 -->
                        <button id="logout-btn" class="text-sm text-gray-600 hover:text-red-600 font-medium transition-colors">
                            <i data-lucide="log-out" class="w-5 h-5"></i>
                        </button>
                    ` : `
                        <!-- 未登录状态 -->
                        <span class="text-sm font-medium text-gray-600">你的AI法语老师</span>
                    `}
                </div>
            </div>
        </div>
        
        <!-- 移动端菜单面板 -->
        <div id="mobile-menu" class="hidden md:hidden bg-white border-t border-gray-200">
            <div class="px-4 py-3 space-y-2">
                <a href="#" class="mobile-nav-link block px-4 py-3 rounded-lg text-gray-600 hover:bg-blue-50 hover:text-blue-600 font-medium transition-colors" data-view="dashboard">
                    <i data-lucide="layout-dashboard" class="w-5 h-5 inline-block mr-2"></i>
                    学习面板
                </a>
                <a href="#" class="mobile-nav-link block px-4 py-3 rounded-lg text-gray-600 hover:bg-blue-50 hover:text-blue-600 font-medium transition-colors" data-view="course">
                    <i data-lucide="book-open" class="w-5 h-5 inline-block mr-2"></i>
                    课程模式
                </a>
                <a href="#" class="mobile-nav-link block px-4 py-3 rounded-lg text-gray-600 hover:bg-blue-50 hover:text-blue-600 font-medium transition-colors" data-view="dialogue">
                    <i data-lucide="message-circle" class="w-5 h-5 inline-block mr-2"></i>
                    对话模式
                </a>
                <a href="#" class="mobile-nav-link block px-4 py-3 rounded-lg text-gray-600 hover:bg-blue-50 hover:text-blue-600 font-medium transition-colors" data-view="culture">
                    <i data-lucide="globe" class="w-5 h-5 inline-block mr-2"></i>
                    文化探索
                </a>
            </div>
        </div>
    `;

    const handleNavClick = (e, view) => {
        e.preventDefault();
        navigate(view);
        
        // 关闭移动端菜单
        const mobileMenu = header.querySelector('#mobile-menu');
        if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
            mobileMenu.classList.add('hidden');
        }
    };

    // Logo点击 - 只在登录时导航到dashboard
    header.querySelector('#home-link').addEventListener('click', () => {
        if (isAuthenticated) {
            navigate('dashboard');
        }
    });

    // 导航链接 - 只在登录时存在
    if (isAuthenticated) {
        const navDashboard = header.querySelector('#nav-dashboard');
        const navCourse = header.querySelector('#nav-course');
        const navDialogue = header.querySelector('#nav-dialogue');
        const navCulture = header.querySelector('#nav-culture');

        if (navDashboard) navDashboard.addEventListener('click', (e) => handleNavClick(e, 'dashboard'));
        if (navCourse) navCourse.addEventListener('click', (e) => handleNavClick(e, 'course'));
        if (navDialogue) navDialogue.addEventListener('click', (e) => handleNavClick(e, 'dialogue'));
        if (navCulture) navCulture.addEventListener('click', (e) => handleNavClick(e, 'culture'));

        // 登出按钮
        const logoutBtn = header.querySelector('#logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                if (confirm('确定要登出吗？')) {
                    await authService.logout();
                }
            });
        }

        // 移动端菜单切换
        const mobileMenuBtn = header.querySelector('#mobile-menu-btn');
        const mobileMenu = header.querySelector('#mobile-menu');

        if (mobileMenuBtn && mobileMenu) {
            mobileMenuBtn.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
                const icon = mobileMenuBtn.querySelector('i');
                const isOpen = !mobileMenu.classList.contains('hidden');
                icon.setAttribute('data-lucide', isOpen ? 'x' : 'menu');
                lucide.createIcons();
            });
        }

        // 移动端导航链接
        header.querySelectorAll('.mobile-nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                const view = link.getAttribute('data-view');
                handleNavClick(e, view);
            });
        });
    }

    return header;
}
