// 认证服务 - 管理用户认证和令牌

// 自动检测环境：GitHub Pages 使用 Render 生产 URL，本地开发使用 localhost
const API_BASE_URL = window.location.hostname === 'baronsue.github.io'
    ? 'https://ai-franchteacher-auth.onrender.com/api'
    : 'http://localhost:3002/api';

console.log('[Auth] API Base URL:', API_BASE_URL);

class AuthService {
    constructor() {
        this.accessToken = localStorage.getItem('access_token');
        this.refreshToken = localStorage.getItem('refresh_token');
        this.user = JSON.parse(localStorage.getItem('user') || 'null');
    }

    // ============================================
    // 认证相关
    // ============================================

    /**
     * 用户注册
     */
    async register(username, email, password, displayName = '') {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username,
                    email,
                    password,
                    displayName: displayName || username
                })
            });

            const data = await response.json();

            if (data.success) {
                // 保存令牌和用户信息
                this.saveAuthData(data.data);
                return { success: true, user: data.data.user };
            } else {
                return { success: false, error: data.error };
            }
        } catch (error) {
            console.error('注册错误:', error);
            return { success: false, error: '网络错误，请检查认证服务器是否启动' };
        }
    }

    /**
     * 用户登录
     */
    async login(username, password) {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (data.success) {
                // 保存令牌和用户信息
                this.saveAuthData(data.data);
                return { success: true, user: data.data.user };
            } else {
                return { success: false, error: data.error };
            }
        } catch (error) {
            console.error('登录错误:', error);
            return { success: false, error: '网络错误，请检查认证服务器是否启动' };
        }
    }

    /**
     * 用户登出
     */
    async logout() {
        try {
            if (this.accessToken) {
                await fetch(`${API_BASE_URL}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.accessToken}`
                    },
                    body: JSON.stringify({
                        refreshToken: this.refreshToken
                    })
                });
            }
        } catch (error) {
            console.error('登出错误:', error);
        } finally {
            this.clearAuthData();
            window.location.hash = '#/login';
        }
    }

    /**
     * 刷新访问令牌
     */
    async refreshAccessToken() {
        try {
            if (!this.refreshToken) {
                throw new Error('没有刷新令牌');
            }

            const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    refreshToken: this.refreshToken
                })
            });

            const data = await response.json();

            if (data.success) {
                this.accessToken = data.data.accessToken;
                localStorage.setItem('access_token', this.accessToken);
                return true;
            } else {
                // 刷新令牌无效，需要重新登录
                this.clearAuthData();
                window.location.hash = '#/login';
                return false;
            }
        } catch (error) {
            console.error('刷新令牌错误:', error);
            this.clearAuthData();
            window.location.hash = '#/login';
            return false;
        }
    }

    /**
     * 检查是否已登录
     */
    isAuthenticated() {
        return !!this.accessToken && !!this.user;
    }

    /**
     * 获取当前用户
     */
    getCurrentUser() {
        return this.user;
    }

    /**
     * 获取完整的用户信息（从服务器）
     */
    async fetchCurrentUser() {
        try {
            const response = await this.authenticatedRequest('/auth/me');
            if (response.success) {
                this.user = response.data;
                localStorage.setItem('user', JSON.stringify(this.user));
                return this.user;
            }
            return null;
        } catch (error) {
            console.error('获取用户信息错误:', error);
            return null;
        }
    }

    // ============================================
    // HTTP请求辅助方法
    // ============================================

    /**
     * 发送经过认证的请求
     */
    async authenticatedRequest(endpoint, options = {}) {
        if (!this.accessToken) {
            throw new Error('未登录');
        }

        const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.accessToken}`
            }
        };

        const mergedOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, mergedOptions);
            const data = await response.json();

            // 如果令牌过期，尝试刷新
            if (response.status === 401 && data.code === 'TOKEN_EXPIRED') {
                const refreshed = await this.refreshAccessToken();
                if (refreshed) {
                    // 重新发送请求
                    mergedOptions.headers['Authorization'] = `Bearer ${this.accessToken}`;
                    const retryResponse = await fetch(url, mergedOptions);
                    return await retryResponse.json();
                }
            }

            return data;
        } catch (error) {
            console.error('请求错误:', error);
            throw error;
        }
    }

    /**
     * GET请求
     */
    async get(endpoint) {
        return this.authenticatedRequest(endpoint, { method: 'GET' });
    }

    /**
     * POST请求
     */
    async post(endpoint, data) {
        return this.authenticatedRequest(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * PUT请求
     */
    async put(endpoint, data) {
        return this.authenticatedRequest(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    /**
     * PATCH请求
     */
    async patch(endpoint, data) {
        return this.authenticatedRequest(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }

    /**
     * DELETE请求
     */
    async delete(endpoint) {
        return this.authenticatedRequest(endpoint, { method: 'DELETE' });
    }

    // ============================================
    // 数据管理
    // ============================================

    /**
     * 保存认证数据
     */
    saveAuthData(data) {
        this.accessToken = data.accessToken;
        this.refreshToken = data.refreshToken;
        this.user = data.user;

        localStorage.setItem('access_token', this.accessToken);
        localStorage.setItem('refresh_token', this.refreshToken);
        localStorage.setItem('user', JSON.stringify(this.user));
    }

    /**
     * 清除认证数据
     */
    clearAuthData() {
        this.accessToken = null;
        this.refreshToken = null;
        this.user = null;

        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
    }
}

// 导出单例
export const authService = new AuthService();
