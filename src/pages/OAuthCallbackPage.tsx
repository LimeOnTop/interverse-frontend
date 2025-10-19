import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

export default function OAuthCallbackPage() {
    const [searchParams] = useSearchParams()
    const { setTokens } = useAuthStore()
    const navigate = useNavigate()
    const processedRef = useRef(false)

    useEffect(() => {
        // Prevent double execution
        if (processedRef.current) return
        processedRef.current = true

        const accessToken = searchParams.get('access_token')
        const refreshToken = searchParams.get('refresh_token')

        if (accessToken && refreshToken) {
            // Store tokens and load user data
            setTokens(accessToken, refreshToken).then(() => {
                toast.success('Успешный вход через Google')
                navigate('/dashboard')
            }).catch(() => {
                toast.error('Ошибка загрузки данных пользователя')
                navigate('/login')
            })
        } else {
            toast.error('Ошибка аутентификации')
            navigate('/login')
        }
    }, [searchParams, setTokens, navigate])

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-inter-verse-green dark:border-purple-500 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Завершение входа...</p>
            </div>
        </div>
    )
}
