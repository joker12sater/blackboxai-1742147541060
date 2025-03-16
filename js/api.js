/**
 * API Client for WhisperNet Heritage Platform
 * Handles all HTTP requests to the backend API
 */
class ApiClient {
    constructor() {
        this.baseUrl = '/api';
        this.headers = {
            'Content-Type': 'application/json'
        };
    }

    /**
     * Set authentication token
     * @param {string} token JWT token
     */
    setAuthToken(token) {
        if (token) {
            this.headers['Authorization'] = `Bearer ${token}`;
        } else {
            delete this.headers['Authorization'];
        }
    }

    /**
     * Make HTTP request
     * @param {string} endpoint API endpoint
     * @param {Object} options Request options
     * @returns {Promise<Object>} Response data
     */
    async request(endpoint, options = {}) {
        try {
            const url = `${this.baseUrl}${endpoint}`;
            const response = await fetch(url, {
                ...options,
                headers: {
                    ...this.headers,
                    ...options.headers
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'API request failed');
            }

            return data;
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    }

    // Auth endpoints
    auth = {
        login: (credentials) => this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        }),

        register: (userData) => this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        }),

        refreshToken: () => this.request('/auth/refresh-token', {
            method: 'POST'
        }),

        logout: () => this.request('/auth/logout', {
            method: 'POST'
        }),

        resetPassword: (data) => this.request('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify(data)
        })
    };

    // Festival endpoints
    festival = {
        getAll: (params = {}) => this.request('/festival', {
            method: 'GET',
            params
        }),

        getById: (id) => this.request(`/festival/${id}`),

        getMap: () => this.request('/festival/map'),

        getGossip: () => this.request('/festival/gossip'),

        getARContent: () => this.request('/festival/ar'),

        getMerch: () => this.request('/festival/merch'),

        purchaseMerch: (data) => this.request('/festival/merch/purchase', {
            method: 'POST',
            body: JSON.stringify(data)
        })
    };

    // Confession endpoints
    confessions = {
        create: (confession) => this.request('/confessions', {
            method: 'POST',
            body: JSON.stringify(confession)
        }),

        getAll: (params = {}) => this.request('/confessions', {
            method: 'GET',
            params
        }),

        getById: (id) => this.request(`/confessions/${id}`),

        update: (id, data) => this.request(`/confessions/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }),

        delete: (id) => this.request(`/confessions/${id}`, {
            method: 'DELETE'
        }),

        react: (id, reaction) => this.request(`/confessions/${id}/react`, {
            method: 'POST',
            body: JSON.stringify({ reaction })
        }),

        comment: (id, comment) => this.request(`/confessions/${id}/comments`, {
            method: 'POST',
            body: JSON.stringify({ comment })
        })
    };

    // Payment endpoints
    payments = {
        createIntent: (data) => this.request('/payments/create-intent', {
            method: 'POST',
            body: JSON.stringify(data)
        }),

        processPayment: (data) => this.request('/payments/process', {
            method: 'POST',
            body: JSON.stringify(data)
        }),

        getSubscriptions: () => this.request('/payments/subscriptions'),

        subscribe: (plan) => this.request('/payments/subscribe', {
            method: 'POST',
            body: JSON.stringify({ plan })
        }),

        cancelSubscription: () => this.request('/payments/cancel-subscription', {
            method: 'POST'
        })
    };

    // User endpoints
    user = {
        getProfile: () => this.request('/user/profile'),

        updateProfile: (data) => this.request('/user/profile', {
            method: 'PUT',
            body: JSON.stringify(data)
        }),

        getNotifications: () => this.request('/user/notifications'),

        markNotificationRead: (id) => this.request(`/user/notifications/${id}`, {
            method: 'PUT'
        }),

        updatePreferences: (preferences) => this.request('/user/preferences', {
            method: 'PUT',
            body: JSON.stringify(preferences)
        })
    };

    // Analytics endpoints
    analytics = {
        trackEvent: (event) => this.request('/analytics/event', {
            method: 'POST',
            body: JSON.stringify(event)
        }),

        getDashboard: () => this.request('/analytics/dashboard'),

        getMetrics: (params) => this.request('/analytics/metrics', {
            method: 'GET',
            params
        })
    };
}

// Export singleton instance
export default new ApiClient();
