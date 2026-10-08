import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { ChevronDown, X } from 'lucide-react'

const updates = [
    ['Тренировки по вакансии', 'ИИ разберёт требования и поможет подготовиться к конкретной позиции.'],
    ['Планирование тренировок', 'Выбирайте дату и время для следующей практики.'],
    ['Голосовые ответы', 'Отвечайте голосом и получайте обратную связь по содержанию и речи.'],
    ['Вопросы по вашему опыту', 'Тренируйтесь отвечать на вопросы по опыту, указанному в профиле.'],
    ['Курсы и траектории', 'Осваивайте новые направления. Первый курс — геймдизайн с помощью ИИ.'],
]

export default function UpcomingUpdates() {
    const [open, setOpen] = useState(false)
    const rootRef = useRef<HTMLDivElement>(null)
    const triggerRef = useRef<HTMLButtonElement>(null)
    const closeRef = useRef<HTMLButtonElement>(null)
    const location = useLocation()

    useEffect(() => { setOpen(false) }, [location.pathname])

    useEffect(() => {
        if (!open) return
        closeRef.current?.focus()
        const handleOutside = (event: MouseEvent) => {
            if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
        }
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault()
                setOpen(false)
                triggerRef.current?.focus()
            }
        }
        document.addEventListener('mousedown', handleOutside)
        document.addEventListener('keydown', handleEscape)
        return () => {
            document.removeEventListener('mousedown', handleOutside)
            document.removeEventListener('keydown', handleEscape)
        }
    }, [open])

    return (
        <div className="iv-updates" ref={rootRef} onBlur={(event) => {
            if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false)
        }}>
            <button type="button" ref={triggerRef} className="iv-header-frame iv-updates-trigger"
                aria-expanded={open} aria-controls="upcoming-updates" onClick={() => setOpen(!open)}>
                <span className="iv-updates-dot" aria-hidden="true" />
                Скоро
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>
            {open && (
                <section id="upcoming-updates" className="iv-updates-panel" aria-labelledby="upcoming-updates-title">
                    <header className="iv-updates-heading">
                        <div className="flex items-center justify-between gap-3">
                            <span className="iv-updates-eyebrow">В планах INTERVERSE</span>
                            <button type="button" ref={closeRef} className="iv-updates-close" aria-label="Закрыть список обновлений"
                                onClick={() => { setOpen(false); triggerRef.current?.focus() }}>
                                <X className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                        </div>
                        <h2 id="upcoming-updates-title">Что появится дальше</h2>
                        <p>Больше способов практиковаться и готовиться к новой роли.</p>
                    </header>
                    <ul className="iv-updates-list">
                        {updates.map(([title, description], index) => (
                            <li className="iv-updates-item" key={title}>
                                <span className="iv-updates-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                                <div><h3>{title}</h3><p>{description}</p></div>
                            </li>
                        ))}
                    </ul>
                    <footer className="iv-updates-footer">Планируемые обновления. Сроки запуска пока не объявлены.</footer>
                </section>
            )}
        </div>
    )
}
