import axios from 'axios';

// If VITE_API_BASE_URL is not set, we default to empty string.
// This allows relative requests (e.g. '/api/...'), which triggers the
// Vite dev server proxy (defined in vite.config.js) to seamlessly route
// the requests to the backend with NO CORS restrictions!
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor — attach JWT token to every request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('hh_admin_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor — handle 401 globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('hh_admin_token');
            localStorage.removeItem('hh_admin_user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
