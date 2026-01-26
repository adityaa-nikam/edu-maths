/**
 * API Client
 * 
 * Centralized HTTP client for making API requests.
 * Handles authentication, timeouts, and error handling.
 * Features:
 * - Automatic JWT attachment
 * - Global 401 handling (auto-logout)
 * - Request timeout
 * - Error handling
 */

import { API_BASE_URL, API_TIMEOUT } from './config';

export interface ApiError {
    error: string;
    message: string;
    statusCode?: number;
}

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: ApiError;
}

/**
 * Callback for handling unauthorized requests (401)
 */
type UnauthorizedCallback = () => void;

const MSG = {
    OFFLINE: "You're offline. Please connect to the internet and try again.",
    SERVER_DOWN: "Our service is temporarily unavailable. Please try again in a few minutes.",
    BACKEND_ERROR: "Something went wrong on our side. We're working on it.",
    AUTH_EXPIRED: "Your session has expired. Please log in again.",
};

/**
 * Base API client class
 */
class ApiClient {
    private baseUrl: string;
    private timeout: number;
    private authToken: string | null = null;
    private onUnauthorized: UnauthorizedCallback | null = null;
    private onForbidden: UnauthorizedCallback | null = null;

    constructor(baseUrl: string, timeout: number) {
        this.baseUrl = baseUrl;
        this.timeout = timeout;
    }

    /**
     * Set callback for unauthorized requests (401)
     */
    setUnauthorizedCallback(callback: UnauthorizedCallback | null) {
        this.onUnauthorized = callback;
    }

    /**
     * Set callback for forbidden requests (403)
     */
    setForbiddenCallback(callback: UnauthorizedCallback | null) {
        this.onForbidden = callback;
    }

    /**
     * Set authentication token (Student JWT)
     */
    setAuthToken(token: string | null) {
        this.authToken = token;
    }

    /**
     * Get authentication token
     */
    getAuthToken(): string | null {
        return this.authToken;
    }

    /**
     * Clear authentication token
     */
    clearAuthToken() {
        this.authToken = null;
    }

    /**
     * Distinguish between No Internet and Server Down
     */
    private async checkConnectivity(): Promise<'offline' | 'server_down'> {
        try {
            // Try to reach a highly reliable server (Google) to check internet
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 3000);
            await fetch('https://8.8.8.8', { mode: 'no-cors', signal: controller.signal });
            clearTimeout(id);
            return 'server_down';
        } catch (e) {
            return 'offline';
        }
    }

    /**
     * Make HTTP request with timeout
     */
    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        const url = `${this.baseUrl}${endpoint}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };

            if (options.headers) {
                Object.assign(headers, options.headers);
            }

            if (this.authToken) {
                headers['Authorization'] = `Bearer ${this.authToken}`;
            }

            const response = await fetch(url, {
                ...options,
                headers,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            // Handle responses safely
            const text = await response.text();
            let data: any = {};
            try {
                data = text ? JSON.parse(text) : {};
            } catch (e) {
                console.warn('⚠️ Response is not valid JSON');
            }

            if (response.status === 401) {
                console.warn('🔒 Unauthorized (401)');
                this.clearAuthToken();
                if (this.onUnauthorized) this.onUnauthorized();

                return {
                    success: false,
                    error: {
                        error: 'Auth Expired',
                        message: MSG.AUTH_EXPIRED,
                        statusCode: 401,
                    },
                };
            }

            if (!response.ok) {
                let errorMessage = MSG.BACKEND_ERROR;

                if (response.status === 403) {
                    if (this.onForbidden) this.onForbidden();
                } else if (response.status >= 500) {
                    errorMessage = MSG.SERVER_DOWN;
                }

                return {
                    success: false,
                    error: {
                        error: 'Backend Error',
                        message: errorMessage,
                        statusCode: response.status,
                    },
                };
            }

            return {
                success: true,
                data,
            };
        } catch (error: any) {
            clearTimeout(timeoutId);

            if (error.name === 'AbortError') {
                return {
                    success: false,
                    error: {
                        error: 'Server Down',
                        message: MSG.SERVER_DOWN,
                        statusCode: 504,
                    },
                };
            }

            // Detect if offline or server down
            const connectionType = await this.checkConnectivity();

            return {
                success: false,
                error: {
                    error: connectionType === 'offline' ? 'No Internet' : 'Server Down',
                    message: connectionType === 'offline' ? MSG.OFFLINE : MSG.SERVER_DOWN,
                },
            };
        }
    }

    /**
     * GET request
     */
    async get<T>(endpoint: string): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, { method: 'GET' });
    }

    /**
     * POST request
     */
    async post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: body ? JSON.stringify(body) : undefined,
        });
    }

    /**
     * PUT request
     */
    async put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            method: 'PUT',
            body: body ? JSON.stringify(body) : undefined,
        });
    }

    /**
     * DELETE request
     */
    async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, { method: 'DELETE' });
    }
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL, API_TIMEOUT);

// Export convenience methods
export const setAuthToken = (token: string | null) => apiClient.setAuthToken(token);
export const getAuthToken = () => apiClient.getAuthToken();
export const clearAuthToken = () => apiClient.clearAuthToken();
export const setUnauthorizedCallback = (callback: UnauthorizedCallback | null) =>
    apiClient.setUnauthorizedCallback(callback);
export const setForbiddenCallback = (callback: UnauthorizedCallback | null) =>
    apiClient.setForbiddenCallback(callback);
