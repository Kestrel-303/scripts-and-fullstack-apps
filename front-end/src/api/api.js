import axios from 'axios';

/**
 * Custom Axios instance targeting the FastAPI backend.
 * Base URL defaults to http://localhost:8000
 */
const api = axios.create({
  baseURL: 'http://localhost:8000',
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
    }
    return Promise.reject(error);
  }
);

export default api;
