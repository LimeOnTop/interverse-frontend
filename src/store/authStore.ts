import { registrationComplete } from '../lib/analytics'
import { clearPrivateStorage, tokenUser } from '../lib/privateStorage'
import axios from 'axios'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '../services/api'
import { syncAccessCookie } from '../utils/accessCookie'

let sessionVersion = 0
export const authSessionVersion = () => sessionVersion
const anonymous = { user: null, accessToken: null, refreshToken: null, isAuthenticated: false, isLoading: false, avatarUrl: null }

// This client deliberately has no refresh/retry interceptor: logout revokes the
// captured session even when another account is already signing in.
async function revokeSession(accessToken: string | null, refreshToken: string | null) {
    for (const token of [accessToken, refreshToken]) {
        if (!token) continue
        try {
            await axios.post(`${api.defaults.baseURL}/auth/logout`, {}, { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 })
            return
        } catch { /* An expired access token falls back to the still valid refresh token. */ }
    }
}

interface User {
    id: string
    email: string
    name: string
    role: string
    subscription_plan?: 'free' | 'paid' | string
    subscription_active?: boolean
    subscription_expires_at?: string
}

export interface RegisterResult {
    verificationRequired: boolean
}

// Thrown by login() when the password is right but the email is not confirmed yet.
export class EmailNotVerifiedError extends Error {
    constructor(public email: string) {
        super('email not verified')
        this.name = 'EmailNotVerifiedError'
    }
}

interface AuthState {
    user: User | null
    accessToken: string | null
    refreshToken: string | null
    isAuthenticated: boolean
    isLoading: boolean
    avatarUrl: string | null

    // Actions
    login: (email: string, password: string) => Promise<User>
    register: (name: string, email: string, password: string) => Promise<RegisterResult>
    verifyEmail: (email: string, code: string, password: string) => Promise<User>
    resendVerification: (email: string) => Promise<number>
    setTokens: (accessToken: string, refreshToken: string) => Promise<void>
    logout: () => Promise<void>
    checkAuth: () => Promise<void>
    refreshTokens: () => Promise<boolean>
    setAvatarUrl: (url: string | null) => void
    loadAvatar: () => Promise<void>
}

async function fetchAvatarUrl(userId: string): Promise<string | null> {
    try {
        const { data } = await api.get(`/users/${userId}/profile`)
        return data.profile?.avatar_url || null
    } catch {
        return null
    }
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: true,
            avatarUrl: null,

            setAvatarUrl: (url) => set({ avatarUrl: url }),

            loadAvatar: async () => {
                const userId = get().user?.id
                if (!userId) {
                    set({ avatarUrl: null })
                    return
                }
                const version = sessionVersion
                const avatarUrl = await fetchAvatarUrl(userId)
                if (version === sessionVersion && get().user?.id === userId) set({ avatarUrl })
            },

            login: async (email: string, password: string) => {
                const logoutComplete = get().logout()
                const version = sessionVersion
                set({ isLoading: true })
                await logoutComplete
                if (version !== sessionVersion) throw new Error('Авторизация отменена')
                try {
                    const response = await api.post('/auth/login', { email, password })
                    if (version !== sessionVersion) {
                        void revokeSession(response.data.access_token, response.data.refresh_token)
                        throw new Error('Авторизация отменена')
                    }
                    const { access_token, refresh_token, user } = response.data

                    api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
                    syncAccessCookie(access_token)

                    set({
                        user,
                        accessToken: access_token,
                        refreshToken: refresh_token,
                        isAuthenticated: true,
                        isLoading: false,
                        avatarUrl: null,
                    })

                    void get().loadAvatar()
                    return user
                } catch (error: any) {
                    if (version === sessionVersion) set({ isLoading: false })
                    if (error.response?.data?.verification_required) {
                        throw new EmailNotVerifiedError(error.response.data.email || email)
                    }
                    console.error('Login error:', error)
                    throw new Error(error.response?.data?.error || 'Login failed')
                }
            },

            register: async (name: string, email: string, password: string) => {
                const logoutComplete = get().logout()
                const version = sessionVersion
                set({ isLoading: true })
                await logoutComplete
                if (version !== sessionVersion) throw new Error('Авторизация отменена')
                try {
                    const response = await api.post('/auth/register', { name, email, password })
                    if (version !== sessionVersion) throw new Error('Авторизация отменена')
                    if (response.data?.verification_required) {
                        if (version === sessionVersion) set({ isLoading: false })
                        return { verificationRequired: true }
                    }
                    const { access_token, refresh_token, user } = response.data

                    api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
                    syncAccessCookie(access_token)

                    set({
                        user,
                        accessToken: access_token,
                        refreshToken: refresh_token,
                        isAuthenticated: true,
                        isLoading: false,
                        avatarUrl: null,
                    })
                    registrationComplete(String(user.id))
                    return { verificationRequired: false }
                } catch (error: any) {
                    if (version === sessionVersion) set({ isLoading: false })
                    throw new Error(error.response?.data?.error || 'Registration failed')
                }
            },

            verifyEmail: async (email: string, code: string, password: string) => {
                const logoutComplete = get().logout()
                const version = sessionVersion
                set({ isLoading: true })
                await logoutComplete
                if (version !== sessionVersion) throw new Error('Авторизация отменена')
                try {
                    const response = await api.post('/auth/verify-email', { email, code, password })
                    if (version !== sessionVersion) {
                        void revokeSession(response.data.access_token, response.data.refresh_token)
                        throw new Error('Авторизация отменена')
                    }
                    const { access_token, refresh_token, user } = response.data

                    api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
                    syncAccessCookie(access_token)

                    set({
                        user,
                        accessToken: access_token,
                        refreshToken: refresh_token,
                        isAuthenticated: true,
                        isLoading: false,
                        avatarUrl: null,
                    })
                    registrationComplete(String(user.id))
                    return user
                } catch (error: any) {
                    if (version === sessionVersion) set({ isLoading: false })
                    throw new Error(error.response?.data?.error || 'Verification failed')
                }
            },

            resendVerification: async (email: string) => {
                try {
                    const response = await api.post('/auth/verify-email/resend', { email })
                    return Number(response.data?.retry_after_seconds) || 60
                } catch (error: any) {
                    const retry = Number(error.response?.data?.retry_after_seconds)
                    if (error.response?.status === 429 && retry > 0) {
                        return retry
                    }
                    throw new Error(error.response?.data?.error || 'Resend failed')
                }
            },

            setTokens: async (accessToken: string, refreshToken: string) => {
                const previous = get()
                let version: number
                if (previous.accessToken && tokenUser(previous.accessToken) !== tokenUser(accessToken)) {
                    const logoutComplete = get().logout()
                    version = sessionVersion
                    await logoutComplete
                    if (version !== sessionVersion) throw new Error('Авторизация отменена')
                } else {
                    if (tokenUser(previous.accessToken || '') !== tokenUser(accessToken)) clearPrivateStorage()
                    sessionVersion++
                    delete api.defaults.headers.common['Authorization']
                    syncAccessCookie(null)
                    set(anonymous)
                    version = sessionVersion
                }
                api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
                syncAccessCookie(accessToken)
                set({ ...anonymous, accessToken, refreshToken, isLoading: true })
                try {
                    const response = await api.get('/auth/me')
                    if (version !== sessionVersion) throw new Error('Авторизация отменена')
                    set({ user: response.data.user, isAuthenticated: true, isLoading: false })
                    void get().loadAvatar()
                } catch (error) {
                    if (version === sessionVersion) get().logout()
                    throw error
                }
            },

            logout: async () => {
                clearPrivateStorage()
                const { accessToken, refreshToken } = get()
                sessionVersion++
                delete api.defaults.headers.common['Authorization']
                syncAccessCookie(null)
                set(anonymous)
                if (accessToken || refreshToken) await revokeSession(accessToken, refreshToken)
            },

            checkAuth: async () => {
                const { accessToken } = get()
                const version = sessionVersion
                if (!accessToken) {
                    syncAccessCookie(null)
                    set(anonymous)
                    return
                }
                syncAccessCookie(accessToken)
                set({ isLoading: true })
                try {
                    const response = await api.get('/auth/me')
                    if (version !== sessionVersion) return
                    set({ user: response.data.user, isAuthenticated: true, isLoading: false })
                    void get().loadAvatar()
                } catch {
                    if (version === sessionVersion) get().logout()
                }
            },

            refreshTokens: async () => {
                const { refreshToken } = get()
                const version = sessionVersion
                if (!refreshToken) {
                    return false
                }

                try {
                    const response = await api.post('/auth/refresh', { refresh_token: refreshToken })
                    if (version !== sessionVersion || get().refreshToken !== refreshToken) {
                        void revokeSession(response.data.access_token, response.data.refresh_token)
                        return false
                    }
                    const { access_token, refresh_token } = response.data

                    set({
                        accessToken: access_token,
                        refreshToken: refresh_token,
                    })

                    api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
                    syncAccessCookie(access_token)

                    return true
                } catch (error) {
                    if (version === sessionVersion) get().logout()
                    return false
                }
            },
        }),
        {
            name: 'auth-storage',
            version: 1,
            migrate: (stored: any) => ({ accessToken: stored?.accessToken || null, refreshToken: stored?.refreshToken || null }),
            partialize: (state) => ({
                                accessToken: state.accessToken,
                refreshToken: state.refreshToken,
                            }),
        }
    )
)

if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
        if (event.key !== 'auth-storage') return
        let incoming: { accessToken?: string; refreshToken?: string } = {}
        try { incoming = JSON.parse(event.newValue || '{}').state || {} } catch { /* Treat invalid storage as signed out. */ }
        const accessToken = incoming.accessToken || null
        const refreshToken = incoming.refreshToken || null
        const current = useAuthStore.getState()
        if (current.accessToken === accessToken && current.refreshToken === refreshToken) return
        if (!accessToken || tokenUser(current.accessToken) !== tokenUser(accessToken)) clearPrivateStorage()
        sessionVersion++
        delete api.defaults.headers.common['Authorization']
        syncAccessCookie(null)
        useAuthStore.setState({ ...anonymous, accessToken, refreshToken, isLoading: true })
        void useAuthStore.getState().checkAuth()
    })
}
