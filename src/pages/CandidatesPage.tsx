import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, User, Mail, Phone, Calendar } from 'lucide-react'
import { api } from '../services/api'
import toast from 'react-hot-toast'
import CandidateFilters from '../components/CandidateFilters'

interface Candidate {
    id: string
    name: string
    email: string
    phone: string
    experience: number
    level: string
    specialization: string
    tech_stack: string
    created_at: string
}

export default function CandidatesPage() {
    const [candidates, setCandidates] = useState<Candidate[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [levelFilter, setLevelFilter] = useState('')
    const [specializationFilter, setSpecializationFilter] = useState('')

    useEffect(() => {
        fetchCandidates()
    }, [])

    const fetchCandidates = async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams()
            if (levelFilter) params.append('level', levelFilter)
            if (specializationFilter) params.append('specialization', specializationFilter)

            const response = await api.get(`/candidates/?${params.toString()}`)
            setCandidates(response.data.candidates || [])
        } catch (error: any) {
            toast.error('Ошибка при загрузке кандидатов')
        } finally {
            setLoading(false)
        }
    }

    const handleClearFilters = () => {
        setLevelFilter('')
        setSpecializationFilter('')
        setSearchTerm('')
    }

    const filteredCandidates = candidates.filter(candidate =>
        candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.specialization.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const getSpecializationLabel = (specialization: string) => {
        const labels: Record<string, string> = {
            frontend: 'Frontend',
            backend: 'Backend',
            devops: 'DevOps',
            qa: 'QA',
            data_science: 'Data Science',
        }
        return labels[specialization] || specialization
    }

    const getLevelLabel = (level: string) => {
        const labels: Record<string, string> = {
            intern: 'Intern',
            junior: 'Junior',
            middle: 'Middle',
            senior: 'Senior',
            lead: 'Lead/CTO',
        }
        return labels[level] || level
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-inter-verse-green"></div>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Кандидаты</h1>
                    <p className="text-gray-600 mt-1">Управление базой кандидатов</p>
                </div>
                <button className="btn-primary inline-flex items-center space-x-2">
                    <Plus className="w-5 h-5" />
                    <span>Добавить кандидата</span>
                </button>
            </div>

            {/* Modern Filters */}
            <CandidateFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                levelFilter={levelFilter}
                onLevelChange={setLevelFilter}
                specializationFilter={specializationFilter}
                onSpecializationChange={setSpecializationFilter}
                onApplyFilters={fetchCandidates}
                onClearFilters={handleClearFilters}
            />

            {/* Candidates List */}
            <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Кандидаты ({filteredCandidates.length})
                </h2>

                {filteredCandidates.length === 0 ? (
                    <div className="card p-12 text-center">
                        <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Нет кандидатов
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Добавьте кандидатов для проведения интервью
                        </p>
                        <button className="btn-primary inline-flex items-center space-x-2">
                            <Plus className="w-5 h-5" />
                            <span>Добавить кандидата</span>
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {filteredCandidates.map((candidate, index) => (
                            <motion.div
                                key={candidate.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="card p-6 hover:shadow-lg transition-all duration-200"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3 mb-3">
                                            <div className="w-12 h-12 gradient-bg rounded-full flex items-center justify-center">
                                                <User className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    {candidate.name}
                                                </h3>
                                                <div className="flex items-center space-x-4 text-sm text-gray-600">
                                                    <span className="flex items-center space-x-1">
                                                        <Mail className="w-4 h-4" />
                                                        <span>{candidate.email}</span>
                                                    </span>
                                                    {candidate.phone && (
                                                        <span className="flex items-center space-x-1">
                                                            <Phone className="w-4 h-4" />
                                                            <span>{candidate.phone}</span>
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-3 gap-4">
                                            <div>
                                                <p className="text-sm font-medium text-gray-600">Специализация</p>
                                                <p className="text-gray-900">{getSpecializationLabel(candidate.specialization)}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-600">Уровень</p>
                                                <p className="text-gray-900">{getLevelLabel(candidate.level)}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-600">Опыт</p>
                                                <p className="text-gray-900">{candidate.experience} лет</p>
                                            </div>
                                        </div>

                                        {candidate.tech_stack && (
                                            <div className="mt-4">
                                                <p className="text-sm font-medium text-gray-600 mb-2">Технологии</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {JSON.parse(candidate.tech_stack).map((tech: string, techIndex: number) => (
                                                        <span
                                                            key={techIndex}
                                                            className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs"
                                                        >
                                                            {tech}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="text-right">
                                        <div className="flex items-center text-sm text-gray-500 mb-2">
                                            <Calendar className="w-4 h-4 mr-1" />
                                            <span>Добавлен: {new Date(candidate.created_at).toLocaleDateString('ru-RU')}</span>
                                        </div>
                                        <div className="flex space-x-2">
                                            <button className="btn-secondary text-sm px-4 py-2">
                                                Редактировать
                                            </button>
                                            <button className="btn-primary text-sm px-4 py-2">
                                                Создать интервью
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
