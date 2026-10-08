import { useEffect, useRef, useState } from 'react'
import {
    addDays, addMonths, format, isBefore, isSameDay, isSameMonth,
    startOfDay, startOfMonth, startOfWeek, subMonths,
} from 'date-fns'
import { ru } from 'date-fns/locale'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'

const STEP = 15
const LAST_SLOT = 24 * 60 - STEP
const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

const pad = (value: number) => value.toString().padStart(2, '0')
const formatMinutes = (minutes: number) => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`

/** First 15-minute slot after `now`, in minutes from midnight (may exceed the day). */
const nextSlotToday = (now: Date) => Math.ceil((now.getHours() * 60 + now.getMinutes() + 1) / STEP) * STEP

/** Local "YYYY-MM-DDTHH:mm" value for the wizard draft. */
const toValue = (date: Date, minutes: number) => `${format(date, 'yyyy-MM-dd')}T${formatMinutes(minutes)}`

export default function SchedulePicker({ value, onChange }: {
    value: string
    onChange: (value: string) => void
}) {
    const now = new Date()
    const today = startOfDay(now)
    const firstSlot = nextSlotToday(now)
    // After the last slot of the day, the earliest available day is tomorrow.
    const minDay = firstSlot > LAST_SLOT ? addDays(today, 1) : today

    const parsed = value ? new Date(value) : null
    const date = parsed && !Number.isNaN(parsed.getTime()) ? startOfDay(parsed) : minDay
    const rawMinutes = parsed && !Number.isNaN(parsed.getTime()) ? parsed.getHours() * 60 + parsed.getMinutes() : firstSlot
    const minMinutes = isSameDay(date, today) ? Math.min(firstSlot, LAST_SLOT) : 0
    const minutes = Math.min(Math.max(Math.round(rawMinutes / STEP) * STEP, minMinutes), LAST_SLOT)

    // Keep the stored value on the 15-minute grid and in the future.
    useEffect(() => {
        const normalized = toValue(isBefore(date, minDay) ? minDay : date, minutes)
        if (normalized !== value) onChange(normalized)
    }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

    const [open, setOpen] = useState(false)
    const [month, setMonth] = useState(startOfMonth(date))
    const popoverRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!open) return
        const close = (event: MouseEvent) => {
            if (!popoverRef.current?.contains(event.target as Node)) setOpen(false)
        }
        const escape = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false)
        document.addEventListener('mousedown', close)
        document.addEventListener('keydown', escape)
        return () => {
            document.removeEventListener('mousedown', close)
            document.removeEventListener('keydown', escape)
        }
    }, [open])

    const pickDay = (day: Date) => {
        const dayMin = isSameDay(day, today) ? Math.min(firstSlot, LAST_SLOT) : 0
        onChange(toValue(day, Math.max(minutes, dayMin)))
        setOpen(false)
    }

    const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 1 })
    const days = Array.from({ length: 42 }, (_, index) => addDays(gridStart, index))
    const fill = ((minutes - minMinutes) / Math.max(LAST_SLOT - minMinutes, 1)) * 100

    return (
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div ref={popoverRef} className="relative rounded-xl border border-gray-200 dark:border-iv-dark-line p-4">
                <p className="iv-eyebrow">Дата</p>
                <button
                    type="button"
                    onClick={() => { setMonth(startOfMonth(date)); setOpen((prev) => !prev) }}
                    aria-haspopup="dialog"
                    aria-expanded={open}
                    className={`mt-2 w-full flex items-center gap-3 rounded-lg border-2 px-3 py-2.5 text-left transition-iv ${
                        open
                            ? 'border-inter-verse-green dark:border-purple-400'
                            : 'border-gray-200 dark:border-iv-dark-line hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                >
                    <CalendarDays className="w-5 h-5 shrink-0 text-inter-verse-green dark:text-purple-400" />
                    <span className="flex-1 min-w-0">
                        <span className="block font-semibold text-gray-900 dark:text-gray-100 capitalize">
                            {format(date, 'd MMMM', { locale: ru })}
                        </span>
                        <span className="block text-xs text-secondary capitalize">{format(date, 'EEEE, yyyy', { locale: ru })}</span>
                    </span>
                    <ChevronRight className={`w-4 h-4 text-secondary transition-transform ${open ? 'rotate-90' : ''}`} />
                </button>

                {open && (
                    <div role="dialog" aria-label="Выбор даты" className="absolute left-0 right-0 sm:right-auto sm:w-80 top-full mt-2 z-30 iv-panel shadow-iv-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                            <button
                                type="button"
                                onClick={() => setMonth(subMonths(month, 1))}
                                disabled={!isBefore(startOfMonth(minDay), month)}
                                aria-label="Предыдущий месяц"
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-secondary hover:bg-gray-50 dark:hover:bg-iv-dark-bg disabled:opacity-30 disabled:pointer-events-none"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 capitalize">
                                {format(month, 'LLLL yyyy', { locale: ru })}
                            </span>
                            <button
                                type="button"
                                onClick={() => setMonth(addMonths(month, 1))}
                                aria-label="Следующий месяц"
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-secondary hover:bg-gray-50 dark:hover:bg-iv-dark-bg"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-center">
                            {WEEKDAYS.map((day) => (
                                <span key={day} className="text-[11px] font-semibold text-secondary py-1">{day}</span>
                            ))}
                            {days.map((day) => {
                                const disabled = isBefore(day, minDay)
                                const selected = isSameDay(day, date)
                                return (
                                    <button
                                        key={day.toISOString()}
                                        type="button"
                                        onClick={() => pickDay(day)}
                                        disabled={disabled}
                                        aria-pressed={selected}
                                        className={`h-9 rounded-lg border-2 text-sm transition-iv disabled:opacity-30 disabled:pointer-events-none ${
                                            selected
                                                ? 'border-inter-verse-green dark:border-purple-400 font-semibold text-gray-900 dark:text-gray-100'
                                                : `border-transparent hover:bg-gray-50 dark:hover:bg-iv-dark-bg ${
                                                    isSameMonth(day, month) ? 'text-gray-900 dark:text-gray-100' : 'text-secondary'
                                                } ${isSameDay(day, today) ? 'font-semibold text-inter-verse-green dark:text-purple-300' : ''}`
                                        }`}
                                    >
                                        {format(day, 'd')}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>

            <div className="rounded-xl border border-gray-200 dark:border-iv-dark-line p-4">
                <div className="flex items-baseline justify-between gap-3">
                    <p className="iv-eyebrow">Время</p>
                    <span className="text-xs text-secondary">шаг 15 минут</span>
                </div>
                <output
                    htmlFor="schedule-time"
                    aria-live="polite"
                    className="mt-1 block font-mono text-4xl font-bold tracking-tight text-inter-verse-green dark:text-purple-300 tabular-nums"
                >
                    {formatMinutes(minutes)}
                </output>
                <input
                    id="schedule-time"
                    type="range"
                    min={minMinutes}
                    max={LAST_SLOT}
                    step={STEP}
                    value={minutes}
                    onChange={(event) => onChange(toValue(date, Number(event.target.value)))}
                    aria-label="Время начала"
                    aria-valuetext={formatMinutes(minutes)}
                    className="iv-range mt-3"
                    style={{ ['--iv-range-fill' as string]: `${fill}%` }}
                />
                <div className="mt-1 flex justify-between text-[11px] font-mono text-secondary">
                    <span>{formatMinutes(minMinutes)}</span>
                    <span>{formatMinutes(LAST_SLOT)}</span>
                </div>
            </div>
        </div>
    )
}
