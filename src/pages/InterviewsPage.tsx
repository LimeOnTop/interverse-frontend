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
    Plus
} from 'lucide-react'
import { api } from '../services/api'
import toast from 'react-hot-toast'

interface Interview {
    id: string
    title: string
    description: string
    status: string
    scheduled_at?: string
    duration: number
    level: string
    specialization: string
    candidate: {
        name: string
        email: string
    }
    created_at: string
}

const statusLabels = {
    draft: 'Черновик',
    scheduled: 'Запланировано',
    in_progress: 'В процессе',
    completed: 'Завершено',
    cancelled: 'Отменено'
}

const statusColors = {
    draft: 'bg-gray-100 text-gray-800',
    scheduled: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
}

const levelLabels = {
    intern: 'Intern',
    junior: 'Junior',
    middle: 'Middle',
    senior: 'Senior',
    lead: 'Lead'
}

const specializationLabels = {
    frontend: 'Frontend',
    backend: 'Backend',
    devops: 'DevOps',
    qa: 'QA',
    data_science: 'Data Science'
}

export default function InterviewsPage() {
    const [interviews, setInterviews] = useState<Interview[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [levelFilter, setLevelFilter] = useState('')
    const [specializationFilter, setSpecializationFilter] = useState('')
    const [showFilters, setShowFilters] = useState(false)

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
        const matchesSearch = interview.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            interview.candidate.name.toLowerCase().includes(searchTerm.toLowerCase())
        return matchesSearch
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

    const getStatusCounts = () => {
        const counts = {
            total: interviews.length,
            scheduled: interviews.filter(i => i.status === 'scheduled').length,
            completed: interviews.filter(i => i.status === 'completed').length,
            in_progress: interviews.filter(i => i.status === 'in_progress').length,
            cancelled: interviews.filter(i => i.status === 'cancelled').length
        }
        return counts
    }

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
            // Перенаправляем на страницу проведения интервью
            window.location.href = `/interview-service`
        } else {
            toast.error('Можно проводить только запланированные интервью')
        }
    }

    const statusCounts = getStatusCounts()

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-inter-verse-green"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Интервью</h1>
                    <p className="text-gray-600 mt-2">Управление всеми интервью</p>
                </div>
                <Link
                    to="/interviews/create"
                    className="btn-primary flex items-center space-x-2"
                >
                    <Plus className="w-5 h-5" />
                    <span>Создать интервью</span>
                </Link>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="text-2xl font-bold text-gray-900">{statusCounts.total}</div>
                    <div className="text-sm text-gray-600">Всего интервью</div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="text-2xl font-bold text-blue-600">{statusCounts.scheduled}</div>
                    <div className="text-sm text-gray-600">Запланировано</div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="text-2xl font-bold text-yellow-600">{statusCounts.in_progress}</div>
                    <div className="text-sm text-gray-600">В процессе</div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="text-2xl font-bold text-green-600">{statusCounts.completed}</div>
                    <div className="text-sm text-gray-600">Завершено</div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="text-2xl font-bold text-red-600">{statusCounts.cancelled}</div>
                    <div className="text-sm text-gray-600">Отменено</div>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Поиск по названию или кандидату..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-inter-verse-green focus:border-transparent"
                        />
                    </div>

                    {/* Filter Toggle */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center space-x-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <Filter className="w-5 h-5" />
                        <span>Фильтры</span>
                    </button>
                </div>

                {/* Filters */}
                {showFilters && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-4 border-t border-gray-200"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Статус</label>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-inter-verse-green focus:border-transparent"
                                >
                                    <option value="">Все статусы</option>
                                    {Object.entries(statusLabels).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Уровень</label>
                                <select
                                    value={levelFilter}
                                    onChange={(e) => setLevelFilter(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-inter-verse-green focus:border-transparent"
                                >
                                    <option value="">Все уровни</option>
                                    {Object.entries(levelLabels).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Специализация</label>
                                <select
                                    value={specializationFilter}
                                    onChange={(e) => setSpecializationFilter(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-inter-verse-green focus:border-transparent"
                                >
                                    <option value="">Все специализации</option>
                                    {Object.entries(specializationLabels).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="mt-4 flex space-x-3">
                            <button
                                onClick={fetchInterviews}
                                className="px-4 py-2 gradient-bg-adaptive text-white rounded-lg hover:opacity-90 transition-colors"
                            >
                                Применить фильтры
                            </button>
                            <button
                                onClick={() => {
                                    setStatusFilter('')
                                    setLevelFilter('')
                                    setSpecializationFilter('')
                                    fetchInterviews()
                                }}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Сбросить
                            </button>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Interviews List */}
            <div className="space-y-4">
                {filteredInterviews.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                        <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {searchTerm || statusFilter || levelFilter || specializationFilter
                                ? 'Интервью не найдены'
                                : 'Нет интервью'
                            }
                        </h3>
                        <p className="text-gray-600 mb-4">
                            {searchTerm || statusFilter || levelFilter || specializationFilter
                                ? 'Попробуйте изменить фильтры или поисковый запрос'
                                : 'Создайте первое интервью, чтобы начать работу'
                            }
                        </p>
                        {!searchTerm && !statusFilter && !levelFilter && !specializationFilter && (
                            <Link
                                to="/interviews/create"
                                className="btn-primary"
                            >
                                Создать интервью
                            </Link>
                        )}
                    </div>
                ) : (
                    filteredInterviews.map((interview, index) => (
                        <motion.div
                            key={interview.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center mb-3">
                                        <h3 className="text-xl font-semibold text-gray-900 mr-3">
                                            {interview.title}
                                        </h3>
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[interview.status as keyof typeof statusColors]}`}>
                                            {statusLabels[interview.status as keyof typeof statusLabels]}
                                        </span>
                                    </div>

                                    <p className="text-gray-600 mb-4">{interview.description}</p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                                        <div className="flex items-center">
                                            <User className="w-4 h-4 mr-2" />
                                            <span className="font-medium">{interview.candidate.name}</span>
                                        </div>
                                        <div className="flex items-center">
                                            <Clock className="w-4 h-4 mr-2" />
                                            <span>{interview.duration} мин</span>
                                        </div>
                                        <div className="flex items-center">
                                            <span className="font-medium">
                                                {specializationLabels[interview.specialization as keyof typeof specializationLabels]}
                                            </span>
                                            <span className="mx-2">•</span>
                                            <span>{levelLabels[interview.level as keyof typeof levelLabels]}</span>
                                        </div>
                                        {interview.scheduled_at && (
                                            <div className="flex items-center">
                                                <Calendar className="w-4 h-4 mr-2" />
                                                <span>{formatDate(interview.scheduled_at)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="ml-6 flex items-center space-x-2">
                                    {interview.status === 'scheduled' && (
                                        <button
                                            onClick={() => handleStartInterview(interview)}
                                            className="px-4 py-2 gradient-bg-adaptive text-white rounded-lg hover:opacity-90 transition-colors flex items-center space-x-2"
                                        >
                                            <Play className="w-4 h-4" />
                                            <span>Провести</span>
                                        </button>
                                    )}

                                    <div className="relative group">
                                        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                            <MoreVertical className="w-5 h-5" />
                                        </button>

                                        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                                            <div className="py-2">
                                                <Link
                                                    to={`/interviews/${interview.id}`}
                                                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                >
                                                    <Eye className="w-4 h-4 mr-3" />
                                                    Просмотр
                                                </Link>
                                                <Link
                                                    to={`/interviews/${interview.id}/edit`}
                                                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                >
                                                    <Edit className="w-4 h-4 mr-3" />
                                                    Редактировать
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(interview.id)}
                                                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                                >
                                                    <Trash2 className="w-4 h-4 mr-3" />
                                                    Удалить
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    )
}
