import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Download, User, Calendar, MapPin, Clock } from 'lucide-react'
// api import removed (unused)
import toast from 'react-hot-toast'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

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
            phone: string
            experience: number
        }
        specialization: string
        level: string
        scheduled_at: string
        duration: number
    }
}

export default function ReportDetailPage() {
    const { id } = useParams()
    const [report, setReport] = useState<Report | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (id) {
            fetchReport(id)
        }
    }, [id])

    const fetchReport = async (reportId: string) => {
        try {
            setLoading(true)
            // In a real app, you'd fetch from the reports endpoint
            // For now, we'll simulate with mock data
            const mockReport: Report = {
                id: reportId,
                interview_id: 'interview-123',
                overall_score: 82,
                algorithm_score: 75,
                architecture_score: 88,
                coding_score: 80,
                soft_skills_score: 85,
                comments: 'Кандидат показал отличные результаты в области архитектуры и soft skills. Хорошо решал алгоритмические задачи, но есть потенциал для роста в области кодинга. В целом, кандидат подходит для позиции.',
                recommendations: 'Рекомендуем к найму на позицию Senior Frontend разработчика. Предлагаем план развития в области кодинга и алгоритмов.',
                created_at: '2024-01-15T10:00:00Z',
                interview: {
                    id: 'interview-123',
                    title: 'Frontend интервью - Senior',
                    candidate: {
                        name: 'Алексей Петров',
                        email: 'alexey.petrov@example.com',
                        phone: '+7 (999) 123-45-67',
                        experience: 5,
                    },
                    specialization: 'frontend',
                    level: 'senior',
                    scheduled_at: '2024-01-15T10:00:00Z',
                    duration: 90,
                }
            }

            setReport(mockReport)
        } catch (error: any) {
            toast.error('Ошибка при загрузке отчёта')
        } finally {
            setLoading(false)
        }
    }

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

    const chartData = [
        { name: 'Алгоритмы', score: report?.algorithm_score || 0 },
        { name: 'Архитектура', score: report?.architecture_score || 0 },
        { name: 'Кодинг', score: report?.coding_score || 0 },
        { name: 'Soft Skills', score: report?.soft_skills_score || 0 },
    ]

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-inter-verse-green"></div>
            </div>
        )
    }

    if (!report) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Отчёт не найден</h2>
                <Link to="/reports" className="btn-primary">
                    Вернуться к отчётам
                </Link>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link
                        to="/reports"
                        className="btn-secondary inline-flex items-center space-x-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Назад</span>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Отчёт по кандидату</h1>
                        <p className="text-gray-600 mt-1">{report.interview.title}</p>
                    </div>
                </div>
                <button className="btn-primary inline-flex items-center space-x-2">
                    <Download className="w-5 h-5" />
                    <span>Экспорт PDF</span>
                </button>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Main Report */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Overall Score */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="card p-8"
                    >
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Общая оценка</h2>
                            <div className="relative w-32 h-32 mx-auto mb-6">
                                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                                    <circle
                                        cx="60"
                                        cy="60"
                                        r="50"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        fill="none"
                                        className="text-gray-200"
                                    />
                                    <circle
                                        cx="60"
                                        cy="60"
                                        r="50"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        fill="none"
                                        strokeDasharray={`${2 * Math.PI * 50}`}
                                        strokeDashoffset={`${2 * Math.PI * 50 * (1 - report.overall_score / 100)}`}
                                        className="text-inter-verse-green"
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-3xl font-bold text-gray-900">{report.overall_score}%</span>
                                </div>
                            </div>
                            <div className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-medium ${getScoreColor(report.overall_score)}`}>
                                {getScoreLabel(report.overall_score)}
                            </div>
                        </div>
                    </motion.div>

                    {/* Detailed Scores */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="card p-8"
                    >
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Детальная оценка</h2>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis domain={[0, 100]} />
                                    <Tooltip />
                                    <Bar dataKey="score" fill="#013220" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    {/* Comments */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="card p-8"
                    >
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Комментарии интервьюера</h2>
                        <div className="prose max-w-none">
                            <p className="text-gray-700 leading-relaxed">{report.comments}</p>
                        </div>
                    </motion.div>

                    {/* Recommendations */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="card p-8"
                    >
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Рекомендации</h2>
                        <div className="prose max-w-none">
                            <p className="text-gray-700 leading-relaxed">{report.recommendations}</p>
                        </div>
                    </motion.div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Candidate Info */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="card p-6"
                    >
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Информация о кандидате</h3>
                        <div className="space-y-4">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 gradient-bg rounded-full flex items-center justify-center">
                                    <User className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">{report.interview.candidate.name}</p>
                                    <p className="text-sm text-gray-600">{report.interview.candidate.email}</p>
                                </div>
                            </div>

                            <div className="space-y-3 text-sm">
                                <div className="flex items-center space-x-2 text-gray-600">
                                    <MapPin className="w-4 h-4" />
                                    <span>{getSpecializationLabel(report.interview.specialization)} • {getLevelLabel(report.interview.level)}</span>
                                </div>
                                <div className="flex items-center space-x-2 text-gray-600">
                                    <Calendar className="w-4 h-4" />
                                    <span>Опыт: {report.interview.candidate.experience} лет</span>
                                </div>
                                <div className="flex items-center space-x-2 text-gray-600">
                                    <Clock className="w-4 h-4" />
                                    <span>Длительность: {report.interview.duration} мин</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Score Breakdown */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="card p-6"
                    >
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Оценки по критериям</h3>
                        <div className="space-y-4">
                            {[
                                { name: 'Алгоритмы', score: report.algorithm_score },
                                { name: 'Архитектура', score: report.architecture_score },
                                { name: 'Кодинг', score: report.coding_score },
                                { name: 'Soft Skills', score: report.soft_skills_score },
                            ].map((item) => (
                                <div key={item.name} className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-600">{item.name}</span>
                                    <div className={`px-2 py-1 rounded text-xs font-medium ${getScoreColor(item.score)}`}>
                                        {item.score}%
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Interview Details */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="card p-6"
                    >
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Детали интервью</h3>
                        <div className="space-y-3 text-sm">
                            <div>
                                <p className="font-medium text-gray-600">Дата проведения</p>
                                <p className="text-gray-900">{new Date(report.interview.scheduled_at).toLocaleDateString('ru-RU', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}</p>
                            </div>
                            <div>
                                <p className="font-medium text-gray-600">ID интервью</p>
                                <p className="text-gray-900 font-mono text-xs">{report.interview.id}</p>
                            </div>
                            <div>
                                <p className="font-medium text-gray-600">ID отчёта</p>
                                <p className="text-gray-900 font-mono text-xs">{report.id}</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}
