import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { useAuthStore } from '../store/authStore'

export default function AccountSecurity() {
    const { user, logout } = useAuthStore()
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [currentPassword, setCurrentPassword] = useState('')
    const [code, setCode] = useState('')
    const [sentTo, setSentTo] = useState('')
    const [busy, setBusy] = useState(false)
    const [message, setMessage] = useState('')
    const changingEmail = Boolean(email.trim() && email.trim().toLowerCase() !== user?.email.toLowerCase())
    if (!user || user.role === 'admin') return null
    const fail = (e: unknown) => setMessage((e as { response?: { data?: { error?: string } } }).response?.data?.error || 'Не удалось изменить данные. Попробуй ещё раз.')
    async function finish() {
        setPassword(''); setCurrentPassword(''); setCode('')
        await logout(); navigate('/login', { replace: true })
    }
    async function submitEmail(e: React.FormEvent) {
        e.preventDefault()
        if (busy || (!sentTo && !changingEmail) || (sentTo && code.length !== 6)) return
        setBusy(true); setMessage('')
        try {
            if (sentTo) {
                await api.put(`/users/${user!.id}`, { email: sentTo, email_code: code })
                await finish()
            } else {
                const address = email.trim().toLowerCase()
                await api.post(`/users/${user!.id}/email-change`, { email: address })
                setSentTo(address); setCode('')
            }
        } catch (e) { fail(e) } finally { setBusy(false) }
    }
    async function submitPassword(e: React.FormEvent) {
        e.preventDefault()
        if (busy || !password || !currentPassword) return
        setBusy(true); setMessage('')
        try {
            await api.put(`/users/${user!.id}`, { password, current_password: currentPassword })
            await finish()
        } catch (e) { fail(e) } finally { setBusy(false) }
    }
    return <div className="grid gap-6 max-w-lg ym-hide-content" data-private onClick={e => e.stopPropagation()}>
        <p className="text-sm text-secondary">После изменения потребуется войти заново.</p>
        <form onSubmit={submitEmail} className="grid gap-3">
            {sentTo ? <label className="grid gap-2 text-sm">Код из письма
                <span className="account-email-code">
                    <span className="account-email-code__slots" aria-hidden="true">{Array.from({ length: 6 }, (_, i) => <span key={i}>{code[i] || '—'}</span>)}</span>
                    <input className="account-email-code__input" aria-label="Код из письма" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} autoFocus disabled={busy} />
                </span>
            </label> : <label className="grid gap-2 text-sm">Новый email<input className="input-field" type="email" autoComplete="email" placeholder={user.email} value={email} onChange={e => setEmail(e.target.value)} required disabled={busy} /></label>}
            <button type="submit" className="btn-primary-adaptive px-4 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed" disabled={busy || (sentTo ? code.length !== 6 : !changingEmail)}>{sentTo ? 'Подтвердить' : 'Отправить'}</button>
            {sentTo && <button type="button" className="text-sm text-secondary justify-self-start" disabled={busy} onClick={() => { setSentTo(''); setCode(''); setMessage('') }}>Изменить email</button>}
        </form>
        <form onSubmit={submitPassword} className="grid gap-4">
            <label className="grid gap-2 text-sm">Новый пароль<input className="input-field" type="password" autoComplete="new-password" minLength={8} maxLength={72} value={password} onChange={e => setPassword(e.target.value)} required disabled={busy} /></label>
            {password && <label className="grid gap-2 text-sm">Текущий пароль<input className="input-field" type="password" autoComplete="current-password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required maxLength={72} disabled={busy} /></label>}
            <button type="submit" className="btn-primary-adaptive px-4 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed" disabled={busy || !password || !currentPassword}>Изменить пароль</button>
        </form>
        <p role="status" aria-live="polite" className="text-sm text-secondary">{message}</p>
    </div>
}
