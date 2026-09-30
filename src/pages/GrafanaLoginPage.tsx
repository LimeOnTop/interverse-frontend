import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { syncAccessCookie } from '../utils/accessCookie'
import { api } from '../services/api'
import AuthSplitLayout from '../components/AuthSplitLayout'
import FormCard from '../components/ui/FormCard'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Spinner from '../components/ui/Spinner'

const loginSchema = z.object({
    email: z.string().min(1, 'Введите логин'),
    password: z.string().min(1, 'Введите пароль'),
})

type LoginForm = z.infer<typeof loginSchema>

const GRAFANA_APP = '/grafana/'

async function openGrafana(accessToken: string) {
    syncAccessCookie(accessToken)
    // Ensure gateway accepts the session before navigating (avoids bounce loops).
    await api.get('/admin/grafana-auth', {
        headers: { Authorization: `Bearer ${accessToken}` },
    })
    window.location.assign(GRAFANA_APP)
}

export default function GrafanaLoginPage() {
    const [showPassword, setShowPassword] = useState(false)
    const [checking, setChecking] = useState(true)
    const [searchParams] = useSearchParams()
    const needLogin = searchParams.get('auth') === 'required'
    const { login, logout, isLoading, checkAuth } = useAuthStore()
    const navigate = useNavigate()

    const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: '', password: '' },
    })

    useEffect(() => {
        let cancelled = false
        ;(async () => {
            await checkAuth()
            if (cancelled) return

            // After nginx bounced us here, always show the form — do not auto-bounce back.
            if (needLogin) {
                setChecking(false)
                return
            }

            const state = useAuthStore.getState()
            if (state.isAuthenticated && state.user?.role === 'admin' && state.accessToken) {
                try {
                    await openGrafana(state.accessToken)
                    return
                } catch {
                    // Fall through to the login form if cookie/token is not accepted.
                }
            }
            setChecking(false)
        })()
        return () => {
            cancelled = true
        }
    }, [checkAuth, needLogin])

    const onSubmit = async (data: LoginForm) => {
        try {
            const loggedIn = await login(data.email, data.password)
            if (loggedIn?.role !== 'admin') {
                logout()
                toast.error('Доступ к метрикам только для администратора')
                return
            }
            const token = useAuthStore.getState().accessToken
            if (!token) {
                toast.error('Не удалось получить токен')
                return
            }
            toast.success('Вход выполнен')
            await openGrafana(token)
        } catch (error: unknown) {
            const raw = String((error as { message?: string })?.message || '')
            const isInvalid = /invalid credentials|login failed|неверн/i.test(raw)
            toast.error(isInvalid ? 'Неверный логин или пароль' : (raw || 'Не удалось войти'))
        }
    }

    if (checking) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Spinner />
            </div>
        )
    }

    return (
        <AuthSplitLayout
            marketingTitle="Метрики InterVerse"
            marketingDescription="Доступ к Grafana открыт только администраторам. Войдите тем же аккаунтом, что и в админ-панель."
        >
            <div className="w-full">
                <FormCard>
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold tracking-tight mb-2">Вход в Grafana</h1>
                        <p className="text-secondary text-sm">Авторизация администратора для просмотра метрик</p>
                        {needLogin && (
                            <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
                                Нужна повторная авторизация администратора для доступа к метрикам.
                            </p>
                        )}
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <Input
                            label="Логин"
                            type="text"
                            variant="underlined"
                            placeholder="admin"
                            error={errors.email?.message}
                            {...register('email')}
                        />

                        <div>
                            <label className="block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
                                Пароль
                            </label>
                            <div className="relative">
                                <input
                                    {...register('password')}
                                    type={showPassword ? 'text' : 'password'}
                                    className="input-field-underlined pr-10"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-0 top-1/2 -translate-y-1/2 btn-icon w-8 h-8"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>
                            )}
                        </div>

                        <Button type="submit" loading={isLoading} className="w-full">
                            Войти
                        </Button>
                    </form>

                    <p className="mt-6 text-center text-sm text-secondary">
                        <Link to="/login" className="font-medium text-inter-verse-green dark:text-purple-400 hover:underline">
                            Обычный вход
                        </Link>
                        {' · '}
                        <button
                            type="button"
                            onClick={() => navigate('/admin')}
                            className="font-medium text-inter-verse-green dark:text-purple-400 hover:underline"
                        >
                            Админ-панель
                        </button>
                    </p>
                </FormCard>
            </div>
        </AuthSplitLayout>
    )
}
