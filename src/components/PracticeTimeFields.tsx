import { useId } from 'react'
import '../styles/practice-reminders.css'
import { localParts } from '../lib/practiceTime'
import { timeZoneLabel } from '../lib/practiceReminders'

export default function PracticeTimeFields({ value, onChange, zone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Moscow', disabled = false }: { value: string; onChange: (value: string) => void; zone?: string; disabled?: boolean }) {
    const id = useId()
    const [day = '', time = '19:00'] = value.split('T')
    const today = localParts(new Date(), zone)
    function quick(offset: number) { onChange(`${localParts(new Date(Date.now() + offset * 86400000), zone).day}T19:00`) }
    return <div className="pr-time-editor">
        <div className="pr-quick"><button type="button" disabled={disabled || today.time >= '19:00'} onClick={() => quick(0)}>Сегодня, 19:00</button><button type="button" disabled={disabled} onClick={() => quick(1)}>Завтра, 19:00</button><button type="button" disabled={disabled} onClick={() => document.getElementById(id)?.focus()}>Другое время</button></div>
        <div className="pr-fields"><label>Дата<input id={id} type="date" min={today.day} value={day} required disabled={disabled} onChange={event => onChange(`${event.target.value}T${time}`)} /></label><label>Время<input type="time" step={60} value={time} required disabled={disabled} onChange={event => onChange(`${day}T${event.target.value}`)} /></label></div>
        <small className="pr-zone">Часовой пояс: {timeZoneLabel(zone)}</small>
    </div>
}
