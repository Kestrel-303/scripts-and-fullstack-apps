import axios from 'axios';

// Dynamically target Vite env variable in production, falling back to localhost for dev
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor:
 * Before every outgoing HTTP request, check if a JWT token exists in localStorage.
 * If found, attach the token to the 'Authorization' header as a Bearer token.
 */
api.interceptors.request.use(
  (config) => {
    // Retrieve stored JWT token from browser localStorage
    const token = localStorage.getItem('token');

    if (token) {
      // Attach header: Authorization: Bearer <token>
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor:
 * If an API response returns 401 Unauthorized, automatically clear invalid local token storage.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('Unauthorized request! Clearing stored token.');
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;