import { useState, useEffect, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Calendar } from 'lucide-react'
import { api } from '../services/api'
import toast from 'react-hot-toast'
import InterviewCard from '../components/InterviewCard'
import ModernFilters from '../components/ModernFilters'
import DailyActivityBlock, { useLocalCalendarDay } from '../components/DailyActivityBlock'
import PageHeader from '../components/ui/PageHeader'
import EmptyState from '../components/ui/EmptyState'
import Spinner from '../components/ui/Spinner'
import PageTransition from '../components/ui/PageTransition'
import Button from '../components/ui/Button'
import { usePersistedState } from '../hooks/usePersistedForm'
import { useAuthStore } from '../store/authStore'
import { PRO_TRAININGS_PER_DAY, resolveSubscriptionPlan } from '../utils/subscription'

interface Interview {
    id: string
    title: string
    description: string
    status: string
    scheduled_at?: string
    duration?: number
    level: string
    specialization: string
    tech_stack?: string
    technologies?: string[]
    created_at: string
    updated_at?: string
}

const HIDDEN_COMPLETED_KEY = 'dashboard-hidden-completed'

function readHiddenCompletedIds(): string[] {
    try {
        const raw = localStorage.getItem(HIDDEN_COMPLETED_KEY)
        if (!raw) return []
        const parsed = JSON.parse(raw)
        return Array.isArray(parsed) ? parsed.map(String) : []
    } catch {
        return []
    }
}

function writeHiddenCompletedIds(ids: string[]) {
    localStorage.setItem(HIDDEN_COMPLETED_KEY, JSON.stringify(ids))
}

export default function DashboardPage() {
    const [interviews, setInterviews] = useState<Interview[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = usePersistedState('dashboard-search', '')
    const [statusFilter, setStatusFilter] = usePersistedState('dashboard-status', '')
    const [levelFilter, setLevelFilter] = usePersistedState('dashboard-level', '')
    const [hiddenCompletedIds, setHiddenCompletedIds] = useState<string[]>(() => readHiddenCompletedIds())
    const location = useLocation()

    useEffect(() => { fetchInterviews() }, [location.pathname])

    const fetchInterviews = async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams()
            if (statusFilter) params.append('status', statusFilter)
            if (levelFilter) params.append('level', levelFilter)
            const response = await api.get(`/interviews/?${params.toString()}`)
            setInterviews(response.data.interviews || [])
        } catch {
            toast.error('Ошибка при загрузке интервью')
        } finally {
            setLoading(false)
        }
    }

    const hideCompletedCard = (id: string) => {
        setHiddenCompletedIds((prev) => {
            if (prev.includes(id)) return prev
            const next = [...prev, id]
            writeHiddenCompletedIds(next)
            return next
        })
    }

    const visibleInterviews = interviews.filter((interview) => {
        if (interview.status === 'completed' && hiddenCompletedIds.includes(interview.id)) {
            return false
        }
        return true
    })

    const filteredInterviews = visibleInterviews.filter(i => {
        const search = searchTerm.toLowerCase()
        const techList = i.technologies?.length
            ? i.technologies
            : parseTechStack(i.tech_stack)

        return i.title.toLowerCase().includes(search) ||
            i.specialization.toLowerCase().includes(search) ||
            techList.some(tech => tech.toLowerCase().includes(search))
    })

    function parseTechStack(techStack?: string): string[] {
        if (!techStack || techStack === 'null') return []
        try {
            const parsed = JSON.parse(techStack)
            return Array.isArray(parsed) ? parsed : parsed ? [parsed] : []
        } catch {
            return [techStack]
        }
    }

    // The counter mirrors the plan quota: Basic has one training in total,
    // Pro a daily limit; both count created trainings, like the backend.
    const isPro = resolveSubscriptionPlan(useAuthStore((state) => state.user)) === 'paid'
    const localDay = useLocalCalendarDay()
    const usedTrainings = useMemo(() => {
        if (!isPro) return interviews.length
        const start = new Date()
        start.setHours(0, 0, 0, 0)
        return interviews.filter((interview) => new Date(interview.created_at) >= start).length
    }, [interviews, isPro, localDay])
    const quota = isPro ? PRO_TRAININGS_PER_DAY : 1
    const quotaCaption = isPro ? (
        `Тренировок сегодня. В Pro доступно до ${PRO_TRAININGS_PER_DAY} в день.`
    ) : (
        <>
            Бесплатная тренировка тарифа Basic.{' '}
            <Link to="/subscription" className="font-medium text-inter-verse-green dark:text-purple-400 underline underline-offset-2">
                Больше тренировок в Pro
            </Link>
        </>
    )

    if (loading) return <Spinner size="lg" className="h-64" />

    return (
        <PageTransition className="space-y-6 sm:space-y-8">
            <PageHeader
                title="Главная"
                description="Ваши тренировки и активность"
                action={
                    <Link to="/interviews/create">
                        <Button><Plus className="w-5 h-5" /> Начать тренировку</Button>
                    </Link>
                }
            />

            <DailyActivityBlock
                completedToday={usedTrainings}
                dailyNorm={quota}
                caption={quotaCaption}
            />

            <ModernFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                statusFilter={statusFilter}
                onStatusChange={setStatusFilter}
                levelFilter={levelFilter}
                onLevelChange={setLevelFilter}
                onApplyFilters={fetchInterviews}
                onClearFilters={() => { setStatusFilter(''); setLevelFilter(''); setSearchTerm('') }}
            />

            <section>
                <h2 className="text-lg font-semibold mb-4 tabular-nums">
                    Интервью <span className="text-secondary font-normal">({filteredInterviews.length})</span>
                </h2>

                {filteredInterviews.length === 0 ? (
                    <EmptyState
                        icon={Calendar}
                        title="Нет интервью"
                        description="Создайте первую тренировку, чтобы начать работу"
                        action={
                            <Link to="/interviews/create">
                                <Button><Plus className="w-5 h-5" /> Начать тренировку</Button>
                            </Link>
                        }
                    />
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                        {filteredInterviews.map((interview, index) => (
                            <motion.div
                                key={interview.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05, duration: 0.4 }}
                            >
                                <InterviewCard
                                    interview={interview}
                                    hideOnly={interview.status === 'completed'}
                                    onDelete={
                                        interview.status === 'completed'
                                            ? hideCompletedCard
                                            : (id) => setInterviews((prev) => prev.filter((item) => item.id !== id))
                                    }
                                />
                            </motion.div>
                        ))}
                    </div>
                )}
            </section>
        </PageTransition>
    )
}
