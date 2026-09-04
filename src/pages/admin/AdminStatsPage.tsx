import { useEffect, useState } from 'react'
import { BarChart3, HelpCircle, ShieldAlert } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import PageTransition from '../../components/ui/PageTransition'
import StatCard from '../../components/ui/StatCard'
import Spinner from '../../components/ui/Spinner'
import { api } from '../../services/api'

interface DifficultyStat {
    difficulty: string
    total: number
}

const difficultyLabel: Record<string, string> = {
    junior: 'Junior',
    middle: 'Middle',
    senior: 'Senior',
    pending_moderation: 'На модерации',
}

export default function AdminStatsPage() {
    const [total, setTotal] = useState(0)
    const [byDifficulty, setByDifficulty] = useState<DifficultyStat[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let cancelled = false
        ;(async () => {
            try {
                setLoading(true)
                const { data } = await api.get('/admin/stats')
                if (cancelled) return
                setTotal(data.total_questions ?? 0)
                setByDifficulty(data.by_difficulty ?? [])
            } catch {
                if (!cancelled) {
                    setTotal(0)
                    setByDifficulty([])
                }
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
                description="Обзор банка вопросов и очереди модерации"
            />

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
