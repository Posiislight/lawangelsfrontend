import axios from 'axios';

const API = axios.create({
    baseURL: process.env.REACT_APP_API_BASE_URL,
});

// Add a request interceptor to include the JWT token in the Authorization header
API.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('jwtToken');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default API;