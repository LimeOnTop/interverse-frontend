import AuthLegalNotice from '../components/AuthLegalNotice'
import GoogleAuthButton from '../components/GoogleAuthButton'
import { registrationFunnel } from '../lib/analytics'
import { freeTrainingCaption } from '../lib/trainingLimits'
import { authDestination, pendingTrainingIntent } from '../lib/trainingIntent'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm, type FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import { Eye, EyeOff } from 'lucide-react'
import AuthSplitLayout from '../components/AuthSplitLayout'
import FormCard from '../components/ui/FormCard'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { readFormDraft, usePersistedRhfValues } from '../hooks/usePersistedForm'

const registerSchema = z.object({
    name: z.string().min(2, 'Имя — не менее 2 символов'),
    email: z.string().email('Укажи адрес почты в формате name@example.com'),
    password: z.string().min(6, 'Пароль — не менее 6 символов'),
    confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
})

type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterPage() {
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const { register: registerUser, isLoading } = useAuthStore()
    const navigate = useNavigate()
    const hasTraining = Boolean(pendingTrainingIntent())
    const viewed = useRef(false)
    const started = useRef(false)
    useEffect(() => {
        if (!viewed.current) {
            viewed.current = true
            registrationFunnel('form_view', { has_training: hasTraining ? 1 : 0 })
        }
    }, [hasTraining])
    const trackStart = () => {
        if (!started.current) {
            started.current = true
            registrationFunnel('form_start', { method: 'email' })
        }
    }
    const onInvalid = (invalid: FieldErrors<RegisterForm>) => {
        for (const field of ['name', 'email', 'password', 'confirmPassword'] as const) {
            if (invalid[field]) registrationFunnel('validation_error', { field })
        }
    }

    const saved = readFormDraft<Pick<RegisterForm, 'name' | 'email'>>('register')
    const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            name: saved?.name ?? '',
            email: saved?.email ?? '',
            password: '',
            confirmPassword: '',
        },
    })
    usePersistedRhfValues('register', watch, (values) => ({
        name: values.name ?? '',
        email: values.email ?? '',
    }))

    const onSubmit = async (data: RegisterForm) => {
        registrationFunnel('submit', { method: 'email' })
        try {
            const { verificationRequired } = await registerUser(data.name, data.email, data.password)
            if (verificationRequired) {
                registrationFunnel('verification_required', { method: 'email' })
                toast.success('Мы отправили код на твою почту')
                navigate('/verify-email', { state: { email: data.email, password: data.password } })
                return
            }
            toast.success('Регистрация успешна!')
            navigate(authDestination())
        } catch (error: any) {
            const raw = String(error?.message || '')
            registrationFunnel('error', { reason: /already exists/i.test(raw) ? 'account_exists' : 'request_failed' })
            toast.error(/already exists/i.test(raw) ? 'Пользователь с таким email уже зарегистрирован' : raw)
        }
    }

    return (
        <AuthSplitLayout
            marketingTitle="Пора тренироваться"
            marketingDescription={`${freeTrainingCaption()} бесплатно. Вопросы под твой стек — от Intern до Senior. Без привязки карты.`}
        >
            <div className="w-full">
                <FormCard>
                    <div className="mb-6">
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight mb-2">Регистрация</h1>
                        <p className="text-secondary text-sm leading-relaxed">
                            {hasTraining ? 'Выбранная тренировка сохранена. Создай аккаунт, чтобы начать.' : 'Создай аккаунт и начни подготовку.'}
                        </p>
                        <p className="mt-3 text-sm font-medium text-inter-verse-green dark:text-purple-400">
                            {freeTrainingCaption()} бесплатно · без привязки карты
                        </p>
                    </div>

                    <div className="mb-4"><AuthLegalNotice neutral /></div>
                    <GoogleAuthButton onClick={() => registrationFunnel('google_click', { method: 'google' })} />
                    <div className="my-5 flex items-center gap-3 text-xs text-secondary">
                        <span className="h-px flex-1 bg-gray-200 dark:bg-iv-dark-line" />
                        или через email
                        <span className="h-px flex-1 bg-gray-200 dark:bg-iv-dark-line" />
                    </div>
                    <form noValidate onChangeCapture={trackStart} onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-4">
                        <Input id="registration-name" autoComplete="name" label="Имя" variant="underlined" placeholder="Иван Иванов" error={errors.name?.message} {...register('name')} />
                        <Input id="registration-email" autoComplete="email" label="Email" type="email" variant="underlined" placeholder="you@company.com" error={errors.email?.message} {...register('email')} />

                        <div>
                            <label htmlFor="registration-password" className="block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Пароль</label>
                            <div className="relative">
                                <input id="registration-password" autoComplete="new-password" {...register('password')} type={showPassword ? 'text' : 'password'} className="input-field-underlined pr-10" placeholder="••••••••" />
                                <button type="button" aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'} onClick={() => setShowPassword(!showPassword)} className="absolute right-0 top-1/2 -translate-y-1/2 btn-icon w-8 h-8">
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {errors.password && <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>}
                        </div>

                        <div>
                            <label htmlFor="registration-confirm" className="block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Повтори пароль</label>
                            <div className="relative">
                                <input id="registration-confirm" autoComplete="new-password" {...register('confirmPassword')} type={showConfirm ? 'text' : 'password'} className="input-field-underlined pr-10" placeholder="••••••••" />
                                <button type="button" aria-label={showConfirm ? 'Скрыть подтверждение пароля' : 'Показать подтверждение пароля'} onClick={() => setShowConfirm(!showConfirm)} className="absolute right-0 top-1/2 -translate-y-1/2 btn-icon w-8 h-8">
                                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {errors.confirmPassword && <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword.message}</p>}
                        </div>



                        <Button type="submit" loading={isLoading} className="w-full">Зарегистрироваться</Button>
                    </form>

                    <p className="mt-6 text-center text-sm text-secondary">
                        Уже есть аккаунт?{' '}
                        <Link to="/login" className="inline-flex items-center min-h-[44px] px-1 font-medium text-inter-verse-green dark:text-purple-400 hover:underline">Войти</Link>
                    </p>
                </FormCard>
            </div>
        </AuthSplitLayout>
    )
}
