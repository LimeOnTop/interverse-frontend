import { useEffect, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, Mail, Search, Users, X } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import PageTransition from '../../components/ui/PageTransition'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import { api } from '../../services/api'

interface AdminUser { id: string; name: string; email: string; created_at: string }
type Period = 'total' | 'day' | 'week' | 'month'
const periods: { value: Period; label: string; description: string }[] = [
    { value: 'total', label: 'За всё время', description: 'Все зарегистрированные пользователи' },
    { value: 'day', label: 'За день', description: 'Сегодня с 00:00 по Москве' },
    { value: 'week', label: 'За неделю', description: 'Последние 7 дней, включая сегодня' },
    { value: 'month', label: 'За месяц', description: 'С начала текущего месяца по Москве' },
]
const PAGE_SIZE = 24
const dateFormat = new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium', timeZone: 'Europe/Moscow' })
function initials(name: string, email: string) {
    const words = name.trim().split(/\s+/).filter(Boolean)
    return words.length ? words.slice(0, 2).map(word => Array.from(word)[0]).join('').toUpperCase() : email.slice(0, 2).toUpperCase()
}
function registrationDate(value: string) {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? 'Дата не указана' : dateFormat.format(date)
}

export default function AdminUsersPage() {
    const [period, setPeriod] = useState<Period>('total')
    const [input, setInput] = useState('')
    const [query, setQuery] = useState('')
    const [page, setPage] = useState(1)
    const [users, setUsers] = useState<AdminUser[]>([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [refresh, setRefresh] = useState(0)

    useEffect(() => {
        const timer = window.setTimeout(() => { setQuery(input.trim()); setPage(1) }, 300)
        return () => window.clearTimeout(timer)
    }, [input])

    useEffect(() => {
        const controller = new AbortController()
        setLoading(true)
        setError('')
        api.get('/admin/users', { params: { period, query, page, limit: PAGE_SIZE }, signal: controller.signal })
            .then(({ data }) => {
                if (controller.signal.aborted) return
                const count = Number(data.pagination?.total ?? 0)
                const lastPage = Math.max(1, Math.ceil(count / PAGE_SIZE))
                if (page > lastPage) { setPage(lastPage); return }
                setUsers(data.users ?? [])
                setTotal(count)
            })
            .catch(() => {
                if (!controller.signal.aborted) setError('Не удалось загрузить пользователей. Попробуйте ещё раз.')
            })
            .finally(() => { if (!controller.signal.aborted) setLoading(false) })
        return () => controller.abort()
    }, [period, query, page, refresh])

    const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE))
    const selectedPeriod = periods.find(item => item.value === period)!
    return (
        <PageTransition>
            <PageHeader title="Пользователи" description="Кто присоединился к INTERVERSE — имя, почта и дата регистрации." />
            <section className="admin-users-toolbar" aria-label="Поиск и фильтры пользователей">
                <div className="admin-users-periods" role="group" aria-label="Период регистрации">
                    {periods.map(item => (
                        <button key={item.value} type="button" aria-pressed={period === item.value}
                            className={`admin-users-period ${period === item.value ? 'is-active' : ''}`}
                            onClick={() => { setPeriod(item.value); setPage(1) }}>{item.label}</button>
                    ))}
                </div>
                <div className="admin-users-search">
                    <Search size={18} aria-hidden="true" />
                    <input value={input} onChange={event => setInput(event.target.value)} maxLength={100}
                        aria-label="Поиск по имени или почте" placeholder="Имя или почта пользователя" type="search" />
                    {input && <button type="button" onClick={() => setInput('')} aria-label="Очистить поиск"><X size={16} /></button>}
                </div>
            </section>
            <div className="admin-users-caption">
                <p>{selectedPeriod.description}</p>
                <span aria-live="polite">{loading ? 'Загрузка…' : error ? '' : `Найдено: ${total.toLocaleString('ru-RU')}`}</span>
            </div>
            {error ? (
                <EmptyState icon={Users} title="Не удалось загрузить список" description={error}
                    action={<Button onClick={() => setRefresh(value => value + 1)}>Повторить</Button>} />
            ) : loading ? (
                <div className="admin-users-grid" aria-busy="true" aria-label="Загрузка пользователей">
                    {Array.from({ length: 6 }, (_, i) => <div className="job-card admin-user-card animate-pulse" key={i}>
                        <div className="h-10 w-10 rounded-xl bg-gray-200 dark:bg-gray-700 mb-4" />
                        <div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-gray-700 mb-3" />
                        <div className="h-3 w-5/6 rounded bg-gray-200 dark:bg-gray-700" />
                    </div>)}
                </div>
            ) : users.length === 0 ? (
                <EmptyState icon={Users} title={query ? 'Пользователи не найдены' : 'Пока нет пользователей'}
                    description={query ? 'Попробуйте другую часть имени или почты либо измените период.' : 'За выбранный период никто не зарегистрировался.'} />
            ) : (
                <>
                    <div className="admin-users-grid">
                        {users.map((user, index) => <article key={user.id} className="job-card admin-user-card" style={{ '--i': index } as React.CSSProperties}>
                            <div className="admin-user-heading">
                                <span className="company-mark admin-user-avatar" aria-hidden="true">{initials(user.name, user.email)}</span>
                                <h2 title={user.name}>{user.name || 'Без имени'}</h2>
                            </div>
                            <p className="admin-user-email" title={user.email}><Mail size={15} aria-hidden="true" /><span>{user.email}</span></p>
                            <p className="admin-user-date"><CalendarDays size={14} aria-hidden="true" />{registrationDate(user.created_at)}</p>
                        </article>)}
                    </div>
                    <nav className="admin-users-pagination" aria-label="Страницы пользователей">
                        <span>{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} из {total.toLocaleString('ru-RU')}</span>
                        <div className="flex items-center gap-3">
                            <Button variant="secondary" disabled={page === 1} onClick={() => setPage(value => value - 1)} aria-label="Предыдущая страница"><ChevronLeft size={18} /></Button>
                            <span>{page} / {lastPage}</span>
                            <Button variant="secondary" disabled={page >= lastPage} onClick={() => setPage(value => value + 1)} aria-label="Следующая страница"><ChevronRight size={18} /></Button>
                        </div>
                    </nav>
                </>
            )}
        </PageTransition>
    )
}
