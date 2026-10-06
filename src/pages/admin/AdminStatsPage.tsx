import { useEffect, useState } from 'react'
import { BarChart3, CalendarDays, CreditCard, HelpCircle, ShieldAlert, UserPlus } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import PageTransition from '../../components/ui/PageTransition'
import StatCard from '../../components/ui/StatCard'
import Spinner from '../../components/ui/Spinner'
import { api } from '../../services/api'

interface DifficultyStat {
    difficulty: string
    total: number
}

interface PeriodCounts {
    today: number
    week: number
    month: number
    total: number
}

interface AdminMetrics {
    registrations: PeriodCounts
    payments: PeriodCounts
}

const periods: { key: keyof PeriodCounts; label: string }[] = [
    { key: 'today', label: 'Сегодня' },
    { key: 'week', label: 'За 7 дней' },
    { key: 'month', label: 'За месяц' },
    { key: 'total', label: 'Всего' },
]

const difficultyLabel: Record<string, string> = {
    junior: 'Junior',
    middle: 'Middle',
    senior: 'Senior',
    pending_moderation: 'На модерации',
}

export default function AdminStatsPage() {
    const [total, setTotal] = useState(0)
    const [byDifficulty, setByDifficulty] = useState<DifficultyStat[]>([])
    const [metrics, setMetrics] = useState<AdminMetrics | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let cancelled = false
        ;(async () => {
            try {
                setLoading(true)
                const [statsResult, metricsResult] = await Promise.allSettled([
                    api.get('/admin/stats'),
                    api.get<AdminMetrics>('/admin/metrics'),
                ])
                if (cancelled) return
                if (statsResult.status === 'fulfilled') {
                    setTotal(statsResult.value.data.total_questions ?? 0)
                    setByDifficulty(statsResult.value.data.by_difficulty ?? [])
                } else {
                    setTotal(0)
                    setByDifficulty([])
                }
                setMetrics(metricsResult.status === 'fulfilled' ? metricsResult.value.data : null)
            } finally {
                if (!cancelled) setLoading(false)
            }
        })()
        return () => {
            cancelled = true
        }
    }, [])

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <Spinner />
            </div>
        )
    }

    return (
        <PageTransition>
            <PageHeader
                title="Статистика"
                description="Регистрации, оплаты, банк вопросов и очередь модерации"
            />

            <section className="mb-8">
                <div className="flex items-baseline justify-between gap-4 mb-3">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Пользователи и оплаты</h2>
                    <p className="text-xs text-secondary">
                        Календарные периоды по Москве: сегодня с 00:00, последние 7 дней, текущий месяц
                    </p>
                </div>
                {metrics ? (
                    <div className="space-y-4">
                        <MetricsRow
                            title="Регистрации"
                            icon={UserPlus}
                            counts={metrics.registrations}
                        />
                        <MetricsRow
                            title="Подтверждённые оплаты"
                            icon={CreditCard}
                            counts={metrics.payments}
                        />
                    </div>
                ) : (
                    <p className="text-sm text-secondary">Не удалось загрузить метрики регистраций и оплат.</p>
                )}
            </section>

            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Банк вопросов</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
                <StatCard label="Всего вопросов" value={total} icon={HelpCircle} />
                <StatCard
                    label="На модерации"
                    value={
                        byDifficulty.find((item) => item.difficulty === 'pending_moderation')
                            ?.total ?? 0
                    }
                    icon={ShieldAlert}
                    delay={0.05}
                />
                <StatCard
                    label="Уровней в статистике"
                    value={byDifficulty.filter((item) => item.difficulty !== 'pending_moderation').length}
                    icon={BarChart3}
                    delay={0.1}
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {byDifficulty.map((item, index) => (
                    <StatCard
                        key={item.difficulty}
                        label={difficultyLabel[item.difficulty] || item.difficulty}
                        value={item.total}
                        icon={HelpCircle}
                        delay={0.05 * (index + 1)}
                    />
                ))}
            </div>
        </PageTransition>
    )
}

function MetricsRow({
    title,
    icon,
    counts,
}: {
    title: string
    icon: typeof UserPlus
    counts: PeriodCounts
}) {
    return (
        <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{title}</p>
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                {periods.map((period, index) => (
                    <StatCard
                        key={period.key}
                        label={period.label}
                        value={counts?.[period.key] ?? 0}
                        icon={period.key === 'total' ? icon : CalendarDays}
                        delay={0.05 * index}
                    />
                ))}
            </div>
        </div>
    )
}
