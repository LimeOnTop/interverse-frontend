import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '../services/api'

interface User {
    id: string
    email: string
    name: string
    role: string
    subscription_plan?: 'free' | 'paid' | string
    subscription_active?: boolean
    subscription_expires_at?: string
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
    register: (name: string, email: string, password: string) => Promise<void>
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
                    console.error('Login error:', error)
                    set({ isLoading: false })
                    throw new Error(error.response?.data?.error || 'Login failed')
                }
            },

            register: async (name: string, email: string, password: string) => {
                set({ isLoading: true })
                try {
                    const response = await api.post('/auth/register', { name, email, password })
                    const { access_token, refresh_token, user } = response.data

                    api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`

                    set({
                        user,
                        accessToken: access_token,
                        refreshToken: refresh_token,
                        isAuthenticated: true,
                        isLoading: false,
                        avatarUrl: null,
                    })
                } catch (error: any) {
                    set({ isLoading: false })
                    throw new Error(error.response?.data?.error || 'Registration failed')
                }
            },

            setTokens: async (accessToken: string, refreshToken: string) => {
                api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`

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
                    set({ isAuthenticated: false, avatarUrl: null })
                    return
                }

                api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
                set({ isAuthenticated: true })

                if (!user) {
                    try {
                        const response = await api.get('/auth/me')
                        set({ user: response.data.user })
                    } catch {
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

                    return true
                } catch (error) {
                    console.error('Token refresh failed:', error)
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
