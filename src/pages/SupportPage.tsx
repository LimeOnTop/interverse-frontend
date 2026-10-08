import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { LifeBuoy, Send } from 'lucide-react'
import PageTransition from '../components/ui/PageTransition'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import TicketList from '../components/support/TicketList'
import { usePersistedState } from '../hooks/usePersistedForm'
import { apiErrorMessage, createSupportTicket, supportApi, ticketTitle, type SupportTicket } from '../lib/support'

const TICKETS_PAGE = 20
const client = supportApi('user')

export default function SupportPage() {
    const navigate = useNavigate()
    const [draft, setDraft] = usePersistedState('support-ticket', { subject: '', message: '' })
    const [submitting, setSubmitting] = useState(false)
    const [tickets, setTickets] = useState<SupportTicket[]>([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)

    const load = useCallback(async (offset: number) => {
        try {
            if (offset === 0) setLoading(true)
            else setLoadingMore(true)
            const page = await client.list({ limit: TICKETS_PAGE, offset })
            setTotal(page.total)
            setTickets((prev) => (offset === 0 ? page.tickets : [...prev, ...page.tickets]))
        } catch (error) {
            toast.error(apiErrorMessage(error, 'Не удалось загрузить обращения'))
        } finally {
            setLoading(false)
            setLoadingMore(false)
        }
    }, [])

    useEffect(() => {
        void load(0)
    }, [load])

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        const subject = draft.subject.trim()
        const message = draft.message.trim()
        if (!subject) {
            toast.error('Укажите тему обращения')
            return
        }
        if (!message) {
            toast.error('Опишите проблему')
            return
        }
        try {
            setSubmitting(true)
            const ticket = await createSupportTicket(subject, message)
            setDraft({ subject: '', message: '' })
            toast.success(`${ticketTitle(ticket.id)} создано`)
            navigate(`/support/${ticket.id}`)
        } catch (error) {
            toast.error(apiErrorMessage(error, 'Не удалось создать обращение'))
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <PageTransition>
            <PageHeader
                title="Поддержка"
                description="Опишите вопрос или проблему, и мы ответим в этом разделе. История переписки сохраняется."
            />

            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-6 items-start">
                <form onSubmit={handleSubmit} className="iv-panel p-5 sm:p-6 space-y-4">
                    <p className="iv-eyebrow">Новое обращение</p>
                    <div>
                        <label className="block text-xs font-medium uppercase tracking-wide text-secondary mb-2">Тема</label>
                        <input
                            value={draft.subject}
                            onChange={(event) => setDraft((prev) => ({ ...prev, subject: event.target.value }))}
                            maxLength={200}
                            className="input-field w-full"
                            placeholder="Например: не активировалась подписка"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium uppercase tracking-wide text-secondary mb-2">Сообщение</label>
                        <textarea
                            value={draft.message}
                            onChange={(event) => setDraft((prev) => ({ ...prev, message: event.target.value }))}
                            maxLength={5000}
                            className="input-field w-full min-h-[160px] resize-y"
                            placeholder="Что произошло и что вы ожидали увидеть"
                        />
                    </div>
                    <div className="flex justify-end">
                        <Button type="submit" loading={submitting}>
                            <Send className="w-4 h-4" strokeWidth={1.75} />
                            Отправить обращение
                        </Button>
                    </div>
                </form>

                <section>
                    <p className="iv-eyebrow mb-3">Мои обращения{total > 0 ? ` · ${total}` : ''}</p>
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Spinner />
                        </div>
                    ) : tickets.length === 0 ? (
                        <div className="iv-panel p-6 text-center">
                            <LifeBuoy className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-gray-500" strokeWidth={1.5} />
                            <p className="text-sm text-secondary">Обращений пока нет</p>
                        </div>
                    ) : (
                        <>
                            <TicketList tickets={tickets} viewer="user" hrefFor={(ticket) => `/support/${ticket.id}`} />
                            {tickets.length < total && (
                                <div className="flex justify-center mt-4">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        loading={loadingMore}
                                        onClick={() => void load(tickets.length)}
                                    >
                                        Показать ещё
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </section>
            </div>
        </PageTransition>
    )
}
