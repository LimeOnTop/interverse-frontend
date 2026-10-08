import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { Lock, Send } from 'lucide-react'
import PageHeader from '../ui/PageHeader'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import Spinner from '../ui/Spinner'
import {
    apiErrorMessage,
    formatDateTime,
    supportApi,
    ticketStatusLabel,
    ticketTitle,
    type SupportMessage,
    type SupportRole,
    type SupportTicket,
} from '../../lib/support'

const POLL_INTERVAL_MS = 15_000
const LOAD_OLDER_THRESHOLD_PX = 80

type PendingScroll = { kind: 'bottom' } | { kind: 'preserve'; height: number; top: number } | null

function mergeMessages(current: SupportMessage[], incoming: SupportMessage[]) {
    const byId = new Map<number, SupportMessage>()
    for (const message of current) byId.set(message.id, message)
    for (const message of incoming) byId.set(message.id, message)
    return [...byId.values()].sort((a, b) => a.id - b.id)
}

interface SupportChatProps {
    ticketId: string
    viewer: SupportRole
    backHref: string
    backLabel: string
}

export default function SupportChat({ ticketId, viewer, backHref, backLabel }: SupportChatProps) {
    const client = useRef(supportApi(viewer)).current
    const [ticket, setTicket] = useState<SupportTicket | null>(null)
    const [messages, setMessages] = useState<SupportMessage[]>([])
    const [hasMore, setHasMore] = useState(false)
    const [loading, setLoading] = useState(true)
    const [notFound, setNotFound] = useState(false)
    const [loadingOlder, setLoadingOlder] = useState(false)
    const [draft, setDraft] = useState('')
    const [sending, setSending] = useState(false)
    const [closing, setClosing] = useState(false)

    const listRef = useRef<HTMLDivElement>(null)
    const pendingScroll = useRef<PendingScroll>(null)
    // Offset for the next older page = how many of the newest messages we already hold.
    const loadedCount = useRef(0)
    loadedCount.current = messages.length

    useEffect(() => {
        let cancelled = false
        setLoading(true)
        setNotFound(false)
        Promise.all([client.get(ticketId), client.messages(ticketId, 0)])
            .then(([loadedTicket, page]) => {
                if (cancelled) return
                setTicket(loadedTicket)
                pendingScroll.current = { kind: 'bottom' }
                setMessages(page.messages)
                setHasMore(page.has_more)
            })
            .catch((error) => {
                if (cancelled) return
                if (error?.response?.status === 404) setNotFound(true)
                else toast.error(apiErrorMessage(error, 'Не удалось загрузить обращение'))
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })
        return () => {
            cancelled = true
        }
    }, [client, ticketId])

    // Runs before paint so prepending older messages doesn't make the list jump.
    useLayoutEffect(() => {
        const list = listRef.current
        const pending = pendingScroll.current
        if (!list || !pending) return
        if (pending.kind === 'bottom') {
            list.scrollTop = list.scrollHeight
        } else {
            list.scrollTop = list.scrollHeight - pending.height + pending.top
        }
        pendingScroll.current = null
    }, [messages])

    const loadOlder = useCallback(async () => {
        const list = listRef.current
        if (!list || !hasMore || loadingOlder) return
        setLoadingOlder(true)
        try {
            const page = await client.messages(ticketId, loadedCount.current)
            pendingScroll.current = { kind: 'preserve', height: list.scrollHeight, top: list.scrollTop }
            setMessages((prev) => mergeMessages(prev, page.messages))
            setHasMore(page.has_more)
        } catch (error) {
            toast.error(apiErrorMessage(error, 'Не удалось загрузить сообщения'))
        } finally {
            setLoadingOlder(false)
        }
    }, [client, ticketId, hasMore, loadingOlder])

    // A short first page leaves nothing to scroll, so keep loading until the list overflows.
    useEffect(() => {
        const list = listRef.current
        if (list && hasMore && !loadingOlder && list.scrollHeight <= list.clientHeight) {
            void loadOlder()
        }
    }, [messages, hasMore, loadingOlder, loadOlder])

    const handleScroll = () => {
        const list = listRef.current
        if (list && list.scrollTop < LOAD_OLDER_THRESHOLD_PX) void loadOlder()
    }

    // Pick up the other side's replies and status changes while the ticket is open.
    const ticketStatus = ticket?.status
    useEffect(() => {
        if (ticketStatus !== 'open') return
        const timer = window.setInterval(async () => {
            if (document.visibilityState !== 'visible') return
            try {
                const [freshTicket, page] = await Promise.all([client.get(ticketId), client.messages(ticketId, 0)])
                const list = listRef.current
                const nearBottom = list ? list.scrollHeight - list.scrollTop - list.clientHeight < 120 : false
                setTicket(freshTicket)
                setMessages((prev) => {
                    const lastId = prev[prev.length - 1]?.id ?? 0
                    if (!page.messages.some((message) => message.id > lastId)) return prev
                    if (nearBottom) pendingScroll.current = { kind: 'bottom' }
                    return mergeMessages(prev, page.messages)
                })
            } catch {
                // next tick retries
            }
        }, POLL_INTERVAL_MS)
        return () => window.clearInterval(timer)
    }, [client, ticketId, ticketStatus])

    const handleSend = async () => {
        const body = draft.trim()
        if (!body || sending) return
        setSending(true)
        try {
            const result = await client.send(ticketId, body)
            pendingScroll.current = { kind: 'bottom' }
            setMessages((prev) => mergeMessages(prev, [result.message]))
            setTicket(result.ticket)
            setDraft('')
        } catch (error) {
            toast.error(apiErrorMessage(error, 'Не удалось отправить сообщение'))
            if ((error as { response?: { status?: number } })?.response?.status === 409) {
                client.get(ticketId).then(setTicket).catch(() => undefined)
            }
        } finally {
            setSending(false)
        }
    }

    const handleClose = async () => {
        if (!ticket || closing) return
        if (!window.confirm(`Закрыть ${ticketTitle(ticket.id).toLowerCase()}? Писать в него больше будет нельзя.`)) return
        setClosing(true)
        try {
            setTicket(await client.close(ticketId))
            toast.success('Обращение закрыто')
        } catch (error) {
            toast.error(apiErrorMessage(error, 'Не удалось закрыть обращение'))
        } finally {
            setClosing(false)
        }
    }

    const breadcrumbs = [{ label: backLabel, href: backHref }, { label: ticketTitle(ticketId) }]

    if (loading) {
        return (
            <div className="flex justify-center py-16">
                <Spinner />
            </div>
        )
    }

    if (notFound || !ticket) {
        return (
            <PageHeader
                title={ticketTitle(ticketId)}
                description="Обращение не найдено"
                breadcrumbs={breadcrumbs}
            />
        )
    }

    const isOpen = ticket.status === 'open'
    const authorLabel = (message: SupportMessage) => {
        if (message.author_role === viewer) return 'Вы'
        if (message.author_role === 'admin') return 'Поддержка InterVerse'
        return ticket.user_email || 'Пользователь'
    }

    return (
        <div className="flex flex-col">
            <PageHeader
                title={ticketTitle(ticket.id)}
                description={ticket.subject}
                breadcrumbs={breadcrumbs}
                action={
                    isOpen ? (
                        <Button type="button" variant="secondary" loading={closing} onClick={() => void handleClose()}>
                            <Lock className="w-4 h-4" strokeWidth={1.75} />
                            Закрыть обращение
                        </Button>
                    ) : undefined
                }
            />

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-3 text-xs text-secondary">
                <Badge variant={isOpen ? 'success' : 'default'}>{ticketStatusLabel(ticket, viewer)}</Badge>
                {viewer === 'admin' && ticket.user_email && (
                    <span>
                        {ticket.user_email} · id {ticket.user_id}
                    </span>
                )}
                {ticket.created_at && <span>Создано {formatDateTime(ticket.created_at)}</span>}
                {!isOpen && ticket.closed_at && <span>Закрыто {formatDateTime(ticket.closed_at)}</span>}
            </div>

            <section className="iv-panel flex flex-col h-[calc(100dvh-20rem)] min-h-[360px]">
                <div
                    ref={listRef}
                    onScroll={handleScroll}
                    className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-4 py-4 sm:px-6 space-y-3"
                >
                    {loadingOlder && (
                        <div className="flex justify-center py-2">
                            <Spinner />
                        </div>
                    )}
                    {!hasMore && messages.length > 0 && (
                        <p className="text-center text-xs text-secondary py-1">Начало переписки</p>
                    )}
                    {messages.map((message) => {
                        const own = message.author_role === viewer
                        return (
                            <div key={message.id} className={`flex ${own ? 'justify-end' : 'justify-start'}`}>
                                <div
                                    className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 ${
                                        own
                                            ? 'bg-inter-verse-green text-white dark:bg-purple-600'
                                            : 'bg-gray-100 text-gray-900 dark:bg-iv-dark-bg dark:text-gray-100'
                                    }`}
                                >
                                    <p className={`text-[11px] font-semibold mb-0.5 ${own ? 'text-white/80' : 'text-secondary'}`}>
                                        {authorLabel(message)}
                                    </p>
                                    <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{message.body}</p>
                                    <p className={`text-[10px] mt-1 text-right ${own ? 'text-white/70' : 'text-secondary'}`}>
                                        {formatDateTime(message.created_at)}
                                    </p>
                                </div>
                            </div>
                        )
                    })}
                </div>

                <div className="border-t border-gray-200 dark:border-iv-dark-line p-3 sm:p-4">
                    {isOpen ? (
                        <form
                            className="flex items-end gap-3"
                            onSubmit={(event) => {
                                event.preventDefault()
                                void handleSend()
                            }}
                        >
                            <textarea
                                value={draft}
                                onChange={(event) => setDraft(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                                        event.preventDefault()
                                        void handleSend()
                                    }
                                }}
                                rows={2}
                                maxLength={5000}
                                placeholder="Напишите сообщение… Enter отправит, Shift+Enter перенесёт строку"
                                className="input-field flex-1 resize-none min-h-[44px] max-h-40"
                            />
                            <Button type="submit" loading={sending} disabled={!draft.trim()} aria-label="Отправить">
                                <Send className="w-4 h-4" strokeWidth={1.75} />
                                <span className="hidden sm:inline">Отправить</span>
                            </Button>
                        </form>
                    ) : (
                        <p className="text-sm text-secondary text-center py-1">
                            {ticket.closed_by === 'admin' ? 'Поддержка закрыла обращение.' : 'Обращение закрыто.'}
                            {viewer === 'user' && ' Если вопрос остался, создайте новое обращение.'}
                        </p>
                    )}
                </div>
            </section>
        </div>
    )
}
