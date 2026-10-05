import axios, { type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '../store/authStore'

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api/v1',
    headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
    },
})

function isPublicAuthRequest(url?: string) {
    if (!url) return false
    return /\/auth\/(login|register|refresh|verify-email(?:\/resend)?)(?:\?|$)/.test(url)
}

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

let refreshInFlight: Promise<boolean> | null = null

function refreshOnce() {
    if (!refreshInFlight) {
        refreshInFlight = useAuthStore.getState().refreshTokens().finally(() => {
            refreshInFlight = null
        })
    }
    return refreshInFlight
}

api.interceptors.request.use(
    (config) => {
        if (isPublicAuthRequest(config.url)) {
            setAuthHeader(config, null)
        } else {
            const { accessToken } = useAuthStore.getState()
            setAuthHeader(config, accessToken)
        }

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

api.interceptors.response.use(
    (response) => {
        return response
    },
    async (error) => {
        const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined

        if (
            error.response?.status !== 401
            || !originalRequest
            || originalRequest._retry
            || isPublicAuthRequest(originalRequest.url)
        ) {
            return Promise.reject(error)
        }

        originalRequest._retry = true

        const refreshSuccess = await refreshOnce()

        if (refreshSuccess) {
            const { accessToken } = useAuthStore.getState()
            setAuthHeader(originalRequest, accessToken)
            return api(originalRequest)
        }

        useAuthStore.getState().logout()
        if (window.location.pathname !== '/login') {
            window.location.href = '/login'
        }

        return Promise.reject(error)
    }
)
