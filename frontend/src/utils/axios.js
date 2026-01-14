import axios from 'axios';

// Create axios instance with base URL from environment variable
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token to requests
api.interceptors.request.use(
  (config) => {
    // Log the request URL with params
    console.log('🌐 Axios Request:', config.method?.toUpperCase(), config.url, 'Params:', config.params);
    
    // 🔧 DEV MODE: Skip token requirement
    if (import.meta.env.VITE_DEV_AUTH_BYPASS === 'true') {
      // In dev mode, backend will inject fake identity
      // No token needed
      return config;
    }

    // PRODUCTION: Add student token if available
    const token = localStorage.getItem('studentToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 🔧 DEV MODE: Don't redirect on 401 (bypass is active)
    if (import.meta.env.VITE_DEV_AUTH_BYPASS === 'true') {
      return Promise.reject(error);
    }

    // PRODUCTION: Handle 401 errors by redirecting to login
    if (error.response?.status === 401) {
      // Token expired or invalid - clear storage
      localStorage.removeItem('studentToken');
      localStorage.removeItem('studentInfo');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;
