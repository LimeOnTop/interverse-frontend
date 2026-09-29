import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    Search,
    Filter,
    Calendar,
    Clock,
    User,
    MoreVertical,
    Edit,
    Trash2,
    Play,
    Eye,
    Plus,
    X,
} from 'lucide-react'
import { api } from '../services/api'
import toast from 'react-hot-toast'
import PageHeader from '../components/ui/PageHeader'
import PageTransition from '../components/ui/PageTransition'
import Card from '../components/ui/Card'
import StatCard from '../components/ui/StatCard'
import EmptyState from '../components/ui/EmptyState'
import Spinner from '../components/ui/Spinner'
import Badge, { statusBadgeVariant } from '../components/ui/Badge'
import Button from '../components/ui/Button'
import ModernSelect from '../components/ModernSelect'
import { usePersistedState } from '../hooks/usePersistedForm'

interface Interview {
    id: string
    title: string
    description: string
    status: string
    scheduled_at?: string
    duration: number
    level: string
    specialization: string
    created_at: string
}

const statusLabels: Record<string, string> = {
    draft: 'Черновик',
    scheduled: 'Запланировано',
    in_progress: 'В процессе',
    completed: 'Завершено',
    cancelled: 'Отменено',
}

const levelOptions = [
    { value: '', label: 'Все уровни' },
    { value: 'intern', label: 'Intern' },
    { value: 'junior', label: 'Junior' },
    { value: 'middle', label: 'Middle' },
    { value: 'senior', label: 'Senior' },
    { value: 'lead', label: 'Lead' },
]

const statusOptions = [
    { value: '', label: 'Все статусы' },
    { value: 'draft', label: 'Черновик' },
    { value: 'scheduled', label: 'Запланировано' },
    { value: 'in_progress', label: 'В процессе' },
    { value: 'completed', label: 'Завершено' },
    { value: 'cancelled', label: 'Отменено' },
]

const specializationOptions = [
    { value: '', label: 'Все специализации' },
    { value: 'frontend', label: 'Frontend' },
    { value: 'backend', label: 'Backend' },
    { value: 'devops', label: 'DevOps' },
    { value: 'qa', label: 'QA' },
    { value: 'data_science', label: 'Data Science' },
]

const specializationLabels: Record<string, string> = {
    frontend: 'Frontend',
    backend: 'Backend',
    devops: 'DevOps',
    qa: 'QA',
    data_science: 'Data Science',
}

const levelLabels: Record<string, string> = {
    intern: 'Intern',
    junior: 'Junior',
    middle: 'Middle',
    senior: 'Senior',
    lead: 'Lead',
}

export default function InterviewsPage() {
    const [interviews, setInterviews] = useState<Interview[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = usePersistedState('interviews-search', '')
    const [statusFilter, setStatusFilter] = usePersistedState('interviews-status', '')
    const [levelFilter, setLevelFilter] = usePersistedState('interviews-level', '')
    const [specializationFilter, setSpecializationFilter] = usePersistedState('interviews-specialization', '')

    useEffect(() => {
        fetchInterviews()
    }, [])

    const fetchInterviews = async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams()
            if (statusFilter) params.append('status', statusFilter)
            if (levelFilter) params.append('level', levelFilter)
            if (specializationFilter) params.append('specialization', specializationFilter)

            const response = await api.get(`/interviews/?${params.toString()}`)
            setInterviews(response.data.interviews || [])
        } catch (error: any) {
            toast.error('Ошибка при загрузке интервью')
        } finally {
            setLoading(false)
        }
    }

    const filteredInterviews = interviews.filter(interview => {
        return interview.title.toLowerCase().includes(searchTerm.toLowerCase())
    })

    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        } catch {
            return dateString
        }
    }

    const getStatusCounts = () => ({
        total: interviews.length,
        scheduled: interviews.filter(i => i.status === 'scheduled').length,
        completed: interviews.filter(i => i.status === 'completed').length,
        in_progress: interviews.filter(i => i.status === 'in_progress').length,
        cancelled: interviews.filter(i => i.status === 'cancelled').length,
    })

    const handleDelete = async (id: string) => {
        if (window.confirm('Вы уверены, что хотите удалить это интервью?')) {
            try {
                await api.delete(`/interviews/${id}`)
                toast.success('Интервью удалено')
                fetchInterviews()
            } catch (error: any) {
                toast.error('Ошибка при удалении интервью')
            }
        }
    }

    const handleStartInterview = (interview: Interview) => {
        if (interview.status === 'scheduled') {
            window.location.href = `/interview-service`
        } else {
            toast.error('Можно проводить только запланированные интервью')
        }
    }

    const handleClearFilters = () => {
        setStatusFilter('')
        setLevelFilter('')
        setSpecializationFilter('')
        setSearchTerm('')
    }

    const hasActiveFilters = statusFilter || levelFilter || specializationFilter
    const statusCounts = getStatusCounts()

    if (loading) return <Spinner size="lg" className="h-96" />

    return (
        <PageTransition className="space-y-8">
            <PageHeader
                title="Интервью"
                description="Управление всеми интервью"
                action={
                    <Link to="/interviews/create">
                        <Button><Plus className="w-5 h-5" /> Создать интервью</Button>
                    </Link>
                }
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
                <StatCard label="Всего" value={statusCounts.total} icon={Calendar} delay={0} />
                <StatCard label="Запланировано" value={statusCounts.scheduled} icon={Calendar} delay={0.05} />
                <StatCard label="В процессе" value={statusCounts.in_progress} icon={User} delay={0.1} />
                <StatCard label="Завершено" value={statusCounts.completed} icon={Calendar} delay={0.15} />
                <StatCard label="Отменено" value={statusCounts.cancelled} icon={Calendar} delay={0.2} />
            </div>

            <Card padding="md">
                <div className="flex flex-col lg:flex-row gap-3">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" strokeWidth={1.75} />
                        <input
                            type="text"
                            placeholder="Поиск по названию тренировки..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input-field pl-10"
                        />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <ModernSelect options={statusOptions} value={statusFilter} onChange={setStatusFilter} placeholder="Статус" className="min-w-[140px]" />
                        <ModernSelect options={levelOptions} value={levelFilter} onChange={setLevelFilter} placeholder="Уровень" className="min-w-[140px]" />
                        <ModernSelect options={specializationOptions} value={specializationFilter} onChange={setSpecializationFilter} placeholder="Специализация" className="min-w-[160px]" />
                        <Button variant="secondary" onClick={fetchInterviews} className="px-4 py-3">
                            <Filter className="w-4 h-4" /> Применить
                        </Button>
                        {hasActiveFilters && (
                            <button onClick={handleClearFilters} className="btn-ghost px-3">
                                <X className="w-4 h-4" /> Сброс
                            </button>
                        )}
                    </div>
                </div>
            </Card>

            <section>
                <h2 className="text-lg font-semibold mb-4 tabular-nums">
                    Интервью <span className="text-secondary font-normal">({filteredInterviews.length})</span>
                </h2>

                {filteredInterviews.length === 0 ? (
                    <EmptyState
                        icon={User}
                        title={searchTerm || hasActiveFilters ? 'Интервью не найдены' : 'Нет интервью'}
                        description={
                            searchTerm || hasActiveFilters
                                ? 'Попробуйте изменить фильтры или поисковый запрос'
                                : 'Создайте первое интервью, чтобы начать работу'
                        }
                        action={
                            !searchTerm && !hasActiveFilters ? (
                                <Link to="/interviews/create">
                                    <Button>Создать интервью</Button>
                                </Link>
                            ) : undefined
                        }
                    />
                ) : (
                    <div className="grid gap-4">
                        {filteredInterviews.map((interview, index) => (
                            <motion.div
                                key={interview.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05, duration: 0.4 }}
                            >
                                <Card hover padding="md">
                                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex flex-wrap items-center gap-3 mb-3">
                                                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                                    {interview.title}
                                                </h3>
                                                <Badge variant={statusBadgeVariant(interview.status)}>
                                                    {statusLabels[interview.status] || interview.status}
                                                </Badge>
                                            </div>

                                            <p className="text-secondary text-sm mb-4">{interview.description}</p>

                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm text-secondary">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4 shrink-0" />
                                                    {interview.duration} мин
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {specializationLabels[interview.specialization] || interview.specialization}
                                                    <span>•</span>
                                                    {levelLabels[interview.level] || interview.level}
                                                </div>
                                                {interview.scheduled_at && (
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4 shrink-0" />
                                                        {formatDate(interview.scheduled_at)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            {interview.status === 'scheduled' && (
                                                <Button onClick={() => handleStartInterview(interview)} className="text-sm px-4 py-2">
                                                    <Play className="w-4 h-4" /> Провести
                                                </Button>
                                            )}

                                            <div className="relative group">
                                                <button className="btn-icon">
                                                    <MoreVertical className="w-5 h-5" />
                                                </button>
                                                <div className="absolute right-0 top-full mt-2 w-48 iv-surface border border-gray-200 dark:border-gray-600 shadow-iv-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                                                    <div className="py-1">
                                                        <Link to={`/interviews/${interview.id}`} className="iv-nav-item">
                                                            <Eye className="w-4 h-4" /> Просмотр
                                                        </Link>
                                                        <Link to={`/interviews/${interview.id}/edit`} className="iv-nav-item">
                                                            <Edit className="w-4 h-4" /> Редактировать
                                                        </Link>
                                                        <button onClick={() => handleDelete(interview.id)} className="iv-nav-item w-full text-red-600 dark:text-red-400">
                                                            <Trash2 className="w-4 h-4" /> Удалить
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}
            </section>
        </PageTransition>
    )
}
