import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Clock3 } from 'lucide-react'
import '../styles/practice-reminders.css'
import { localParts } from '../lib/practiceTime'
import { calendarDays, shiftDay, shiftMonth } from '../lib/practiceCalendar'
import { timeZoneLabel } from '../lib/practiceReminders'

const dayLabel = (day: string) => new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long', timeZone: 'UTC' }).format(new Date(`${day}T12:00:00Z`))
const shortDay = (day: string) => new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${day}T12:00:00Z`))
const monthLabel = (day: string) => new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${day}T12:00:00Z`))
const pad = (n: number) => String(n).padStart(2, '0')

export default function PracticeTimeFields({ value, onChange, zone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Moscow', disabled = false }: { value: string; onChange: (value: string) => void; zone?: string; disabled?: boolean }) {
    const id = useId(), wrapper = useRef<HTMLDivElement>(null), trigger = useRef<HTMLButtonElement>(null)
    const [day = '', time = '19:00'] = value.split('T')
    const [hour = '19', minute = '00'] = time.split(':')
    const today = localParts(new Date(), zone)
    const max = shiftMonth(today.day, 12)
    const [open, setOpen] = useState(false), [month, setMonth] = useState(day || today.day), [focused, setFocused] = useState(day || today.day)
    const [focusRequest, setFocusRequest] = useState(0)
    const days = calendarDays(month)
    const clamp = (date: string) => date < today.day ? today.day : date > max ? max : date
    useEffect(() => {
        if (!open) return
        const outside = (event: PointerEvent) => { if (!wrapper.current?.contains(event.target as Node)) setOpen(false) }
        document.addEventListener('pointerdown', outside)
        return () => document.removeEventListener('pointerdown', outside)
    }, [open])
    useEffect(() => {
        if (open) wrapper.current?.querySelector<HTMLButtonElement>(`[data-day="${focused}"]`)?.focus({ preventScroll: true })
    }, [open, focusRequest])
    function close() { setOpen(false); trigger.current?.focus({ preventScroll: true }) }
    function choose(next: string) { onChange(`${next}T${time}`); close() }
    function quick(offset: number) { onChange(`${shiftDay(today.day, offset)}T19:00`); setOpen(false) }
    function moveFocus(next: string) { const date = clamp(next); setMonth(date); setFocused(date); setFocusRequest(n => n + 1) }
    function key(event: KeyboardEvent, date: string) {
        let next: string | undefined
        if (event.key === 'ArrowLeft') next = shiftDay(date, -1)
        if (event.key === 'ArrowRight') next = shiftDay(date, 1)
        if (event.key === 'ArrowUp') next = shiftDay(date, -7)
        if (event.key === 'ArrowDown') next = shiftDay(date, 7)
        if (event.key === 'PageUp') next = shiftMonth(date, event.shiftKey ? -12 : -1)
        if (event.key === 'PageDown') next = shiftMonth(date, event.shiftKey ? 12 : 1)
        if (event.key === 'Home' || event.key === 'End') {
            const offset = (new Date(`${date}T12:00:00Z`).getUTCDay() + 6) % 7
            next = shiftDay(date, event.key === 'Home' ? -offset : 6 - offset)
        }
        if (next) { event.preventDefault(); moveFocus(next) }
    }
    return <div className="pr-time-editor" ref={wrapper} onKeyDown={event => { if (open && event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close() } }} onBlur={event => { if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false) }}>
        <div className="pr-quick"><button type="button" disabled={disabled || today.time >= '19:00'} onClick={() => quick(0)}>Сегодня, 19:00</button><button type="button" disabled={disabled} onClick={() => quick(1)}>Завтра, 19:00</button></div>
        <div className="pr-fields pr-fields--picker">
            <div className="pr-date-field"><span id={`${id}-label`} className="pr-input-label">Дата</span><button ref={trigger} type="button" className="pr-date-trigger" aria-label={`Выбрать дату, ${day ? shortDay(day) : 'не выбрана'}`} aria-expanded={open} aria-controls={`${id}-calendar`} disabled={disabled} onClick={() => { if (open) close(); else { const date = clamp(day || today.day); setMonth(date); setFocused(date); setOpen(true) } }}><CalendarDays size={17}/><span>{day ? shortDay(day) : 'Выбрать дату'}</span><ChevronDown size={16}/></button></div>
        {open && <div className="pr-calendar" id={`${id}-calendar`} role="group" aria-labelledby={`${id}-month`}>
            <div className="pr-calendar-heading"><button type="button" aria-label="Предыдущий месяц" disabled={month.slice(0,7) <= today.day.slice(0,7)} onClick={()=>{const next=clamp(shiftMonth(month,-1));setMonth(next);setFocused(next)}}><ChevronLeft size={18}/></button><b id={`${id}-month`} aria-live="polite">{monthLabel(month)}</b><button type="button" aria-label="Следующий месяц" disabled={month.slice(0,7) >= max.slice(0,7)} onClick={()=>{const next=clamp(shiftMonth(month,1));setMonth(next);setFocused(next)}}><ChevronRight size={18}/></button></div>
            <div role="grid" aria-label={monthLabel(month)}><div role="row" className="pr-calendar-row pr-weekdays">{['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(name=><span role="columnheader" key={name}>{name}</span>)}</div>{Array.from({length:6},(_,row)=><div role="row" className="pr-calendar-row" key={row}>{days.slice(row*7,row*7+7).map(date=><button type="button" role="gridcell" key={date} data-day={date} aria-label={dayLabel(date)} aria-selected={date===day} aria-current={date===today.day?'date':undefined} tabIndex={date===focused?0:-1} disabled={disabled||date<today.day||date>max} className={date.slice(0,7)!==month.slice(0,7)?'outside':''} onKeyDown={event=>key(event,date)} onClick={()=>choose(date)}>{Number(date.slice(-2))}</button>)}</div>)}</div>
            <div className="pr-calendar-footer"><button type="button" onClick={()=>choose(today.day)}>Сегодня</button><button type="button" onClick={close}>Готово</button></div>
        </div>}
            <fieldset className="pr-time-field"><legend className="pr-input-label"><Clock3 size={13}/> Время</legend><div className="pr-time-selectors"><label><span>Часы</span><select aria-label="Часы" value={hour} disabled={disabled} onChange={event => onChange(`${day}T${event.target.value}:${minute}`)}>{Array.from({length:24},(_,n)=><option key={n} value={pad(n)}>{pad(n)}</option>)}</select><ChevronDown size={14}/></label><b aria-hidden="true">:</b><label><span>Минуты</span><select aria-label="Минуты" value={minute} disabled={disabled} onChange={event => onChange(`${day}T${hour}:${event.target.value}`)}>{Array.from({length:60},(_,n)=><option key={n} value={pad(n)}>{pad(n)}</option>)}</select><ChevronDown size={14}/></label></div></fieldset>
        </div>
        <small className="pr-zone">Часовой пояс: {timeZoneLabel(zone)}</small>
    </div>
}
