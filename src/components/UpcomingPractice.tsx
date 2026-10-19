import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, Bell, Clock3, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '../services/api'
import { usePracticeReminders, dateTimeLabel, reminderChanged, timeZoneLabel, type PracticeReminder } from '../lib/practiceReminders'
import { startInterviewSession, formatUserFacingError } from '../lib/interviewSession'
import { isTrainingLimitError } from '../store/promoStore'
import PracticeReminderDialog from './PracticeReminderDialog'
import { cancelPracticePlan } from './PracticePlanActions'
import '../styles/practice-reminders.css'

export default function UpcomingPractice() {
    const { items, error, loading, reload } = usePracticeReminders()
    const [search] = useSearchParams()
    const [chosen, setChosen] = useState('')
    const [editing, setEditing] = useState<PracticeReminder | null>(null)
    const [busy, setBusy] = useState(false)
    const navigate = useNavigate()
    useEffect(() => {
        const change = (event: Event) => { const id = (event as CustomEvent<{ id?: string }>).detail?.id; if (id) setChosen(id) }
        const timer = window.setInterval(() => { if (document.visibilityState === 'visible') void reload() }, 30000)
        const focus = () => { void reload() }
        window.addEventListener('practice-reminders-changed', change); window.addEventListener('focus', focus)
        return () => { window.clearInterval(timer); window.removeEventListener('practice-reminders-changed', change); window.removeEventListener('focus', focus) }
    }, [reload])
    if (error) return <div className="pr-load-error" role="status">{error}<button onClick={() => void reload()}>Повторить</button></div>
    if (loading || !items.length) return null
    const sorted = [...items].sort((a, b) => {
        const now = Date.now(), pastA = new Date(a.scheduled_at).getTime() < now, pastB = new Date(b.scheduled_at).getTime() < now
        return Number(pastA) - Number(pastB) || (pastA ? Date.parse(b.scheduled_at) - Date.parse(a.scheduled_at) : Date.parse(a.scheduled_at) - Date.parse(b.scheduled_at))
    })
    const plan = items.find(item => item.id === (chosen || search.get('reminder'))) || sorted[0]
    const past = Date.parse(plan.scheduled_at) < Date.now()
    async function start() {
        if (busy) return
        setBusy(true)
        try { const { data } = await api.post('/practice-reminders/start', { id: plan.id, revision: plan.revision }); await startInterviewSession(api, data.interview_id); reminderChanged(); navigate(`/interview/${data.interview_id}`) }
        catch (error) { if (!isTrainingLimitError(error)) toast.error(formatUserFacingError(error, 'Не удалось начать практику. Проверьте параметры плана или попробуйте ещё раз.')); void reload() }
        finally { setBusy(false) }
    }
    async function cancel() {
        if (busy) return
        setBusy(true)
        try { await cancelPracticePlan(plan) } catch (error) { toast.error(formatUserFacingError(error, 'Не удалось отменить план')) }
        finally { setBusy(false) }
    }
    async function retryMail() {
        if (busy) return
        setBusy(true)
        try { await api.post('/practice-reminders/retry-email', { id: plan.id, revision: plan.revision }); reminderChanged(plan.id); toast.success('Повторная отправка запланирована') }
        catch (error) { toast.error(formatUserFacingError(error, 'Не удалось повторить отправку')) }
        finally { setBusy(false) }
    }
    const mailStatus = plan.email_failed ? plan.email_error === 'uncertain' ? 'Письмо могло быть доставлено. Повторно не отправляем.' : 'Письмо не отправлено. План сохранён на главной.' : plan.email_retry_at ? 'Временный сбой почты. Повторим отправку автоматически.' : plan.email_sent ? 'Письмо передано почтовому сервису' : plan.email_enabled ? 'Одно письмо за час до начала' : 'Без уведомления · план сохранён на главной'
    return <><section className="pr-card" aria-label="Ближайшая практика"><header><span><Clock3 size={15} />Ближайшая практика</span><span>{past ? 'Можно вернуться' : 'Запланировано'}</span></header>
        <div className="pr-card-body"><p className="pr-when">{past ? 'Вернёмся к практике?' : dateTimeLabel(plan.scheduled_at, plan.timezone)}</p><small>{past ? 'План был на ' + dateTimeLabel(plan.scheduled_at, plan.timezone) : 'Можно начать раньше'} · {timeZoneLabel(plan.timezone)}</small><h2>{plan.title}</h2><p className="pr-card-copy">{past ? 'Выберите удобный момент. Новая практика начнётся с первого вопроса, начатая — продолжится.' : 'Следующий шаг уже выбран. Продолжайте в своём темпе.'}</p>
            <div className="pr-actions"><button className="pr-btn primary" disabled={busy} onClick={() => void start()}>{busy ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}{past ? 'Вернуться к практике' : 'Начать сейчас'}</button><button className="pr-btn" disabled={busy} onClick={event => { event.currentTarget.focus(); setEditing(plan) }}>{plan.kind === 'draft' ? 'Изменить параметры и время' : 'Перенести время'}</button><button className="pr-btn pr-cancel" disabled={busy} onClick={() => void cancel()}>Отменить план</button></div>
            {items.length > 1 && <label className="pr-other">Все планы · {items.length}<select aria-label="Выбрать практику" value={plan.id} onChange={event => setChosen(event.target.value)}>{sorted.map(item => <option value={item.id} key={item.id}>{dateTimeLabel(item.scheduled_at, item.timezone)} · {item.title}</option>)}</select></label>}
        </div><footer><Bell size={14} /><span>{mailStatus}</span>{plan.email_failed && plan.email_error !== 'uncertain' && !plan.email_sent && <button className="pr-btn" disabled={busy} onClick={() => void retryMail()}>Повторить отправку</button>}</footer></section>{editing && <PracticeReminderDialog target={editing} existing={editing} onClose={() => setEditing(null)} />}</>
}
