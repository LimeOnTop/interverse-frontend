import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'

const STEP_MINUTES = 15
const SLOTS_PER_DAY = (24 * 60) / STEP_MINUTES
const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

const pad = (value: number) => String(value).padStart(2, '0')

function dayKey(date: Date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function parseLocal(value: string) {
    const [datePart, timePart = '00:00'] = value.split('T')
    const [year, month, day] = datePart.split('-').map(Number)
    const [hours, minutes] = timePart.split(':').map(Number)
    return new Date(year, (month || 1) - 1, day || 1, hours || 0, minutes || 0)
}

function toLocalValue(date: Date) {
    return `${dayKey(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** Next 15-minute slot after now. */
export function nextSlot(from = new Date()) {
    const date = new Date(from)
    date.setSeconds(0, 0)
    date.setMinutes(Math.floor(date.getMinutes() / STEP_MINUTES) * STEP_MINUTES + STEP_MINUTES)
    return toLocalValue(date)
}

interface SchedulePickerProps {
    /** Local "YYYY-MM-DDTHH:mm". */
    value: string
    onChange: (value: string) => void
}

/** Date in a styled popover calendar and time on a 15-minute slider. */
export default function SchedulePicker({ value, onChange }: SchedulePickerProps) {
    const selected = useMemo(() => parseLocal(value || nextSlot()), [value])
    const [open, setOpen] = useState(false)
    const [month, setMonth] = useState(() => new Date(selected.getFullYear(), selected.getMonth(), 1))
    const popoverRef = useRef<HTMLDivElement>(null)

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const isToday = dayKey(selected) === dayKey(now)
    // Earliest slot allowed on the selected day.
    const minSlot = isToday ? Math.ceil((now.getHours() * 60 + now.getMinutes() + 1) / STEP_MINUTES) : 0
    const slot = Math.max(minSlot, Math.round((selected.getHours() * 60 + selected.getMinutes()) / STEP_MINUTES))

    useEffect(() => {
        if (!open) return
        const onClick = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) setOpen(false)
        }
        const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
        document.addEventListener('mousedown', onClick)
        document.addEventListener('keydown', onKey)
        return () => {
            document.removeEventListener('mousedown', onClick)
            document.removeEventListener('keydown', onKey)
        }
    }, [open])

    const setDateTime = (day: Date, nextSlotIndex: number) => {
        const sameAsToday = dayKey(day) === dayKey(now)
        const floor = sameAsToday ? Math.ceil((now.getHours() * 60 + now.getMinutes() + 1) / STEP_MINUTES) : 0
        const index = Math.min(SLOTS_PER_DAY - 1, Math.max(floor, nextSlotIndex))
        const minutes = index * STEP_MINUTES
        onChange(toLocalValue(new Date(day.getFullYear(), day.getMonth(), day.getDate(), Math.floor(minutes / 60), minutes % 60)))
    }

    const days = useMemo(() => {
        const first = new Date(month.getFullYear(), month.getMonth(), 1)
        const offset = (first.getDay() + 6) % 7
        const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
        return [
            ...Array.from({ length: offset }, () => null),
            ...Array.from({ length: count }, (_, index) => new Date(month.getFullYear(), month.getMonth(), index + 1)),
        ]
    }, [month])

    const minutes = slot * STEP_MINUTES
    const timeLabel = `${pad(Math.floor(minutes / 60) % 24)}:${pad(minutes % 60)}`
    const dateLabel = selected.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'long' })
    const canGoBack = month > new Date(today.getFullYear(), today.getMonth(), 1)
    const lastDay = isToday && minSlot >= SLOTS_PER_DAY

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative" ref={popoverRef}>
                <span className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Дата</span>
                <button
                    type="button"
                    onClick={() => setOpen((prev) => !prev)}
                    aria-expanded={open}
                    className={`w-full flex items-center gap-3 rounded-lg border-2 px-4 py-3 text-left transition-iv ${
                        open
                            ? 'border-inter-verse-green dark:border-purple-400'
                            : 'border-gray-200 dark:border-iv-dark-line hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                >
                    <CalendarDays className="w-5 h-5 text-inter-verse-green dark:text-purple-400" />
                    <span className="font-semibold text-gray-900 dark:text-gray-100 first-letter:uppercase">{dateLabel}</span>
                </button>

                <AnimatePresence>
                    {open && (
                        <motion.div
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.15 }}
                            className="absolute z-30 mt-2 w-[19rem] max-w-[calc(100vw-2rem)] iv-surface rounded-xl border border-gray-200 dark:border-iv-dark-line shadow-iv-xl p-4"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <button
                                    type="button"
                                    disabled={!canGoBack}
                                    onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-secondary hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-30"
                                    aria-label="Предыдущий месяц"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 first-letter:uppercase">
                                    {month.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-secondary hover:text-gray-900 dark:hover:text-gray-100"
                                    aria-label="Следующий месяц"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="grid grid-cols-7 gap-1 text-center">
                                {WEEKDAYS.map((day) => (
                                    <span key={day} className="text-[11px] font-semibold text-secondary py-1">{day}</span>
                                ))}
                                {days.map((day, index) => {
                                    if (!day) return <span key={`empty-${index}`} />
                                    const past = day < today
                                    const active = dayKey(day) === dayKey(selected)
                                    const current = dayKey(day) === dayKey(now)
                                    return (
                                        <button
                                            key={dayKey(day)}
                                            type="button"
                                            disabled={past}
                                            onClick={() => {
                                                setDateTime(day, slot)
                                                setOpen(false)
                                            }}
                                            className={`h-9 rounded-lg border-2 text-sm tabular-nums transition-iv ${
                                                active
                                                    ? 'border-inter-verse-green dark:border-purple-400 font-semibold text-gray-900 dark:text-gray-100'
                                                    : current
                                                        ? 'border-transparent font-semibold text-inter-verse-green dark:text-purple-400'
                                                        : 'border-transparent text-gray-800 dark:text-gray-200 hover:border-gray-200 dark:hover:border-iv-dark-line'
                                            } disabled:opacity-30 disabled:pointer-events-none`}
                                        >
                                            {day.getDate()}
                                        </button>
                                    )
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div>
                <div className="flex items-baseline justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Время</span>
                    <span className="text-3xl font-bold tabular-nums tracking-tight gradient-text-adaptive">{lastDay ? '—' : timeLabel}</span>
                </div>
                <input
                    type="range"
                    min={0}
                    max={SLOTS_PER_DAY - 1}
                    step={1}
                    value={Math.min(slot, SLOTS_PER_DAY - 1)}
                    onChange={(event) => setDateTime(selected, Number(event.target.value))}
                    aria-label="Время начала"
                    aria-valuetext={timeLabel}
                    className="iv-range w-full"
                    style={{ ['--iv-range-fill' as string]: `${(slot / (SLOTS_PER_DAY - 1)) * 100}%` }}
                />
                <div className="mt-1 flex justify-between text-[11px] text-secondary tabular-nums">
                    <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>23:45</span>
                </div>
                {lastDay && <p className="mt-2 text-xs text-red-600 dark:text-red-400">На сегодня время закончилось, выберите другую дату.</p>}
            </div>
        </div>
    )
}
