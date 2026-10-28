import { useDialogMotion } from '../hooks/useDialogMotion'
import { useEffect, useRef, useState } from 'react'
import { Bell, Loader2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '../services/api'
import { formatUserFacingError } from '../lib/interviewSession'
import { reminderAllowed } from '../lib/practiceCalendar'
import { localParts, zonedISO } from '../lib/practiceTime'
import { reminderChanged, usePracticeReminders, dateTimeLabel, type PracticeTarget, type PracticeReminder, type PracticePayload } from '../lib/practiceReminders'
import { useModalDialog } from '../hooks/useModalDialog'
import { usePracticeAvailability } from '../hooks/usePracticeAvailability'
import PracticeTimeFields from './PracticeTimeFields'
import PracticeOptionsEditor, { AvailabilityNotice } from './PracticeOptionsEditor'
import { cancelPracticePlan } from './PracticePlanActions'
import '../styles/practice-reminders.css'

const emptyPayload: PracticePayload = { technologies: [], specialization: 'backend', level: 'junior', task_mode: 'theory' }
export default function PracticeReminderDialog({ target, existing, onClose: finishClose }: { target: PracticeTarget; existing?: PracticeReminder; onClose: () => void }) {
    const dialog = useModalDialog()
    const { items, loading } = usePracticeReminders()
    const zone = existing?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Moscow'
    const initial = localParts(existing ? new Date(existing.scheduled_at) : new Date(Date.now() + 86400000), zone)
    const [value, setValue] = useState(`${initial.day}T${existing ? initial.time : '19:00'}`)
    const [email, setEmail] = useState(existing?.email_enabled || false)
    const [payload, setPayload] = useState<PracticePayload>(existing?.payload || target.payload || emptyPayload)
    const [saved, setSaved] = useState(existing)
    const initialized = useRef(Boolean(existing))
    const [ready, setReady] = useState(Boolean(existing))
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')
    const lock = useRef(false)
    const check = usePracticeAvailability(payload, target.kind === 'draft' && ready, true)
    useEffect(() => {
        if (initialized.current || loading) return
        const found = items.find(plan => plan.kind === target.kind && plan.target_id === target.target_id && (plan.step_index || 0) === (target.step_index || 0))
        if (found) {
            const parts = localParts(new Date(found.scheduled_at), zone)
            setSaved(found); setValue(`${parts.day}T${parts.time}`); setEmail(found.email_enabled)
            if (found.payload) setPayload(found.payload)
        }
        initialized.current = true; setReady(true)
    }, [items, loading, target.kind, target.target_id, target.step_index, zone])
    let canEmail = false
    try { const [day, time] = value.split('T'); canEmail = reminderAllowed(zonedISO(day, time, zone)) } catch { /* incomplete date */ }
    const sendEmail = email && canEmail
    async function save() {
        if (lock.current) return
        setError('')
        let at: string
        try {
            const [day, time] = value.split('T')
            if (!day || !time) throw new Error('Выберите дату и время')
            at = zonedISO(day, time, zone)
            if (new Date(at) <= new Date()) throw new Error('Это время уже прошло. Выберите время впереди.')
        } catch (error) { setError((error as Error).message); return }
        lock.current = true; setBusy(true)
        try {
            const { data } = await api.put<PracticeReminder>('/practice-reminders', { ...target, ...(target.kind === 'draft' ? { payload } : {}), id: saved?.id, revision: saved?.revision, scheduled_at: at, timezone: zone, email_enabled: sendEmail, lead_minutes: 60 })
            reminderChanged(data.id)
            toast.success(sendEmail ? 'Практика запланирована. Напомним за час до начала.' : 'План сохранён на главной, без письма.')
            onClose()
        } catch (error) { setError(formatUserFacingError(error, 'Не удалось сохранить план')) }
        finally { lock.current = false; setBusy(false) }
    }
    async function remove() {
        if (!saved || lock.current) return
        lock.current = true; setBusy(true)
        try { await cancelPracticePlan(saved); onClose() }
        catch (error) { setError(formatUserFacingError(error, 'Не удалось отменить план')) }
        finally { lock.current = false; setBusy(false) }
    }
    const blocked = busy || !ready || (target.kind === 'draft' && !check.data?.available)
    const onClose = useDialogMotion(dialog, finishClose)
    return <dialog ref={dialog} className="pr-dialog" aria-labelledby="pr-dialog-title" onCancel={event => { event.preventDefault(); if (!busy) onClose() }}>
        <header><div><span className="pr-eyebrow">Следующая практика</span><h2 id="pr-dialog-title">{saved ? 'Изменить план' : 'Запланировать практику'}</h2></div><button className="pr-close" type="button" aria-label="Закрыть" disabled={busy} onClick={onClose}><X size={18} /></button></header>
        <div className="pr-dialog-body"><div className="pr-target"><Bell size={18} /><div><b>{target.title}</b><small>{target.kind === 'preparation' ? 'Этап подготовки по вакансии' : target.kind === 'review' ? 'Повторение вопросов с ошибками' : 'Практика по выбранным параметрам'}</small></div></div>
            <form onSubmit={event => { event.preventDefault(); void save() }}>
                {target.kind === 'draft' && ready && <><PracticeOptionsEditor value={payload} onChange={setPayload} disabled={busy} /><AvailabilityNotice check={check} /></>}
                <span className="pr-field-label">Удобное время</span>
                <PracticeTimeFields value={value} onChange={setValue} zone={zone} disabled={busy} />
                <label className="pr-email"><input type="checkbox" checked={sendEmail} onChange={event => setEmail(event.target.checked)} disabled={busy || !canEmail || Boolean(saved?.email_sent) || saved?.email_error === 'uncertain'} /><span>Напомнить по email</span></label>
                <p className="pr-email-hint">{saved?.email_sent ? 'Письмо уже отправлено. Повторного письма не будет.' : saved?.email_error === 'uncertain' ? 'Письмо могло быть доставлено. Повторно не отправляем.' : !canEmail ? 'До начала меньше часа — план сохраним без письма.' : 'Одно письмо за час до начала.'}</p>
                <p className="pr-note">{sendEmail ? '' : 'Уведомление не придёт: план останется на главной. '}Планирование и перенос не расходуют попытки.{target.kind === 'preparation' ? ' Все этапы и повторы входят в одну попытку подготовки.' : target.kind === 'draft' || target.kind === 'review' ? ' Новая практика учтётся в лимите при старте.' : ''}</p>
                {error && <p role="alert" className="pr-error">{error}</p>}
                <div className="pr-actions"><button type="button" className="pr-btn" disabled={busy} onClick={onClose}>Закрыть</button><button type="submit" className="pr-btn primary" disabled={blocked}>{busy && <Loader2 size={16} className="animate-spin" />}{saved ? 'Сохранить изменения' : 'Запланировать'}</button></div>
                {saved && <button type="button" className="pr-remove" disabled={busy} onClick={() => void remove()}>Отменить план</button>}
            </form>
        </div>
    </dialog>
}
export function ReminderButton({ target, className = '' }: { target: PracticeTarget; className?: string }) {
    const [open, setOpen] = useState(false)
    const { items } = usePracticeReminders()
    const plan = items.find(item => item.kind === target.kind && item.target_id === target.target_id && (item.step_index || 0) === (target.step_index || 0))
    return <><button type="button" className={`pr-remind ${className}`} onClick={event => { event.currentTarget.focus(); setOpen(true) }}><Bell size={15} />{plan ? <span className="pr-plan-label"><span>Запланировано: {dateTimeLabel(plan.scheduled_at, plan.timezone)}</span><small>Изменить план</small></span> : 'Запланировать'}</button>{open && <PracticeReminderDialog target={target} existing={plan} onClose={() => setOpen(false)} />}</>
}
