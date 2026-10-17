import axios, { type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore, authSessionVersion } from '../store/authStore'
import { isTrainingLimitError, usePromoStore } from '../store/promoStore'

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
    return /\/auth\/(google\/exchange|login|register|refresh|verify-email(?:\/resend)?)(?:\?|$)/.test(url)
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
let refreshVersion = -1

function refreshOnce() {
    if (!refreshInFlight || refreshVersion !== authSessionVersion()) {
        refreshVersion = authSessionVersion()
        const version = refreshVersion
        refreshInFlight = useAuthStore.getState().refreshTokens().finally(() => {
            if (version === refreshVersion) refreshInFlight = null
        })
    }
    return refreshInFlight
}

api.interceptors.request.use(
    (config) => {
        (config as InternalAxiosRequestConfig & { _sessionVersion?: number })._sessionVersion = authSessionVersion()
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
        const config = response.config as InternalAxiosRequestConfig & { _sessionVersion?: number }
        if (!isPublicAuthRequest(config.url) && config._sessionVersion !== authSessionVersion()) {
            return Promise.reject(new Error('Сессия изменена'))
        }
        return response
    },
    async (error) => {
        if (isTrainingLimitError(error)) {
            usePromoStore.getState().openLimitPromo()
            return Promise.reject(error)
        }

        const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean; _sessionVersion?: number }) | undefined

        if (
            error.response?.status !== 401
            || !originalRequest
            || originalRequest._retry
            || isPublicAuthRequest(originalRequest.url)
        ) {
            return Promise.reject(error)
        }

        if (originalRequest._sessionVersion !== authSessionVersion()) return Promise.reject(error)
        const version = authSessionVersion()
        originalRequest._retry = true

        const refreshSuccess = await refreshOnce()

        if (version !== authSessionVersion()) return Promise.reject(error)
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
