/**
 * Environment Configuration
 * 
 * Centralized configuration for environment variables.
 * Uses Expo's EXPO_PUBLIC_ prefix for client-accessible variables.
 * 
 * @see https://docs.expo.dev/guides/environment-variables/
 */

interface Config {
    API_BASE_URL: string;
    API_TIMEOUT: number;
    ENV: 'development' | 'staging' | 'production';
}

/**
 * Get environment configuration
 * All values are validated and have fallbacks
 */
const getConfig = (): Config => {
    const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
    const timeout = process.env.EXPO_PUBLIC_API_TIMEOUT;
    const env = process.env.EXPO_PUBLIC_ENV;

    // Use fallback for development if not defined
    const finalBaseUrl = baseUrl || 'http://192.168.31.143:3000/api';

    // Warn if using fallback
    if (!baseUrl) {
        console.warn('⚠️ EXPO_PUBLIC_API_BASE_URL not defined, using fallback:', finalBaseUrl);
        console.warn('⚠️ Create a .env file with EXPO_PUBLIC_API_BASE_URL for production');
    }

    return {
        API_BASE_URL: finalBaseUrl,
        API_TIMEOUT: timeout ? parseInt(timeout, 10) : 30000,
        ENV: (env as Config['ENV']) || 'development',
    };
};

// Export singleton config
export const config = getConfig();

// Export individual values for convenience
export const API_BASE_URL = config.API_BASE_URL;
export const API_TIMEOUT = config.API_TIMEOUT;
export const ENV = config.ENV;

// Helper to check environment
export const isDevelopment = config.ENV === 'development';
export const isProduction = config.ENV === 'production';
export const isStaging = config.ENV === 'staging';

// Log config in development (helps with debugging)
if (isDevelopment) {
    console.log('📱 App Config:', {
        API_BASE_URL: config.API_BASE_URL,
        API_TIMEOUT: config.API_TIMEOUT,
        ENV: config.ENV,
    });
}
