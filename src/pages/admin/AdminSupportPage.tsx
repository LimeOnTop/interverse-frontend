import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { LifeBuoy } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import PageTransition from '../../components/ui/PageTransition'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import TicketList from '../../components/support/TicketList'
import { apiErrorMessage, supportApi, type SupportTicket, type TicketStatus } from '../../lib/support'

const PAGE_SIZE = 30
const client = supportApi('admin')

const FILTERS: { value: TicketStatus | ''; label: string }[] = [
    { value: 'open', label: 'Открытые' },
    { value: 'closed', label: 'Закрытые' },
    { value: '', label: 'Все' },
]

export default function AdminSupportPage() {
    const [status, setStatus] = useState<TicketStatus | ''>('open')
    const [tickets, setTickets] = useState<SupportTicket[]>([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)

    const load = useCallback(
        async (offset: number) => {
            try {
                if (offset === 0) setLoading(true)
                else setLoadingMore(true)
                const page = await client.list({ status, limit: PAGE_SIZE, offset })
                setTotal(page.total)
                setTickets((prev) => (offset === 0 ? page.tickets : [...prev, ...page.tickets]))
            } catch (error) {
                toast.error(apiErrorMessage(error, 'Не удалось загрузить обращения'))
            } finally {
                setLoading(false)
                setLoadingMore(false)
            }
        },
        [status]
    )

    useEffect(() => {
        void load(0)
    }, [load])

    return (
        <PageTransition>
            <PageHeader title="Поддержка" description="Обращения пользователей. Точкой отмечены те, что ждут ответа." />

            <div className="flex flex-wrap gap-2 mb-4">
                {FILTERS.map((filter) => (
                    <button
                        key={filter.label}
                        type="button"
                        onClick={() => setStatus(filter.value)}
                        className={status === filter.value ? 'btn-primary-adaptive text-sm px-4 py-2' : 'btn-secondary text-sm px-4 py-2'}
                    >
                        {filter.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-16">
                    <Spinner />
                </div>
            ) : tickets.length === 0 ? (
                <EmptyState
                    icon={LifeBuoy}
                    title="Обращений нет"
                    description="Новые обращения появятся здесь после отправки со страницы «Поддержка»"
                />
            ) : (
                <>
                    <p className="text-sm text-secondary mb-3">
                        Всего: {total}. Показано {tickets.length}
                    </p>
                    <TicketList tickets={tickets} viewer="admin" hrefFor={(ticket) => `/admin/support/${ticket.id}`} />
                    {tickets.length < total && (
                        <div className="flex justify-center mt-6">
                            <Button type="button" variant="secondary" loading={loadingMore} onClick={() => void load(tickets.length)}>
                                Загрузить ещё
                            </Button>
                        </div>
                    )}
                </>
            )}
        </PageTransition>
    )
}
