import { isLoggedIn, getCurrentUser, logout } from '../services/auth_service.js';
import { showLoginModal, showRegisterModal } from './auth_modal.js';

function navigate(view) {
    window.dispatchEvent(new CustomEvent('navigate', { detail: { view } }));
}

export function createHeader() {
    const header = document.createElement('header');
    header.className = 'bg-white shadow-md sticky top-0 z-50';

    const user = getCurrentUser();
    const loggedIn = isLoggedIn();

    header.innerHTML = `
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between h-20">
                <div class="flex items-center cursor-pointer" id="home-link">
                    <img class="h-10 w-auto" src="https://r2.flowith.net/files/png/QE1EX-french_language_learning_app_logo_index_2@1024x1024.png" alt="App Logo">
                    <span class="ml-3 text-2xl font-bold text-[#333]">Aurélie</span>
                </div>

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

                <div class="flex items-center gap-4">
                    ${loggedIn ? `
                        <!-- 已登录：显示用户信息 -->
                        <div class="relative">
                            <button id="user-menu-btn" class="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                                <div class="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold">
                                    ${(user?.displayName || user?.username || 'U').charAt(0).toUpperCase()}
                                </div>
                                <span class="hidden sm:block text-sm font-medium text-gray-700">${user?.displayName || user?.username || '用户'}</span>
                                <i data-lucide="chevron-down" class="w-4 h-4 text-gray-500"></i>
                            </button>

                            <!-- 用户菜单下拉 -->
                            <div id="user-menu-dropdown" class="hidden absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                                <div class="px-4 py-2 border-b border-gray-200">
                                    <p class="text-sm font-semibold text-gray-900">${user?.displayName || user?.username}</p>
                                    <p class="text-xs text-gray-500">${user?.email || ''}</p>
                                </div>
                                <a href="#" id="menu-profile" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                    <i data-lucide="user" class="w-4 h-4 inline-block mr-2"></i>
                                    个人资料
                                </a>
                                <a href="#" id="menu-settings" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                    <i data-lucide="settings" class="w-4 h-4 inline-block mr-2"></i>
                                    设置
                                </a>
                                <button id="menu-logout" class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                                    <i data-lucide="log-out" class="w-4 h-4 inline-block mr-2"></i>
                                    退出登录
                                </button>
                            </div>
                        </div>
                    ` : `
                        <!-- 未登录：显示登录/注册按钮 -->
                        <button id="login-btn" class="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium transition-colors">
                            登录
                        </button>
                        <button id="register-btn" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium transition-colors">
                            注册
                        </button>
                    `}

                    <div class="hidden sm:flex items-center">
                        <span class="text-sm font-medium text-gray-600 mr-3">你的AI法语老师</span>
                        <img class="h-12 w-12 rounded-full" src="https://r2.flowith.net/files/png/Y6F4R-ai_french_teacher_avatar_index_1@1024x1024.png" alt="Aurélie, AI老师">
                    </div>
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

    header.querySelector('#home-link').addEventListener('click', () => navigate('dashboard'));
    header.querySelector('#nav-dashboard').addEventListener('click', (e) => handleNavClick(e, 'dashboard'));
    header.querySelector('#nav-course').addEventListener('click', (e) => handleNavClick(e, 'course'));
    header.querySelector('#nav-dialogue').addEventListener('click', (e) => handleNavClick(e, 'dialogue'));
    header.querySelector('#nav-culture').addEventListener('click', (e) => handleNavClick(e, 'culture'));

    // 认证按钮事件
    if (loggedIn) {
        // 用户菜单切换
        const userMenuBtn = header.querySelector('#user-menu-btn');
        const userMenuDropdown = header.querySelector('#user-menu-dropdown');

        userMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            userMenuDropdown.classList.toggle('hidden');
            lucide.createIcons();
        });

        // 点击其他地方关闭下拉菜单
        document.addEventListener('click', () => {
            if (!userMenuDropdown.classList.contains('hidden')) {
                userMenuDropdown.classList.add('hidden');
            }
        });

        // 个人资料
        header.querySelector('#menu-profile')?.addEventListener('click', (e) => {
            e.preventDefault();
            userMenuDropdown.classList.add('hidden');
            // TODO: 显示个人资料页面
            console.log('个人资料功能即将上线');
        });

        // 设置
        header.querySelector('#menu-settings')?.addEventListener('click', (e) => {
            e.preventDefault();
            userMenuDropdown.classList.add('hidden');
            // TODO: 显示设置页面
            console.log('设置功能即将上线');
        });

        // 登出
        header.querySelector('#menu-logout')?.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('确定要退出登录吗？')) {
                logout();
                window.location.reload();
            }
        });
    } else {
        // 登录按钮
        header.querySelector('#login-btn')?.addEventListener('click', () => {
            showLoginModal();
        });

        // 注册按钮
        header.querySelector('#register-btn')?.addEventListener('click', () => {
            showRegisterModal();
        });
    }

    // 移动端菜单切换
    const mobileMenuBtn = header.querySelector('#mobile-menu-btn');
    const mobileMenu = header.querySelector('#mobile-menu');

    mobileMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
        const icon = mobileMenuBtn.querySelector('i');
        const isOpen = !mobileMenu.classList.contains('hidden');
        icon.setAttribute('data-lucide', isOpen ? 'x' : 'menu');
        lucide.createIcons();
    });

    // 移动端导航链接
    header.querySelectorAll('.mobile-nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            const view = link.getAttribute('data-view');
            handleNavClick(e, view);
        });
    });

    // 监听认证事件（登录/登出后刷新header）
    window.addEventListener('auth:login', () => {
        setTimeout(() => window.location.reload(), 500);
    });

    window.addEventListener('auth:logout', () => {
        setTimeout(() => window.location.reload(), 500);
    });

    return header;
}
