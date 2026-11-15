import { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import PageTransition from '../../components/ui/PageTransition'
import Spinner from '../../components/ui/Spinner'
import { api } from '../../services/api'

type FeedbackEntry = {
    id: number
    user_id: string
    user_email: string
    message: string
    created_at: string
}

type FeedbackPage = { entries: FeedbackEntry[]; next_before_id: number }

export default function AdminFeedbackPage() {
    const [entries, setEntries] = useState<FeedbackEntry[]>([])
    const [next, setNext] = useState(0)
    const [request, setRequest] = useState({ before: 0 })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    useEffect(() => {
        const controller = new AbortController()
        api.get<FeedbackPage>('/admin/feedback', {
            params: { before_id: request.before },
            signal: controller.signal,
        }).then(({ data }) => {
            if (controller.signal.aborted) return
            setEntries(previous => request.before ? [...previous, ...data.entries] : data.entries)
            setNext(data.next_before_id)
        }).catch(() => {
            if (!controller.signal.aborted) setError(true)
        }).finally(() => {
            if (!controller.signal.aborted) setLoading(false)
        })
        return () => controller.abort()
    }, [request])

    function load(before: number) {
        setLoading(true)
        setError(false)
        setRequest({ before })
    }

    return (
        <PageTransition>
            <PageHeader title="Обратная связь" />
            <div className="grid gap-4">
                {entries.map(entry => (
                    <details className="iv-card p-4 sm:p-5 group" key={entry.id}>
                        <summary className="flex cursor-pointer list-none items-start justify-between gap-4 [&::-webkit-details-marker]:hidden">
                            <span className="min-w-0">
                                <span className="block break-all font-semibold">{entry.user_email || `Пользователь №${entry.user_id}`}</span>
                                <time className="block text-xs text-secondary mt-1" dateTime={entry.created_at}>
                                    {new Date(entry.created_at).toLocaleString('ru-RU')}
                                </time>
                                <span className="mt-2 block truncate text-sm text-secondary group-open:hidden">{entry.message}</span>
                            </span>
                            <ChevronDown size={18} className="mt-1 shrink-0 group-open:rotate-180" aria-hidden="true" />
                        </summary>
                        <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-relaxed">{entry.message}</p>
                    </details>
                ))}
            </div>
            {loading && <div className="flex justify-center py-8"><Spinner /></div>}
            {error && (
                <div className="mt-5">
                    <p role="alert" className="mb-3 text-sm text-secondary">Не удалось загрузить обратную связь.</p>
                    <button type="button" className="btn-secondary px-4 py-2" onClick={() => load(request.before)}>Повторить</button>
                </div>
            )}
            {!loading && !error && (entries.length === 0
                ? <p className="text-secondary">Сообщений пока нет.</p>
                : next > 0 && <button type="button" className="btn-secondary mt-5 px-4 py-2" onClick={() => load(next)}>Показать ещё</button>
            )}
        </PageTransition>
    )
}
