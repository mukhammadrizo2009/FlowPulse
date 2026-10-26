import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

const rawBase = import.meta.env.VITE_API_BASE_URL
  ? String(import.meta.env.VITE_API_BASE_URL).replace(/\/+$/, '')
  : '';
const API_BASE_URL = rawBase ? `${rawBase}/api/v1` : '/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Helper to get CSRF token from document cookie if needed
export function getCsrfToken(): string | null {
  const match = document.cookie.match(/csrftoken=([^;]+)/);
  return match ? match[1] : null;
}

// Request interceptor: attach token or CSRF
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // If JWT token exists in localStorage, set Authorization header
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Attach CSRF token header for state-changing requests
    const csrf = getCsrfToken();
    if (csrf && config.headers && ['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() || '')) {
      config.headers['X-CSRFToken'] = csrf;
    }
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor: global error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // If unauthorized and not on public auth pages, clear stale storage
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        // Let the AuthContext or router handle redirect smoothly
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
