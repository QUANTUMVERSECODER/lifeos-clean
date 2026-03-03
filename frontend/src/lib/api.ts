import axios from 'axios';

// Base API instance matching Nginx config routing
// Base API instance matching Nginx config routing
export const api = axios.create({
    baseURL: 'http://localhost:8000/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // Crucial for HTTP-Only Refresh cookies
});

// Interceptor to attach JWT token
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If 401 and we haven't already retried
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Attempt to rotate the access token using the HTTP-only refresh cookie
                const res = await axios.post('http://localhost:8000/api/v1/refresh', {}, {
                    withCredentials: true
                });

                if (res.status === 200) {
                    const newAccessToken = res.data.access_token;
                    localStorage.setItem('token', newAccessToken);

                    // Update header and retry original request
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                    return api(originalRequest);
                }
            } catch (refreshErr) {
                // Refresh failed (cookie expired, invalid, or missing). Wipe local and force re-auth.
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('token');
                    window.location.href = '/login';
                }
                return Promise.reject(refreshErr);
            }
        }

        return Promise.reject(error);
    }
);

// ML specific service API
export const mlApi = axios.create({
    baseURL: 'http://localhost:8001/ml',
    headers: {
        'Content-Type': 'application/json',
    },
});

mlApi.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});
