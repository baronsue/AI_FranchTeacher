/**
 * 登录/注册模态框组件
 */

import { login, register } from '../services/auth_service.js';

/**
 * 显示登录模态框
 */
export function showLoginModal() {
    const modal = createAuthModal('login');
    document.body.appendChild(modal);
    // 聚焦到第一个输入框
    setTimeout(() => modal.querySelector('input').focus(), 100);
}

/**
 * 显示注册模态框
 */
export function showRegisterModal() {
    const modal = createAuthModal('register');
    document.body.appendChild(modal);
    setTimeout(() => modal.querySelector('input').focus(), 100);
}

/**
 * 创建认证模态框
 */
function createAuthModal(mode = 'login') {
    const isLogin = mode === 'login';

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 animate-fade-in';
    modal.id = 'auth-modal';

    modal.innerHTML = `
        <div class="bg-white rounded-2xl p-8 max-w-md w-full transform animate-scale-in">
            <!-- Header -->
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-2xl font-bold text-gray-900">
                    ${isLogin ? '登录' : '注册'} AI FranchTeacher
                </h2>
                <button id="close-auth-modal" class="p-2 hover:bg-gray-100 rounded-lg transition">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>

            <!-- Error Message -->
            <div id="auth-error" class="hidden mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm"></div>

            <!-- Success Message -->
            <div id="auth-success" class="hidden mb-4 p-3 bg-green-100 border border-green-300 text-green-700 rounded-lg text-sm"></div>

            <!-- Form -->
            <form id="auth-form" class="space-y-4">
                ${!isLogin ? `
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            用户名 <span class="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            required
                            pattern="[a-zA-Z0-9_]{3,20}"
                            title="3-20个字符，仅字母、数字、下划线"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="例如: zhang_san"
                        />
                        <p class="mt-1 text-xs text-gray-500">3-20个字符，仅字母、数字、下划线</p>
                    </div>
                ` : ''}

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                        邮箱${isLogin ? '或用户名' : ''} <span class="text-red-500">*</span>
                    </label>
                    <input
                        type="${isLogin ? 'text' : 'email'}"
                        id="email"
                        name="email"
                        required
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="${isLogin ? '邮箱或用户名' : '例如: user@example.com'}"
                    />
                </div>

                ${!isLogin ? `
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            显示名称
                        </label>
                        <input
                            type="text"
                            id="displayName"
                            name="displayName"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="例如: 张三（可选）"
                        />
                        <p class="mt-1 text-xs text-gray-500">用于显示的昵称，不填则使用用户名</p>
                    </div>
                ` : ''}

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                        密码 <span class="text-red-500">*</span>
                    </label>
                    <div class="relative">
                        <input
                            type="password"
                            id="password"
                            name="password"
                            required
                            minlength="6"
                            class="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="至少6个字符"
                        />
                        <button
                            type="button"
                            id="toggle-password"
                            class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                            </svg>
                        </button>
                    </div>
                    ${!isLogin ? '<p class="mt-1 text-xs text-gray-500">至少6个字符</p>' : ''}
                </div>

                ${!isLogin ? `
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            确认密码 <span class="text-red-500">*</span>
                        </label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            required
                            minlength="6"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="再次输入密码"
                        />
                    </div>
                ` : ''}

                <!-- Submit Button -->
                <button
                    type="submit"
                    id="auth-submit-btn"
                    class="w-full py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    ${isLogin ? '登录' : '注册'}
                </button>
            </form>

            <!-- Switch Mode -->
            <div class="mt-6 text-center">
                <p class="text-gray-600">
                    ${isLogin ? '还没有账号？' : '已有账号？'}
                    <button id="switch-auth-mode" class="text-blue-500 hover:text-blue-600 font-semibold">
                        ${isLogin ? '立即注册' : '立即登录'}
                    </button>
                </p>
            </div>

            ${isLogin ? `
                <div class="mt-4 text-center">
                    <button id="forgot-password" class="text-sm text-gray-500 hover:text-gray-700">
                        忘记密码？
                    </button>
                </div>
            ` : ''}
        </div>
    `;

    // 绑定事件
    bindAuthModalEvents(modal, isLogin);

    return modal;
}

/**
 * 绑定模态框事件
 */
function bindAuthModalEvents(modal, isLogin) {
    // 关闭按钮
    modal.querySelector('#close-auth-modal').addEventListener('click', () => {
        closeAuthModal(modal);
    });

    // 点击背景关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeAuthModal(modal);
        }
    });

    // ESC 键关闭
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            closeAuthModal(modal);
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);

    // 切换登录/注册模式
    const switchBtn = modal.querySelector('#switch-auth-mode');
    if (switchBtn) {
        switchBtn.addEventListener('click', () => {
            closeAuthModal(modal);
            setTimeout(() => {
                if (isLogin) {
                    showRegisterModal();
                } else {
                    showLoginModal();
                }
            }, 300);
        });
    }

    // 密码可见性切换
    const togglePasswordBtn = modal.querySelector('#toggle-password');
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', () => {
            const passwordInput = modal.querySelector('#password');
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
        });
    }

    // 表单提交
    const form = modal.querySelector('#auth-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleAuthSubmit(modal, isLogin);
    });

    // 忘记密码
    const forgotPasswordBtn = modal.querySelector('#forgot-password');
    if (forgotPasswordBtn) {
        forgotPasswordBtn.addEventListener('click', () => {
            showError(modal, '密码重置功能即将上线，请联系管理员。');
        });
    }
}

/**
 * 处理表单提交
 */
async function handleAuthSubmit(modal, isLogin) {
    const form = modal.querySelector('#auth-form');
    const submitBtn = modal.querySelector('#auth-submit-btn');
    const errorDiv = modal.querySelector('#auth-error');
    const successDiv = modal.querySelector('#auth-success');

    // 隐藏之前的消息
    errorDiv.classList.add('hidden');
    successDiv.classList.add('hidden');

    // 获取表单数据
    const formData = new FormData(form);
    const email = formData.get('email').trim();
    const password = formData.get('password');

    // 前端验证
    if (!email || !password) {
        showError(modal, '请填写所有必填字段');
        return;
    }

    if (password.length < 6) {
        showError(modal, '密码至少需要6个字符');
        return;
    }

    if (!isLogin) {
        const username = formData.get('username').trim();
        const confirmPassword = formData.get('confirmPassword');
        const displayName = formData.get('displayName').trim();

        if (!username) {
            showError(modal, '请输入用户名');
            return;
        }

        if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
            showError(modal, '用户名格式不正确（3-20个字符，仅字母、数字、下划线）');
            return;
        }

        if (password !== confirmPassword) {
            showError(modal, '两次输入的密码不一致');
            return;
        }
    }

    // 禁用提交按钮
    submitBtn.disabled = true;
    submitBtn.textContent = isLogin ? '登录中...' : '注册中...';

    try {
        let result;

        if (isLogin) {
            // 登录
            result = await login(email, password);
        } else {
            // 注册
            const username = formData.get('username').trim();
            const displayName = formData.get('displayName').trim() || username;
            result = await register(email, username, password, displayName);
        }

        if (result.success) {
            showSuccess(modal, isLogin ? '登录成功！' : '注册成功！');

            // 1秒后关闭模态框
            setTimeout(() => {
                closeAuthModal(modal);
                // 刷新页面或更新 UI
                window.location.reload();
            }, 1000);
        } else {
            showError(modal, result.message || '操作失败');
            submitBtn.disabled = false;
            submitBtn.textContent = isLogin ? '登录' : '注册';
        }
    } catch (error) {
        console.error('Auth error:', error);
        showError(modal, error.message || '网络错误，请稍后重试');
        submitBtn.disabled = false;
        submitBtn.textContent = isLogin ? '登录' : '注册';
    }
}

/**
 * 显示错误消息
 */
function showError(modal, message) {
    const errorDiv = modal.querySelector('#auth-error');
    const successDiv = modal.querySelector('#auth-success');

    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
    successDiv.classList.add('hidden');

    // 3秒后自动隐藏
    setTimeout(() => {
        errorDiv.classList.add('hidden');
    }, 5000);
}

/**
 * 显示成功消息
 */
function showSuccess(modal, message) {
    const errorDiv = modal.querySelector('#auth-error');
    const successDiv = modal.querySelector('#auth-success');

    successDiv.textContent = message;
    successDiv.classList.remove('hidden');
    errorDiv.classList.add('hidden');
}

/**
 * 关闭模态框
 */
function closeAuthModal(modal) {
    modal.style.animation = 'fadeOut 0.3s ease-out';
    setTimeout(() => {
        if (modal.parentNode) {
            modal.remove();
        }
    }, 300);
}
