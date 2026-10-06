import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
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
    name: z.string().min(2, 'Минимум 2 символа'),
    email: z.string().email('Некорректный email'),
    password: z.string().min(6, 'Минимум 6 символов'),
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
        try {
            const { verificationRequired } = await registerUser(data.name, data.email, data.password)
            if (verificationRequired) {
                toast.success('Мы отправили код на вашу почту')
                navigate('/verify-email', { state: { email: data.email, password: data.password } })
                return
            }
            toast.success('Регистрация успешна!')
            navigate('/dashboard')
        } catch (error: any) {
            const raw = String(error?.message || '')
            toast.error(/already exists/i.test(raw) ? 'Пользователь с таким email уже зарегистрирован' : raw)
        }
    }

    return (
        <AuthSplitLayout
            marketingTitle="Пора тренироваться"
            marketingDescription="Зарегистрируйся и пройди первую симуляцию интервью за несколько минут. Вопросы под твой стек — от Intern до Senior."
        >
            <div className="w-full">
                <FormCard>
                    <div className="mb-8">
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight mb-2">Регистрация</h1>
                        <p className="text-secondary text-sm">Создайте аккаунт и начните подготовку</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <Input label="Имя" variant="underlined" placeholder="Иван Иванов" error={errors.name?.message} {...register('name')} />
                        <Input label="Email" type="email" variant="underlined" placeholder="you@company.com" error={errors.email?.message} {...register('email')} />

                        <div>
                            <label className="block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Пароль</label>
                            <div className="relative">
                                <input {...register('password')} type={showPassword ? 'text' : 'password'} className="input-field-underlined pr-10" placeholder="••••••••" />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-0 top-1/2 -translate-y-1/2 btn-icon w-8 h-8">
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {errors.password && <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Подтверждение</label>
                            <div className="relative">
                                <input {...register('confirmPassword')} type={showConfirm ? 'text' : 'password'} className="input-field-underlined pr-10" placeholder="••••••••" />
                                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-0 top-1/2 -translate-y-1/2 btn-icon w-8 h-8">
                                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {errors.confirmPassword && <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword.message}</p>}
                        </div>

                        <p className="text-xs text-secondary text-center leading-relaxed">
                            Нажимая «Зарегистрироваться», вы подтверждаете, что вам исполнилось 18 лет,
                            даёте согласие на обработку персональных данных в соответствии с{' '}
                            <Link
                                to="/privacy"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-inter-verse-green dark:text-purple-400 hover:underline"
                            >
                                Политикой обработки персональных данных
                            </Link>
                            {' '}и принимаете условия{' '}
                            <a
                                href="/legal/oferta.html"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-inter-verse-green dark:text-purple-400 hover:underline"
                            >
                                публичной оферты
                            </a>
                            {' '}(пользовательского соглашения).
                        </p>

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
