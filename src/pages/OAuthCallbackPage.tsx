import { registrationComplete } from '../lib/analytics'
import { api } from '../services/api'
import { authDestination } from '../lib/trainingIntent'
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

        const code = searchParams.get('code')
        window.history.replaceState({}, '', '/oauth/callback')

        if (code) {
            // Store tokens and load user data
            api.post('/auth/google/exchange', { code }).then(async ({data}) => {
                await setTokens(data.access_token, data.refresh_token)
                if (data.new_registration && data.user_id) registrationComplete(String(data.user_id), 'google')
            }).then(() => {
                toast.success('Успешный вход через Google')
                navigate(authDestination(), { replace: true })
            }).catch(() => {
                toast.error('Ошибка загрузки данных пользователя')
                navigate('/login', { replace: true })
            })
        } else {
            toast.error('Ошибка аутентификации')
            navigate('/login', { replace: true })
        }
    }, [searchParams, setTokens, navigate])

    return (
        <div className="min-h-screen iv-page flex items-center justify-center">
            <div className="text-center">
                <div className="iv-spinner h-8 w-8 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Завершаем вход…</p>
            </div>
        </div>
    )
}
