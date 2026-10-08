import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '../services/api'
import { syncAccessCookie } from '../utils/accessCookie'

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
    logout: () => void
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
            isLoading: false,
            avatarUrl: null,

            setAvatarUrl: (url) => set({ avatarUrl: url }),

            loadAvatar: async () => {
                const userId = get().user?.id
                if (!userId) {
                    set({ avatarUrl: null })
                    return
                }
                const avatarUrl = await fetchAvatarUrl(userId)
                set({ avatarUrl })
            },

            login: async (email: string, password: string) => {
                set({ isLoading: true })
                try {
                    const response = await api.post('/auth/login', { email, password })
                    const { access_token, refresh_token, user } = response.data

                    api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
                    syncAccessCookie(access_token)

                    set({
                        user,
                        accessToken: access_token,
                        refreshToken: refresh_token,
                        isAuthenticated: true,
                        isLoading: false,
                    })

                    void get().loadAvatar()
                    return user
                } catch (error: any) {
                    set({ isLoading: false })
                    if (error.response?.data?.verification_required) {
                        throw new EmailNotVerifiedError(error.response.data.email || email)
                    }
                    console.error('Login error:', error)
                    throw new Error(error.response?.data?.error || 'Login failed')
                }
            },

            register: async (name: string, email: string, password: string) => {
                set({ isLoading: true })
                try {
                    const response = await api.post('/auth/register', { name, email, password })
                    if (response.data?.verification_required) {
                        set({ isLoading: false })
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
                    return { verificationRequired: false }
                } catch (error: any) {
                    set({ isLoading: false })
                    throw new Error(error.response?.data?.error || 'Registration failed')
                }
            },

            verifyEmail: async (email: string, code: string, password: string) => {
                set({ isLoading: true })
                try {
                    const response = await api.post('/auth/verify-email', { email, code, password })
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
                    return user
                } catch (error: any) {
                    set({ isLoading: false })
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
                api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
                syncAccessCookie(accessToken)

                set({
                    accessToken,
                    refreshToken,
                    isAuthenticated: true,
                })

                try {
                    const response = await api.get('/auth/me')
                    set({ user: response.data.user })
                    void get().loadAvatar()
                } catch (error) {
                    console.error('Failed to load user data:', error)
                    throw error
                }
            },

            logout: () => {
                delete api.defaults.headers.common['Authorization']
                syncAccessCookie(null)

                set({
                    user: null,
                    accessToken: null,
                    refreshToken: null,
                    isAuthenticated: false,
                    isLoading: false,
                    avatarUrl: null,
                })
            },

            checkAuth: async () => {
                const { accessToken, user } = get()

                if (!accessToken) {
                    syncAccessCookie(null)
                    set({ isAuthenticated: false, avatarUrl: null })
                    return
                }

                api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
                syncAccessCookie(accessToken)
                set({ isAuthenticated: true })

                // Always refetch: the cached user carries the subscription, which changes
                // after a payment (return from Robokassa) or when the period ends.
                try {
                    const response = await api.get('/auth/me')
                    set({ user: response.data.user })
                } catch {
                    // A cached user survives a failed refresh; without one there is nothing to show.
                    if (!user) {
                        syncAccessCookie(null)
                        set({
                            user: null,
                            isAuthenticated: false,
                            accessToken: null,
                            refreshToken: null,
                            avatarUrl: null,
                        })
                        delete api.defaults.headers.common['Authorization']
                        return
                    }
                }

                if (!get().avatarUrl) {
                    void get().loadAvatar()
                }
            },

            refreshTokens: async () => {
                const { refreshToken } = get()
                if (!refreshToken) {
                    return false
                }

                try {
                    const response = await api.post('/auth/refresh', { refresh_token: refreshToken })
                    const { access_token, refresh_token } = response.data

                    set({
                        accessToken: access_token,
                        refreshToken: refresh_token,
                    })

                    api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
                    syncAccessCookie(access_token)

                    return true
                } catch (error) {
                    console.error('Token refresh failed:', error)
                    syncAccessCookie(null)
                    set({
                        user: null,
                        accessToken: null,
                        refreshToken: null,
                        isAuthenticated: false,
                        avatarUrl: null,
                    })
                    return false
                }
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                accessToken: state.accessToken,
                refreshToken: state.refreshToken,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
)
