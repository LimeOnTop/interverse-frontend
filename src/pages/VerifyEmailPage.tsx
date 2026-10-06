import { FormEvent, useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import AuthSplitLayout from '../components/AuthSplitLayout'
import FormCard from '../components/ui/FormCard'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

const RESEND_SECONDS = 60

interface VerifyState {
    email?: string
    password?: string
}

function verifyErrorText(raw: string) {
    if (/invalid code/i.test(raw)) return 'Неверный код'
    if (/expired/i.test(raw)) return 'Код истёк, запросите новый'
    if (/too many attempts/i.test(raw)) return 'Слишком много попыток, запросите новый код'
    if (/invalid credentials/i.test(raw)) return 'Неверный пароль'
    if (/already verified/i.test(raw)) return 'Email уже подтверждён, войдите в аккаунт'
    return raw || 'Не удалось подтвердить email'
}

export default function VerifyEmailPage() {
    const location = useLocation()
    const navigate = useNavigate()
    const { verifyEmail, resendVerification, isLoading } = useAuthStore()

    // Password lives only in router state (memory), never in storage.
    const state = (location.state || {}) as VerifyState
    const email = state.email || new URLSearchParams(location.search).get('email') || ''
    const [password, setPassword] = useState(state.password || '')
    const [showPassword, setShowPassword] = useState(false)
    const [code, setCode] = useState('')
    const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS)
    const [resending, setResending] = useState(false)

    useEffect(() => {
        if (secondsLeft <= 0) return
        const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000)
        return () => clearTimeout(timer)
    }, [secondsLeft])

    if (!email) {
        return <Navigate to="/register" replace />
    }

    const onSubmit = async (e: FormEvent) => {
        e.preventDefault()
        if (code.length !== 6) {
            toast.error('Введите 6 цифр из письма')
            return
        }
        if (!password) {
            toast.error('Введите пароль')
            return
        }
        try {
            const user = await verifyEmail(email, code, password)
            toast.success('Email подтверждён!')
            navigate(user?.role === 'admin' ? '/admin' : '/dashboard', { replace: true })
        } catch (error: any) {
            toast.error(verifyErrorText(String(error?.message || '')))
        }
    }

    const onResend = async () => {
        setResending(true)
        try {
            const retry = await resendVerification(email)
            setSecondsLeft(retry)
            toast.success('Новый код отправлен')
        } catch (error: any) {
            const raw = String(error?.message || '')
            toast.error(/too many codes/i.test(raw) ? 'Лимит писем на сегодня исчерпан' : 'Не удалось отправить код')
        } finally {
            setResending(false)
        }
    }

    return (
        <AuthSplitLayout
            marketingTitle="Почти готово"
            marketingDescription="Подтвердите почту, чтобы сохранить прогресс тренировок и получать отчёты."
        >
            <div className="w-full">
                <FormCard>
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold tracking-tight mb-2">Подтверждение email</h1>
                        <p className="text-secondary text-sm">
                            Мы отправили 6-значный код на <span className="font-medium">{email}</span>. Если письма нет, проверьте папку «Спам».
                        </p>
                    </div>

                    <form onSubmit={onSubmit} className="space-y-5">
                        <Input
                            label="Код из письма"
                            variant="underlined"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            maxLength={6}
                            placeholder="123456"
                            autoFocus
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            className="tracking-[0.5em] text-lg"
                        />

                        {!state.password && (
                            <div>
                                <label className="block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Пароль</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        className="input-field-underlined pr-10"
                                        placeholder="••••••••"
                                        autoComplete="current-password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-0 top-1/2 -translate-y-1/2 btn-icon w-8 h-8">
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        )}

                        <Button type="submit" loading={isLoading} className="w-full">Подтвердить</Button>
                    </form>

                    <div className="mt-6 text-center text-sm text-secondary">
                        {secondsLeft > 0 ? (
                            <span>Отправить код повторно через {secondsLeft} с</span>
                        ) : (
                            <button
                                type="button"
                                onClick={onResend}
                                disabled={resending}
                                className="font-medium text-inter-verse-green dark:text-purple-400 hover:underline disabled:opacity-50"
                            >
                                Отправить код повторно
                            </button>
                        )}
                    </div>

                    <p className="mt-4 text-center text-sm text-secondary">
                        Ошиблись адресом?{' '}
                        <Link to="/register" className="font-medium text-inter-verse-green dark:text-purple-400 hover:underline">Зарегистрироваться заново</Link>
                    </p>
                </FormCard>
            </div>
        </AuthSplitLayout>
    )
}
