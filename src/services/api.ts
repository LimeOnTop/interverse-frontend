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

function setAuthHeader(config: { headers?: Record<string, unknown> }, token: string | null) {
    if (!config.headers) {
        config.headers = {}
    }

    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    } else {
        delete config.headers.Authorization
    }
}

// Request interceptor
api.interceptors.request.use(
    (config) => {
        const { accessToken } = useAuthStore.getState()
        setAuthHeader(config, accessToken)

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

        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
            originalRequest._retry = true

            const authStore = useAuthStore.getState()
            const refreshSuccess = await authStore.refreshTokens()

            if (refreshSuccess) {
                const { accessToken } = useAuthStore.getState()
                setAuthHeader(originalRequest, accessToken)
                return api(originalRequest)
            }

            authStore.logout()
            window.location.href = '/login'
        }

        return Promise.reject(error)
    }
)
