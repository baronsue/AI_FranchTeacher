function navigate(view) {
    window.dispatchEvent(new CustomEvent('navigate', { detail: { view } }));
}

export function createHeader() {
    const header = document.createElement('header');
    header.className = 'bg-white shadow-md sticky top-0 z-50';
    
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

                <div class="flex items-center">
                    <span class="text-sm font-medium text-gray-600 mr-3 hidden sm:block">你的AI法语老师</span>
                    <img class="h-12 w-12 rounded-full" src="https://r2.flowith.net/files/png/Y6F4R-ai_french_teacher_avatar_index_1@1024x1024.png" alt="Aurélie, AI老师">
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

    return header;
}
