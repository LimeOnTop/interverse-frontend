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
    const fail = (e: unknown) => setMessage((e as { response?: { data?: { error?: string } } }).response?.data?.error || 'Не удалось изменить данные. Проверь пароль и код.')
    async function sendCode() {
        setBusy(true); setMessage('')
        try { await api.post(`/users/${user!.id}/email-change`, { email: email.trim(), current_password: currentPassword }); setSentTo(email.trim().toLowerCase()); setMessage('Код отправлен на новый адрес. Текущий email пока не изменён.') }
        catch (e) { fail(e) } finally { setBusy(false) }
    }
    async function save(e: React.FormEvent) {
        e.preventDefault(); setBusy(true); setMessage('')
        try {
            await api.put(`/users/${user!.id}`, { ...(changingEmail ? { email: email.trim(), email_code: code } : {}), ...(password ? { password } : {}), current_password: currentPassword })
            setPassword(''); setCurrentPassword(''); setCode('')
            await logout(); navigate('/login', { replace: true })
        } catch (e) { fail(e) } finally { setBusy(false) }
    }
    return <form onSubmit={save} className="grid gap-4 max-w-lg ym-hide-content" data-private>
            <p className="text-sm text-secondary">После изменения потребуется войти заново. Подтверди изменения текущим паролем аккаунта.</p>
            <label className="grid gap-2 text-sm">Текущий пароль<input className="input-field" type="password" autoComplete="current-password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required maxLength={72} /></label>
            <label className="grid gap-2 text-sm">Новый email<input className="input-field" type="email" autoComplete="email" placeholder={user.email} value={email} onChange={e => { setEmail(e.target.value); setCode('') }} /></label>
            {changingEmail && <><button type="button" className="btn-secondary" disabled={busy || !currentPassword} onClick={sendCode}>Отправить код на новый email</button><label className="grid gap-2 text-sm">Код из письма<input className="input-field" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={e => setCode(e.target.value)} required /></label></>}
            <label className="grid gap-2 text-sm">Новый пароль<input className="input-field" type="password" autoComplete="new-password" minLength={8} maxLength={72} value={password} onChange={e => setPassword(e.target.value)} /></label>
            <p role="status" className="text-sm text-secondary">{message}</p>
            <button className="btn-primary-adaptive px-4 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed" disabled={busy || !currentPassword || (!password && !changingEmail) || (changingEmail && (code.length !== 6 || sentTo !== email.trim().toLowerCase()))}>Сохранить и выйти на всех устройствах</button>
    </form>
}
