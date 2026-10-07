import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { EmailNotVerifiedError, useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import { Eye, EyeOff } from 'lucide-react'
import AuthSplitLayout from '../components/AuthSplitLayout'
import FormCard from '../components/ui/FormCard'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { readFormDraft, usePersistedRhfValues } from '../hooks/usePersistedForm'

const loginSchema = z.object({
    email: z.string().min(1, 'Введите логин'),
    password: z.string().min(1, 'Введите пароль'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
    const [showPassword, setShowPassword] = useState(false)
    const { login, isLoading } = useAuthStore()
    const navigate = useNavigate()

    const saved = readFormDraft<Pick<LoginForm, 'email'>>('login')
    const { register, handleSubmit, watch, formState: { errors } } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: saved?.email ?? '',
            password: '',
        },
    })
    usePersistedRhfValues('login', watch, (values) => ({ email: values.email ?? '' }))

    const onSubmit = async (data: LoginForm) => {
        try {
            const user = await login(data.email, data.password)
            toast.success('Добро пожаловать!')
            navigate(user?.role === 'admin' ? '/admin' : '/dashboard')
        } catch (error: any) {
            if (error instanceof EmailNotVerifiedError) {
                toast('Подтвердите email: мы отправили код на почту')
                navigate('/verify-email', { state: { email: error.email, password: data.password } })
                return
            }
            const raw = String(error?.message || '')
            const isInvalid = /invalid credentials|login failed|неверн/i.test(raw)
            toast.error(isInvalid ? 'Неверный логин или пароль' : (raw || 'Не удалось войти'))
        }
    }

    return (
        <AuthSplitLayout
            marketingTitle="Тренируйся как на собеседовании"
            marketingDescription="Проходи симуляции технических интервью под свой стек и уровень. Отрабатывай ответы и снимай стресс до встречи с работодателем."
        >
            <div className="w-full">
                <FormCard>
                    <div className="mb-8">
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight mb-2">Вход</h1>
                        <p className="text-secondary text-sm">Войдите, чтобы продолжить тренировки</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <Input
                            label="Логин"
                            type="text"
                            variant="underlined"
                            placeholder="you@company.com"
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

                    <div className="iv-divider my-8" />

                    <a
                        href="/api/v1/auth/google/login"
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 dark:border-iv-dark-line bg-white/80 dark:bg-iv-dark-bg/80 text-sm font-medium hover:bg-gray-50 dark:hover:bg-iv-dark-surface transition-iv"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Google
                    </a>

                    <p className="mt-6 text-center text-sm text-secondary">
                        Нет аккаунта?{' '}
                        <Link to="/register" className="inline-flex items-center min-h-[44px] px-1 font-medium text-inter-verse-green dark:text-purple-400 hover:underline">
                            Регистрация
                        </Link>
                    </p>
                </FormCard>
            </div>
        </AuthSplitLayout>
    )
}
