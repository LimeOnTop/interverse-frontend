import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Calendar, Users, CheckCircle } from 'lucide-react'
import { api } from '../services/api'
import toast from 'react-hot-toast'
import InterviewCard from '../components/InterviewCard'
import ModernFilters from '../components/ModernFilters'
import PageHeader from '../components/ui/PageHeader'
import StatCard from '../components/ui/StatCard'
import EmptyState from '../components/ui/EmptyState'
import Spinner from '../components/ui/Spinner'
import PageTransition from '../components/ui/PageTransition'
import Button from '../components/ui/Button'

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
}

export default function DashboardPage() {
    const [interviews, setInterviews] = useState<Interview[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [levelFilter, setLevelFilter] = useState('')
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

    const filteredInterviews = interviews.filter(i => {
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

    const stats = {
        total: interviews.length,
        scheduled: interviews.filter(i => i.status === 'scheduled').length,
        completed: interviews.filter(i => i.status === 'completed').length,
        inProgress: interviews.filter(i => i.status === 'in_progress').length,
    }

    if (loading) return <Spinner size="lg" className="h-64" />

    return (
        <PageTransition className="space-y-8">
            <PageHeader
                title="Dashboard"
                description="Обзор интервью и ключевые метрики"
                action={
                    <Link to="/interviews/create">
                        <Button><Plus className="w-5 h-5" /> Начать тренировку</Button>
                    </Link>
                }
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard label="Всего" value={stats.total} icon={Calendar} delay={0} />
                <StatCard label="Запланировано" value={stats.scheduled} icon={Calendar} delay={0.05} />
                <StatCard label="В процессе" value={stats.inProgress} icon={Users} delay={0.1} />
                <StatCard label="Завершено" value={stats.completed} icon={CheckCircle} delay={0.15} />
            </div>

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
                                    onDelete={() => setInterviews((prev) => prev.filter((item) => item.id !== interview.id))}
                                />
                            </motion.div>
                        ))}
                    </div>
                )}
            </section>
        </PageTransition>
    )
}
