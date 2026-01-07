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
     * Make HTTP request with timeout
     */
    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        const url = `${this.baseUrl}${endpoint}`;

        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            // Build headers
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };

            // Add custom headers from options
            if (options.headers) {
                Object.assign(headers, options.headers);
            }

            // Add auth token if available
            if (this.authToken) {
                headers['Authorization'] = `Bearer ${this.authToken}`;
            }

            // Make request
            const response = await fetch(url, {
                ...options,
                headers,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            // Parse response
            const data = await response.json();

            // Handle 401 Unauthorized globally
            if (response.status === 401) {
                console.warn('🔒 Unauthorized (401) - Token invalid or expired');

                // Call unauthorized callback if set
                if (this.onUnauthorized) {
                    this.onUnauthorized();
                }

                return {
                    success: false,
                    error: {
                        error: 'Unauthorized',
                        message: data.message || 'Session expired. Please login again.',
                        statusCode: 401,
                    },
                };
            }

            // Handle other error responses
            if (!response.ok) {
                let errorMessage = data.message || 'An error occurred';

                // Refine generic messages based on status codes
                if (response.status === 403) {
                    errorMessage = data.message || 'You do not have permission to perform this action.';
                    if (this.onForbidden) {
                        this.onForbidden();
                    }
                } else if (response.status === 404) {
                    errorMessage = data.message || 'The requested resource was not found.';
                } else if (response.status >= 500) {
                    errorMessage = 'Server error. Please try again later.';
                }

                return {
                    success: false,
                    error: {
                        error: data.error || 'Request failed',
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

            // Handle timeout
            if (error.name === 'AbortError') {
                return {
                    success: false,
                    error: {
                        error: 'Timeout',
                        message: 'Request timed out. Please check your connection.',
                    },
                };
            }

            // Handle network errors
            return {
                success: false,
                error: {
                    error: 'Network Error',
                    message: error.message || 'Unable to connect to server',
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
