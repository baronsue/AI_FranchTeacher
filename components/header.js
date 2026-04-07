import { authService } from '../services/auth_service.js';
import { appLogoUrl } from '../utils/static_assets.js';

function navigate(view) {
    const path = view.startsWith('/') ? view : `/${view}`;
    window.location.hash = `#${path}`;
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
        <div class="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 min-w-0">
            <div class="flex items-center justify-between gap-2 h-16 sm:h-20 min-w-0">
                <div class="flex items-center cursor-pointer min-w-0 shrink gap-2 sm:gap-3" id="home-link">
                    <img class="h-8 w-8 sm:h-10 sm:w-10 shrink-0 rounded-lg object-cover" src="${appLogoUrl}" width="40" height="40" alt="" decoding="async">
                    <span class="text-lg sm:text-2xl font-bold text-[#333] truncate">Aurélie</span>
                </div>

                ${isAuthenticated ? `
                    <nav class="hidden md:flex items-center space-x-6 lg:space-x-8 shrink-0">
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

                <div class="flex items-center gap-1 sm:gap-3 shrink-0 min-w-0">
                    ${isAuthenticated ? `
                        <!-- 用户信息 -->
                        <div class="flex items-center gap-1 sm:gap-2 min-w-0 max-w-[40vw] sm:max-w-none">
                            <span class="text-xs sm:text-sm font-medium text-gray-600 truncate hidden sm:block max-w-[120px] md:max-w-[200px]" title="${safeDisplayName}">
                                ${safeDisplayName}
                            </span>
                            <div class="text-xl sm:text-2xl shrink-0" aria-hidden="true">${safeAvatar || '🎓'}</div>
                        </div>
                        <!-- 登出按钮 -->
                        <button type="button" id="logout-btn" class="p-2 text-gray-600 hover:text-red-600 transition-colors shrink-0" title="登出">
                            <i data-lucide="log-out" class="w-5 h-5"></i>
                        </button>
                    ` : `
                        <!-- 未登录状态 -->
                        <span class="text-xs sm:text-sm font-medium text-gray-600 truncate max-w-[32vw] sm:max-w-none">你的AI法语老师</span>
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
