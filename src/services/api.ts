import axios from 'axios'
import { useAuthStore } from '../store/authStore'

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api/v1',
    headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
    },
})

// Request interceptor
api.interceptors.request.use(
    (config) => {
        // Add timestamp to prevent caching
        if (config.method === 'get') {
            config.params = {
                ...config.params,
                _t: Date.now()
            }
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// Response interceptor
api.interceptors.response.use(
    (response) => {
        return response
    },
    async (error) => {
        const originalRequest = error.config

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true

            // Try to refresh tokens
            const authStore = useAuthStore.getState()
            const refreshSuccess = await authStore.refreshTokens()

            if (refreshSuccess) {
                // Retry the original request with new token
                return api(originalRequest)
            } else {
                // Refresh failed, redirect to login
                authStore.logout()
                window.location.href = '/login'
            }
        }

        return Promise.reject(error)
    }
)
