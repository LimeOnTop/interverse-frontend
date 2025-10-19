import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FileText, Search, Download, Eye } from 'lucide-react'
import { api } from '../services/api'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'

interface Report {
    id: string
    interview_id: string
    overall_score: number
    algorithm_score: number
    architecture_score: number
    coding_score: number
    soft_skills_score: number
    comments: string
    recommendations: string
    created_at: string
    interview: {
        id: string
        title: string
        candidate: {
            name: string
            email: string
        }
        specialization: string
        level: string
    }
}

export default function ReportsPage() {
    const [reports, setReports] = useState<Report[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetchReports()
    }, [])

    const fetchReports = async () => {
        try {
            setLoading(true)
            // In a real app, you'd have a dedicated reports endpoint
            // For now, we'll simulate with interviews that have reports
            const response = await api.get('/interviews/')
            const interviews = response.data.interviews || []

            // Filter interviews that have reports (simulate)
            const reportsWithData = interviews.slice(0, 3).map((interview: any, index: number) => ({
                id: `report-${interview.id}`,
                interview_id: interview.id,
                overall_score: 75 + index * 5,
                algorithm_score: 70 + index * 8,
                architecture_score: 80 + index * 3,
                coding_score: 75 + index * 6,
                soft_skills_score: 85 + index * 2,
                comments: `Отличная работа кандидата в области ${interview.specialization}. Показал хорошие знания технологий.`,
                recommendations: 'Рекомендуем к найму на позицию.',
                created_at: interview.created_at,
                interview: {
                    id: interview.id,
                    title: interview.title,
                    candidate: interview.candidate,
                    specialization: interview.specialization,
                    level: interview.level,
                }
            }))

            setReports(reportsWithData)
        } catch (error: any) {
            toast.error('Ошибка при загрузке отчётов')
        } finally {
            setLoading(false)
        }
    }

    const filteredReports = reports.filter(report =>
        report.interview.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.interview.candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.interview.specialization.toLowerCase().includes(searchTerm.toLowerCase())
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

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600 bg-green-100'
        if (score >= 60) return 'text-yellow-600 bg-yellow-100'
        return 'text-red-600 bg-red-100'
    }

    const getScoreLabel = (score: number) => {
        if (score >= 80) return 'Отлично'
        if (score >= 60) return 'Хорошо'
        return 'Требует улучшения'
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
                    <h1 className="text-3xl font-bold text-gray-900">Отчёты</h1>
                    <p className="text-gray-600 mt-1">Результаты проведённых интервью</p>
                </div>
                <button className="btn-secondary inline-flex items-center space-x-2">
                    <Download className="w-5 h-5" />
                    <span>Экспорт всех</span>
                </button>
            </div>

            {/* Search */}
            <div className="card p-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Поиск по названию интервью, кандидату или специализации..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-field pl-10"
                    />
                </div>
            </div>

            {/* Reports List */}
            <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Отчёты ({filteredReports.length})
                </h2>

                {filteredReports.length === 0 ? (
                    <div className="card p-12 text-center">
                        <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Нет отчётов
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Отчёты появятся после завершения интервью
                        </p>
                        <Link
                            to="/dashboard"
                            className="btn-primary inline-flex items-center space-x-2"
                        >
                            <span>Перейти к интервью</span>
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {filteredReports.map((report, index) => (
                            <motion.div
                                key={report.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="card p-6 hover:shadow-lg transition-all duration-200"
                            >
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                            {report.interview.title}
                                        </h3>
                                        <div className="flex items-center space-x-6 text-sm text-gray-600 mb-4">
                                            <span className="flex items-center space-x-1">
                                                <span className="font-medium">Кандидат:</span>
                                                <span>{report.interview.candidate.name}</span>
                                            </span>
                                            <span className="flex items-center space-x-1">
                                                <span className="font-medium">Специализация:</span>
                                                <span>{getSpecializationLabel(report.interview.specialization)}</span>
                                            </span>
                                            <span className="flex items-center space-x-1">
                                                <span className="font-medium">Уровень:</span>
                                                <span>{getLevelLabel(report.interview.level)}</span>
                                            </span>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(report.overall_score)}`}>
                                            {report.overall_score}% - {getScoreLabel(report.overall_score)}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2">
                                            {new Date(report.created_at).toLocaleDateString('ru-RU')}
                                        </p>
                                    </div>
                                </div>

                                {/* Scores */}
                                <div className="grid md:grid-cols-4 gap-4 mb-6">
                                    <div className="text-center">
                                        <p className="text-sm font-medium text-gray-600 mb-1">Алгоритмы</p>
                                        <div className={`inline-flex items-center px-2 py-1 rounded text-sm font-medium ${getScoreColor(report.algorithm_score)}`}>
                                            {report.algorithm_score}%
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-medium text-gray-600 mb-1">Архитектура</p>
                                        <div className={`inline-flex items-center px-2 py-1 rounded text-sm font-medium ${getScoreColor(report.architecture_score)}`}>
                                            {report.architecture_score}%
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-medium text-gray-600 mb-1">Кодинг</p>
                                        <div className={`inline-flex items-center px-2 py-1 rounded text-sm font-medium ${getScoreColor(report.coding_score)}`}>
                                            {report.coding_score}%
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-medium text-gray-600 mb-1">Soft Skills</p>
                                        <div className={`inline-flex items-center px-2 py-1 rounded text-sm font-medium ${getScoreColor(report.soft_skills_score)}`}>
                                            {report.soft_skills_score}%
                                        </div>
                                    </div>
                                </div>

                                {/* Comments */}
                                {report.comments && (
                                    <div className="mb-6">
                                        <h4 className="text-sm font-medium text-gray-600 mb-2">Комментарии</h4>
                                        <p className="text-gray-700 text-sm">{report.comments}</p>
                                    </div>
                                )}

                                {/* Recommendations */}
                                {report.recommendations && (
                                    <div className="mb-6">
                                        <h4 className="text-sm font-medium text-gray-600 mb-2">Рекомендации</h4>
                                        <p className="text-gray-700 text-sm">{report.recommendations}</p>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                    <div className="flex items-center space-x-4">
                                        <Link
                                            to={`/reports/${report.id}`}
                                            className="btn-primary text-sm px-4 py-2 inline-flex items-center space-x-2"
                                        >
                                            <Eye className="w-4 h-4" />
                                            <span>Подробнее</span>
                                        </Link>
                                        <button className="btn-secondary text-sm px-4 py-2 inline-flex items-center space-x-2">
                                            <Download className="w-4 h-4" />
                                            <span>PDF</span>
                                        </button>
                                    </div>
                                    <span className="text-xs text-gray-500">
                                        ID: {report.interview_id}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
