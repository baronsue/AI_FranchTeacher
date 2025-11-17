import { authService } from '../services/auth_service.js';

export class AuthView {
    constructor() {
        this.container = null;
        this.mode = 'login'; // 'login' 或 'register'
    }

    render(container) {
        this.container = container;
        this.renderAuthForm();
    }

    renderAuthForm() {
        const isLogin = this.mode === 'login';

        this.container.innerHTML = `
            <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
                <div class="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg">
                    <!-- Logo和标题 -->
                    <div class="text-center">
                        <div class="flex justify-center mb-4">
                            <div class="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center text-white text-3xl">
                                🎓
                            </div>
                        </div>
                        <h2 class="text-3xl font-extrabold text-gray-900">
                            AI FranchTeacher
                        </h2>
                        <p class="mt-2 text-sm text-gray-600">
                            ${isLogin ? '登录您的账户' : '创建新账户'}
                        </p>
                    </div>

                    <!-- 表单 -->
                    <form id="authForm" class="mt-8 space-y-6">
                        <div id="errorMessage" class="hidden bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
                            <span class="block sm:inline"></span>
                        </div>

                        <div class="rounded-md shadow-sm space-y-4">
                            ${!isLogin ? `
                                <div>
                                    <label for="displayName" class="block text-sm font-medium text-gray-700 mb-1">
                                        显示名称
                                    </label>
                                    <input id="displayName" name="displayName" type="text"
                                           class="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                           placeholder="您的名字">
                                </div>
                            ` : ''}

                            <div>
                                <label for="username" class="block text-sm font-medium text-gray-700 mb-1">
                                    用户名 ${isLogin ? '或邮箱' : ''}
                                </label>
                                <input id="username" name="username" type="text" required
                                       class="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                       placeholder="${isLogin ? '用户名或邮箱' : '用户名（仅字母、数字、下划线）'}">
                            </div>

                            ${!isLogin ? `
                                <div>
                                    <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
                                        邮箱
                                    </label>
                                    <input id="email" name="email" type="email" required
                                           class="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                           placeholder="your@email.com">
                                </div>
                            ` : ''}

                            <div>
                                <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
                                    密码
                                </label>
                                <input id="password" name="password" type="password" required
                                       class="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                       placeholder="${isLogin ? '密码' : '至少6个字符'}">
                            </div>

                            ${!isLogin ? `
                                <div>
                                    <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">
                                        确认密码
                                    </label>
                                    <input id="confirmPassword" name="confirmPassword" type="password" required
                                           class="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                           placeholder="再次输入密码">
                                </div>
                            ` : ''}
                        </div>

                        <div>
                            <button type="submit" id="submitBtn"
                                    class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
                                <span class="absolute left-0 inset-y-0 flex items-center pl-3">
                                    <svg class="h-5 w-5 text-indigo-500 group-hover:text-indigo-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
                                    </svg>
                                </span>
                                ${isLogin ? '登录' : '注册'}
                            </button>
                        </div>

                        <div class="text-center">
                            <button type="button" id="switchModeBtn" class="text-sm text-indigo-600 hover:text-indigo-500">
                                ${isLogin ? '还没有账户？立即注册' : '已有账户？立即登录'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        this.attachEventListeners();
    }

    attachEventListeners() {
        const form = document.getElementById('authForm');
        const switchModeBtn = document.getElementById('switchModeBtn');

        form.addEventListener('submit', (e) => this.handleSubmit(e));
        switchModeBtn.addEventListener('click', () => this.switchMode());
    }

    async handleSubmit(e) {
        e.preventDefault();

        const submitBtn = document.getElementById('submitBtn');
        const errorMessage = document.getElementById('errorMessage');

        // 隐藏之前的错误消息
        errorMessage.classList.add('hidden');

        // 获取表单数据
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);

        // 验证
        if (this.mode === 'register') {
            if (data.password !== data.confirmPassword) {
                this.showError('两次输入的密码不一致');
                return;
            }

            if (data.password.length < 6) {
                this.showError('密码长度至少为6个字符');
                return;
            }

            if (!/^[a-zA-Z0-9_]+$/.test(data.username)) {
                this.showError('用户名只能包含字母、数字和下划线');
                return;
            }
        }

        // 禁用提交按钮
        submitBtn.disabled = true;
        submitBtn.textContent = this.mode === 'login' ? '登录中...' : '注册中...';

        try {
            let result;
            if (this.mode === 'login') {
                result = await authService.login(data.username, data.password);
            } else {
                result = await authService.register(
                    data.username,
                    data.email,
                    data.password,
                    data.displayName
                );
            }

            if (result.success) {
                // 登录/注册成功，跳转到主页
                window.location.hash = '#/dashboard';
            } else {
                this.showError(result.error || '操作失败，请重试');
            }
        } catch (error) {
            console.error('认证错误:', error);
            this.showError(error.message || '网络错误，请检查服务器是否启动');
        } finally {
            // 恢复提交按钮
            submitBtn.disabled = false;
            submitBtn.textContent = this.mode === 'login' ? '登录' : '注册';
        }
    }

    switchMode() {
        this.mode = this.mode === 'login' ? 'register' : 'login';
        this.renderAuthForm();
    }

    showError(message) {
        const errorMessage = document.getElementById('errorMessage');
        errorMessage.querySelector('span').textContent = message;
        errorMessage.classList.remove('hidden');

        // 3秒后自动隐藏
        setTimeout(() => {
            errorMessage.classList.add('hidden');
        }, 5000);
    }

    destroy() {
        this.container = null;
    }
}
