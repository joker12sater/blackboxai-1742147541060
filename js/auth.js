import api from './api.js';

/**
 * Authentication Module
 * Handles user authentication, session management, and authorization
 */
class Auth {
    constructor() {
        this.token = localStorage.getItem('token');
        this.user = JSON.parse(localStorage.getItem('user'));
        this.refreshTokenTimeout = null;

        // Initialize API client with stored token
        if (this.token) {
            api.setAuthToken(this.token);
            this.startTokenRefreshTimer();
        }
    }

    /**
     * Login user
     * @param {Object} credentials User credentials
     * @returns {Promise<Object>} User data
     */
    async login(credentials) {
        try {
            const response = await api.auth.login(credentials);
            this.setSession(response.token, response.user);
            return response.user;
        } catch (error) {
            console.error('Login Error:', error);
            throw error;
        }
    }

    /**
     * Register new user
     * @param {Object} userData User registration data
     * @returns {Promise<Object>} User data
     */
    async register(userData) {
        try {
            const response = await api.auth.register(userData);
            this.setSession(response.token, response.user);
            return response.user;
        } catch (error) {
            console.error('Registration Error:', error);
            throw error;
        }
    }

    /**
     * Logout user
     */
    async logout() {
        try {
            await api.auth.logout();
        } catch (error) {
            console.error('Logout Error:', error);
        } finally {
            this.clearSession();
        }
    }

    /**
     * Set user session
     * @param {string} token JWT token
     * @param {Object} user User data
     */
    setSession(token, user) {
        this.token = token;
        this.user = user;

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        api.setAuthToken(token);
        this.startTokenRefreshTimer();
    }

    /**
     * Clear user session
     */
    clearSession() {
        this.token = null;
        this.user = null;

        localStorage.removeItem('token');
        localStorage.removeItem('user');

        api.setAuthToken(null);
        this.stopTokenRefreshTimer();
    }

    /**
     * Start token refresh timer
     */
    startTokenRefreshTimer() {
        this.stopTokenRefreshTimer();

        // Decode token to get expiration
        const tokenData = this.decodeToken(this.token);
        const expiresIn = (tokenData.exp * 1000) - Date.now();

        // Refresh 5 minutes before expiration
        const refreshTime = Math.max(0, expiresIn - (5 * 60 * 1000));

        this.refreshTokenTimeout = setTimeout(() => {
            this.refreshToken();
        }, refreshTime);
    }

    /**
     * Stop token refresh timer
     */
    stopTokenRefreshTimer() {
        if (this.refreshTokenTimeout) {
            clearTimeout(this.refreshTokenTimeout);
            this.refreshTokenTimeout = null;
        }
    }

    /**
     * Refresh authentication token
     */
    async refreshToken() {
        try {
            const response = await api.auth.refreshToken();
            this.setSession(response.token, response.user);
        } catch (error) {
            console.error('Token Refresh Error:', error);
            this.clearSession();
            window.location.href = '/login';
        }
    }

    /**
     * Decode JWT token
     * @param {string} token JWT token
     * @returns {Object} Decoded token data
     */
    decodeToken(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error('Token Decode Error:', error);
            return {};
        }
    }

    /**
     * Check if user is authenticated
     * @returns {boolean}
     */
    isAuthenticated() {
        return !!this.token;
    }

    /**
     * Check if user has specific role
     * @param {string|string[]} roles Required roles
     * @returns {boolean}
     */
    hasRole(roles) {
        if (!this.user || !this.user.role) return false;

        if (Array.isArray(roles)) {
            return roles.includes(this.user.role);
        }
        return this.user.role === roles;
    }

    /**
     * Check if user has specific permission
     * @param {string|string[]} permissions Required permissions
     * @returns {boolean}
     */
    hasPermission(permissions) {
        if (!this.user || !this.user.permissions) return false;

        if (Array.isArray(permissions)) {
            return permissions.every(permission => 
                this.user.permissions.includes(permission)
            );
        }
        return this.user.permissions.includes(permissions);
    }

    /**
     * Get current user data
     * @returns {Object|null}
     */
    getCurrentUser() {
        return this.user;
    }

    /**
     * Update user profile
     * @param {Object} data Profile update data
     * @returns {Promise<Object>} Updated user data
     */
    async updateProfile(data) {
        try {
            const response = await api.user.updateProfile(data);
            this.user = response.user;
            localStorage.setItem('user', JSON.stringify(this.user));
            return this.user;
        } catch (error) {
            console.error('Profile Update Error:', error);
            throw error;
        }
    }

    /**
     * Request password reset
     * @param {string} email User email
     */
    async requestPasswordReset(email) {
        try {
            await api.auth.resetPassword({ email });
        } catch (error) {
            console.error('Password Reset Request Error:', error);
            throw error;
        }
    }

    /**
     * Reset password
     * @param {string} token Reset token
     * @param {string} password New password
     */
    async resetPassword(token, password) {
        try {
            await api.auth.resetPassword({ token, password });
        } catch (error) {
            console.error('Password Reset Error:', error);
            throw error;
        }
    }
}

// Export singleton instance
export default new Auth();
