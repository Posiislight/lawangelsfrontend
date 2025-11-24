import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const API = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true, // Enable credentials (cookies) for cross-origin requests
});

/**
 * Fetches CSRF token from the backend and stores it in localStorage
 * This ensures the CSRF cookie is set even for anonymous users
 */
async function fetchCsrfToken(): Promise<string | null> {
    try {
        const res = await axios.get(`${API_BASE_URL}/csrf/`, { 
            withCredentials: true 
        });
        const token = res?.data?.csrfToken ?? null;
        if (token) {
            localStorage.setItem('csrfToken', token);
        }
        return token;
    } catch (error) {
        console.error('Failed to fetch CSRF token:', error);
        return null;
    }
}

// Add request interceptor to include JWT token and CSRF token
API.interceptors.request.use(
    async (config) => {
        // Add JWT token if available
        const jwtToken = localStorage.getItem('jwtToken');
        if (jwtToken) {
            config.headers['Authorization'] = `Bearer ${jwtToken}`;
        }

        // Add CSRF token for non-GET requests
        const method = (config.method || '').toLowerCase();
        if (!['get', 'head', 'options'].includes(method)) {
            let csrfToken = localStorage.getItem('csrfToken');
            if (!csrfToken) {
                csrfToken = await fetchCsrfToken();
            }
            if (csrfToken) {
                config.headers['X-CSRFToken'] = csrfToken;
            }
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor to handle CSRF token refresh on 403 errors
API.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If we get a 403 CSRF error and haven't retried yet
        if (
            error.response?.status === 403 &&
            error.response?.data?.detail?.includes('CSRF') &&
            !originalRequest._retry
        ) {
            originalRequest._retry = true;
            
            // Fetch a fresh CSRF token
            const freshToken = await fetchCsrfToken();
            if (freshToken) {
                originalRequest.headers['X-CSRFToken'] = freshToken;
                return API(originalRequest);
            }
        }

        return Promise.reject(error);
    }
);

export default API;
export { fetchCsrfToken };
