import { useEffect, useState } from 'react'
import { api } from '../../services/api'
import PageHeader from '../../components/ui/PageHeader'
import PageTransition from '../../components/ui/PageTransition'
import Button from '../../components/ui/Button'

type Operation = {
    id: number
    user_id: number
    plan: string
    amount: string
    currency: string
    status: string
    created_at: string
    paid_at: string
}
type OperationPage = { operations: Operation[]; next_before_id: number }
const statuses: Record<string, string> = { paid: 'Оплачено', pending: 'Ожидает оплаты', cancelled: 'Отменено' }
const plans: Record<string, string> = {
    paid: 'Pro', trial_3d: 'Пробный Pro', paid_1m: 'Pro · 1 месяц',
    paid_3m: 'Pro · 3 месяца', paid_6m: 'Pro · 6 месяцев', paid_1y: 'Pro · 1 год',
}
const dateFormat = new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Moscow' })

export default function AdminOperationsPage() {
    const [cursor, setCursor] = useState(0)
    const [history, setHistory] = useState<number[]>([])
    const [data, setData] = useState<OperationPage>({ operations: [], next_before_id: 0 })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)
    const [refresh, setRefresh] = useState(0)
    useEffect(() => {
        const controller = new AbortController()
        setLoading(true)
        setError(false)
        api.get<OperationPage>('/admin/operations', { params: { before_id: cursor }, signal: controller.signal })
            .then(({ data }) => { if (!controller.signal.aborted) setData(data) })
            .catch(() => { if (!controller.signal.aborted) setError(true) })
            .finally(() => { if (!controller.signal.aborted) setLoading(false) })
        return () => controller.abort()
    }, [cursor, refresh])
    return <PageTransition>
        <PageHeader title="Журнал операций" />
        <div className="flex justify-end mb-4">
            <Button variant="secondary" disabled={loading} onClick={() => setRefresh(value => value + 1)}>Обновить</Button>
        </div>
        {loading ? <p role="status">Загрузка…</p> : error ? <p role="alert">Не удалось загрузить операции. Попробуйте обновить список.</p> : data.operations.length === 0 ? <p>Операций пока нет.</p> : <>
            <div className="grid gap-4">
                {data.operations.map(operation => <article className="iv-panel p-5" key={operation.id}>
                    <div className="flex flex-wrap justify-between gap-3">
                        <h2 className="font-semibold">Операция №{operation.id} · Пользователь №{operation.user_id}</h2>
                        <span>{statuses[operation.status] || operation.status}</span>
                    </div>
                    <p className="mt-2">{plans[operation.plan] || operation.plan} · {operation.amount} {operation.currency}</p>
                    <p className="mt-2 text-sm text-secondary">Создана {dateFormat.format(new Date(operation.created_at))} МСК</p>
                    {operation.paid_at && <p className="mt-1 text-sm text-secondary">Оплачена {dateFormat.format(new Date(operation.paid_at))} МСК</p>}
                </article>)}
            </div>
            <nav aria-label="Страницы журнала" className="flex justify-between gap-3 mt-5">
                <Button variant="secondary" disabled={history.length === 0} onClick={() => {
                    setCursor(history[history.length - 1])
                    setHistory(history.slice(0, -1))
                }}>Назад</Button>
                <Button variant="secondary" disabled={!data.next_before_id} onClick={() => {
                    setHistory([...history, cursor])
                    setCursor(data.next_before_id)
                }}>Далее</Button>
            </nav>
        </>}
    </PageTransition>
}
