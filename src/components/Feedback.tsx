import { useRef, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { MessageSquare, X } from 'lucide-react'
import { useModalDialog } from '../hooks/useModalDialog'
import { api } from '../services/api'

function FeedbackDialog({ onClose }: { onClose: () => void }) {
    const dialog = useModalDialog()
    const pending = useRef(false)
    const [message, setMessage] = useState('')
    const [sending, setSending] = useState(false)
    const [sent, setSent] = useState(false)
    const [error, setError] = useState(false)

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        const text = message.trim()
        if (!text || pending.current) return
        pending.current = true
        setSending(true)
        setError(false)
        try {
            await api.post('/feedback', { message: text })
            setSent(true)
        } catch {
            setError(true)
        } finally {
            pending.current = false
            setSending(false)
        }
    }

    return createPortal(
        <dialog
            ref={dialog}
            className="iv-feedback-dialog"
            id="dashboard-feedback"
            aria-labelledby="feedback-title"
            onCancel={event => {
                event.preventDefault()
                onClose()
            }}
            onClick={event => {
                if (event.target === event.currentTarget) onClose()
            }}
        >
            <div className="iv-feedback-box">
                <header className="flex items-center justify-between gap-3">
                    <h2 id="feedback-title" className="text-xl font-semibold">Обратная связь</h2>
                    <button data-iv-close type="button" className="iv-updates-close" aria-label="Закрыть обратную связь" onClick={onClose}>
                        <X size={18} aria-hidden="true" />
                    </button>
                </header>
                {sent ? (
                    <p role="status" tabIndex={-1} ref={element => element?.focus({ preventScroll: true })} className="mt-4 leading-relaxed">
                        Спасибо за обратную связь! Мы постоянно расширяемся и стараемся прислушиваться к пользователям при внедрении нового функционала.
                    </p>
                ) : (
                    <form onSubmit={submit} className="mt-4 grid gap-3">
                        <label htmlFor="feedback-message" className="text-sm font-medium">Ваше сообщение</label>
                        <textarea
                            id="feedback-message"
                            className="input-field iv-feedback-input"
                            placeholder="Что можно улучшить?"
                            rows={5}
                            maxLength={3000}
                            value={message}
                            onChange={event => setMessage(event.target.value)}
                            required
                            autoFocus
                        />
                        {error && <p role="alert" className="text-sm text-secondary">Не удалось отправить сообщение. Попробуйте ещё раз.</p>}
                        <button type="submit" className="iv-btn-primary iv-feedback-submit px-5 py-3 rounded-xl" disabled={sending || !message.trim()}>
                            {sending ? 'Отправляем…' : 'Отправить'}
                        </button>
                    </form>
                )}
            </div>
        </dialog>,
        document.body,
    )
}

export default function Feedback() {
    const [open, setOpen] = useState(false)
    return (
        <>
            <button
                type="button"
                className="iv-header-frame iv-updates-trigger"
                aria-label="Обратная связь"
                title="Обратная связь"
                aria-haspopup="dialog"
                aria-expanded={open}
                aria-controls={open ? 'dashboard-feedback' : undefined}
                onClick={event => {
                    event.currentTarget.focus()
                    setOpen(true)
                }}
            >
                <MessageSquare size={16} aria-hidden="true" />
                <span className="iv-feedback-label">Обратная связь</span>
            </button>
            {open && <FeedbackDialog onClose={() => setOpen(false)} />}
        </>
    )
}
