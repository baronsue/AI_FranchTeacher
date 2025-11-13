/**
 * 用户认证服务
 * 处理注册、登录、token管理
 */

// API 基础 URL
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3001/api'
    : 'https://your-api.onrender.com/api'; // TODO: 替换为实际的 Render API URL

const TOKEN_KEY = 'aurelie_auth_token';
const USER_KEY = 'aurelie_user_info';

/**
 * 获取存储的 token
 */
export function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

/**
 * 保存 token
 */
function saveToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
}

/**
 * 删除 token
 */
function removeToken() {
    localStorage.removeItem(TOKEN_KEY);
}

/**
 * 获取存储的用户信息
 */
export function getCurrentUser() {
    const userJson = localStorage.getItem(USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
}

/**
 * 保存用户信息
 */
function saveUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/**
 * 删除用户信息
 */
function removeUser() {
    localStorage.removeItem(USER_KEY);
}

/**
 * 检查是否已登录
 */
export function isLoggedIn() {
    return !!getToken();
}

/**
 * API 请求封装
 */
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = getToken();

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    // 如果有 token，添加到请求头
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        ...options,
        headers,
    };

    try {
        const response = await fetch(url, config);
        const data = await response.json();

        if (!response.ok) {
            // 如果是 401 未授权，清除本地认证信息
            if (response.status === 401) {
                removeToken();
                removeUser();
                // 触发登录提示
                window.dispatchEvent(new CustomEvent('auth:unauthorized'));
            }

            throw new Error(data.message || '请求失败');
        }

        return data;
    } catch (error) {
        console.error('API request failed:', error);
        throw error;
    }
}

/**
 * 用户注册
 */
export async function register(email, username, password, displayName) {
    const data = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, username, password, displayName }),
    });

    if (data.success) {
        saveToken(data.data.token);
        saveUser(data.data.user);
        window.dispatchEvent(new CustomEvent('auth:login', { detail: data.data.user }));
    }

    return data;
}

/**
 * 用户登录
 */
export async function login(email, password) {
    const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });

    if (data.success) {
        saveToken(data.data.token);
        saveUser(data.data.user);
        window.dispatchEvent(new CustomEvent('auth:login', { detail: data.data.user }));
    }

    return data;
}

/**
 * 用户登出
 */
export function logout() {
    removeToken();
    removeUser();
    window.dispatchEvent(new CustomEvent('auth:logout'));
}

/**
 * 获取当前用户完整信息（从服务器）
 */
export async function fetchCurrentUser() {
    if (!isLoggedIn()) {
        return null;
    }

    try {
        const data = await apiRequest('/auth/me');
        if (data.success) {
            saveUser(data.data);
            return data.data;
        }
    } catch (error) {
        console.error('Failed to fetch current user:', error);
        return null;
    }
}

/**
 * 更新用户资料
 */
export async function updateProfile(displayName, avatarUrl) {
    const data = await apiRequest('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ displayName, avatarUrl }),
    });

    if (data.success) {
        saveUser(data.data);
        window.dispatchEvent(new CustomEvent('auth:profileUpdate', { detail: data.data }));
    }

    return data;
}

/**
 * 修改密码
 */
export async function changePassword(currentPassword, newPassword) {
    return await apiRequest('/auth/password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
    });
}

/**
 * 课程进度 API
 */
export const progressAPI = {
    async getAll() {
        const data = await apiRequest('/progress');
        return data.success ? data.data : [];
    },

    async get(courseId) {
        const data = await apiRequest(`/progress/${courseId}`);
        return data.success ? data.data : null;
    },

    async update(courseId, progressData) {
        const data = await apiRequest(`/progress/${courseId}`, {
            method: 'PUT',
            body: JSON.stringify(progressData),
        });
        return data;
    },

    async reset(courseId) {
        const data = await apiRequest(`/progress/${courseId}`, {
            method: 'DELETE',
        });
        return data;
    },
};

/**
 * 积分 API
 */
export const pointsAPI = {
    async get() {
        const data = await apiRequest('/points');
        return data.success ? data.data : { total: 0, today: 0 };
    },

    async add(amount, reason) {
        const data = await apiRequest('/points', {
            method: 'POST',
            body: JSON.stringify({ amount, reason }),
        });
        return data;
    },

    async getHistory(limit = 20) {
        const data = await apiRequest(`/points/history?limit=${limit}`);
        return data.success ? data.data : [];
    },
};

/**
 * 徽章 API
 */
export const badgesAPI = {
    async getUserBadges() {
        const data = await apiRequest('/badges');
        return data.success ? data.data : [];
    },

    async getAllBadges() {
        const data = await apiRequest('/badges/all');
        return data.success ? data.data : [];
    },

    async award(badgeId) {
        const data = await apiRequest('/badges', {
            method: 'POST',
            body: JSON.stringify({ badgeId }),
        });
        return data;
    },
};

/**
 * 学习统计 API
 */
export const statsAPI = {
    async get() {
        const data = await apiRequest('/stats');
        return data.success ? data.data : {};
    },

    async update(stats) {
        const data = await apiRequest('/stats', {
            method: 'PUT',
            body: JSON.stringify(stats),
        });
        return data;
    },

    async checkIn() {
        const data = await apiRequest('/stats/checkin', {
            method: 'POST',
        });
        return data;
    },

    async getCheckInHistory(limit = 30) {
        const data = await apiRequest(`/stats/checkin/history?limit=${limit}`);
        return data.success ? data.data : [];
    },
};

/**
 * 错题本 API
 */
export const mistakesAPI = {
    async getAll(unreviewedOnly = false) {
        const data = await apiRequest(`/mistakes?unreviewedOnly=${unreviewedOnly}`);
        return data.success ? data.data : [];
    },

    async record(mistake) {
        const data = await apiRequest('/mistakes', {
            method: 'POST',
            body: JSON.stringify(mistake),
        });
        return data;
    },

    async markReviewed(mistakeId) {
        const data = await apiRequest(`/mistakes/${mistakeId}/review`, {
            method: 'PUT',
        });
        return data;
    },

    async delete(mistakeId) {
        const data = await apiRequest(`/mistakes/${mistakeId}`, {
            method: 'DELETE',
        });
        return data;
    },
};

/**
 * AI对话历史 API
 */
export const dialogueAPI = {
    async getHistory(limit = 50, offset = 0) {
        const data = await apiRequest(`/dialogue?limit=${limit}&offset=${offset}`);
        return data.success ? data.data : [];
    },

    async save(userMessage, aiResponse) {
        const data = await apiRequest('/dialogue', {
            method: 'POST',
            body: JSON.stringify({ userMessage, aiResponse }),
        });
        return data;
    },

    async delete(dialogueId) {
        const data = await apiRequest(`/dialogue/${dialogueId}`, {
            method: 'DELETE',
        });
        return data;
    },

    async clearAll() {
        const data = await apiRequest('/dialogue', {
            method: 'DELETE',
        });
        return data;
    },
};
