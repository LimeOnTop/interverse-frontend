import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Calendar, Users, CheckCircle } from 'lucide-react'
import { api } from '../services/api'
import toast from 'react-hot-toast'
import InterviewCard from '../components/InterviewCard'
import ModernFilters from '../components/ModernFilters'
import { useTheme } from '../contexts/ThemeContext'

interface Interview {
    id: string
    title: string
    description: string
    status: string
    scheduled_at?: string
    duration: number
    level: string
    specialization: string
    tech_stack: string
    candidate: {
        name: string
        email: string
    }
    created_at: string
}

export default function DashboardPage() {
    const [interviews, setInterviews] = useState<Interview[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [levelFilter, setLevelFilter] = useState('')
    const { isDark } = useTheme()

    useEffect(() => {
        fetchInterviews()
    }, [])

    const fetchInterviews = async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams()
            if (statusFilter) params.append('status', statusFilter)
            if (levelFilter) params.append('level', levelFilter)

            const response = await api.get(`/interviews/?${params.toString()}`)
            setInterviews(response.data.interviews || [])
        } catch (error: any) {
            toast.error('Ошибка при загрузке интервью')
        } finally {
            setLoading(false)
        }
    }

    const handleClearFilters = () => {
        setStatusFilter('')
        setLevelFilter('')
        setSearchTerm('')
    }

    const filteredInterviews = interviews.filter(interview =>
        interview.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        interview.candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        interview.specialization.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const stats = {
        total: interviews.length,
        scheduled: interviews.filter(i => i.status === 'scheduled').length,
        completed: interviews.filter(i => i.status === 'completed').length,
        inProgress: interviews.filter(i => i.status === 'in_progress').length,
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${isDark ? 'border-purple-500' : 'border-inter-verse-green'}`}></div>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Управление интервью и кандидатами</p>
                </div>
                <div className="flex items-center space-x-4">
                    <Link
                        to="/interviews/create"
                        className="btn-primary-adaptive inline-flex items-center space-x-2"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Создать интервью</span>
                    </Link>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card p-6"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Всего интервью</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="card p-6"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Запланировано</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.scheduled}</p>
                        </div>
                        <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-xl flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="card p-6"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">В процессе</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.inProgress}</p>
                        </div>
                        <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-xl flex items-center justify-center">
                            <Users className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="card p-6"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Завершено</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.completed}</p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Modern Filters */}
            <ModernFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                statusFilter={statusFilter}
                onStatusChange={setStatusFilter}
                levelFilter={levelFilter}
                onLevelChange={setLevelFilter}
                onApplyFilters={fetchInterviews}
                onClearFilters={handleClearFilters}
            />

            {/* Interviews List */}
            <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
                    Интервью ({filteredInterviews.length})
                </h2>

                {filteredInterviews.length === 0 ? (
                    <div className="card p-12 text-center">
                        <Calendar className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                            Нет интервью
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Создайте ваше первое интервью, чтобы начать работу
                        </p>
                        <Link
                            to="/interviews/create"
                            className="btn-primary-adaptive inline-flex items-center space-x-2"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Создать интервью</span>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredInterviews.map((interview, index) => (
                            <motion.div
                                key={interview.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="group"
                            >
                                <InterviewCard
                                    interview={interview}
                                    onClick={() => {
                                        // Navigate to interview details or start interview
                                        console.log('Open interview:', interview.id)
                                    }}
                                />
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
