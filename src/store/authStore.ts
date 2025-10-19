import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '../services/api'

interface User {
    id: string
    email: string
    name: string
    role: string
}

interface AuthState {
    user: User | null
    accessToken: string | null
    refreshToken: string | null
    isAuthenticated: boolean
    isLoading: boolean

    // Actions
    login: (email: string, password: string) => Promise<void>
    register: (name: string, email: string, password: string) => Promise<void>
    setTokens: (accessToken: string, refreshToken: string) => Promise<void>
    logout: () => void
    checkAuth: () => Promise<void>
    refreshTokens: () => Promise<boolean>
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,

            login: async (email: string, password: string) => {
                set({ isLoading: true })
                try {
                    console.log('Attempting login with:', email)
                    const response = await api.post('/auth/login', { email, password })
                    console.log('Login response:', response.data)

                    const { access_token, refresh_token, user } = response.data

                    // Set token in axios defaults
                    api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`

                    set({
                        user,
                        accessToken: access_token,
                        refreshToken: refresh_token,
                        isAuthenticated: true,
                        isLoading: false,
                    })

                    console.log('Login successful, user authenticated:', true)
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

                    // Set token in axios defaults
                    api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`

                    set({
                        user,
                        accessToken: access_token,
                        refreshToken: refresh_token,
                        isAuthenticated: true,
                        isLoading: false,
                    })
                } catch (error: any) {
                    set({ isLoading: false })
                    throw new Error(error.response?.data?.error || 'Registration failed')
                }
            },

            setTokens: async (accessToken: string, refreshToken: string) => {
                // Set token in axios defaults
                api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`

                set({
                    accessToken,
                    refreshToken,
                    isAuthenticated: true,
                })

                // Load user data after setting tokens
                try {
                    console.log('Loading user data...')
                    const response = await api.get('/auth/me')
                    console.log('User data loaded:', response.data)
                    set({ user: response.data.user })
                } catch (error) {
                    console.error('Failed to load user data:', error)
                    throw error // Re-throw to handle in OAuthCallbackPage
                }
            },

            logout: () => {
                // Clear token from axios defaults
                delete api.defaults.headers.common['Authorization']

                set({
                    user: null,
                    accessToken: null,
                    refreshToken: null,
                    isAuthenticated: false,
                    isLoading: false,
                })
            },

            checkAuth: async () => {
                const { accessToken, user } = get()

                if (!accessToken) {
                    set({ isAuthenticated: false })
                    return
                }

                // Always set auth header if we have a token
                api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`

                // Consider the user authenticated if we have a token.
                // If user data is missing, load it lazily without flipping auth to false.
                set({ isAuthenticated: true })

                if (!user) {
                    try {
                        const response = await api.get('/auth/me')
                        set({ user: response.data.user })
                    } catch (err) {
                        // If token is invalid, mark as unauthenticated
                        set({ user: null, isAuthenticated: false, accessToken: null, refreshToken: null })
                        delete api.defaults.headers.common['Authorization']
                    }
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

                    // Update tokens
                    set({
                        accessToken: access_token,
                        refreshToken: refresh_token,
                    })

                    // Set new access token in axios defaults
                    api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`

                    return true
                } catch (error) {
                    console.error('Token refresh failed:', error)
                    // Clear tokens on refresh failure
                    set({
                        user: null,
                        accessToken: null,
                        refreshToken: null,
                        isAuthenticated: false,
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
