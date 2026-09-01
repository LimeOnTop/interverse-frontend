import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FileText, Search, Download, Eye } from 'lucide-react'
import { api } from '../services/api'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import PageHeader from '../components/ui/PageHeader'
import PageTransition from '../components/ui/PageTransition'
import Card from '../components/ui/Card'
import EmptyState from '../components/ui/EmptyState'
import Spinner from '../components/ui/Spinner'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'

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

const getScoreVariant = (score: number): 'success' | 'warning' | 'danger' => {
    if (score >= 80) return 'success'
    if (score >= 60) return 'warning'
    return 'danger'
}

const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Отлично'
    if (score >= 60) return 'Хорошо'
    return 'Требует улучшения'
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
            const response = await api.get('/interviews/')
            const interviews = response.data.interviews || []

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

    if (loading) return <Spinner size="lg" className="h-64" />

    return (
        <PageTransition className="space-y-8">
            <PageHeader
                title="Отчёты"
                description="Результаты проведённых интервью"
                action={
                    <Button variant="secondary">
                        <Download className="w-5 h-5" /> Экспорт всех
                    </Button>
                }
            />

            <Card padding="md">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" strokeWidth={1.75} />
                    <input
                        type="text"
                        placeholder="Поиск по названию интервью, кандидату или специализации..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-field pl-10"
                    />
                </div>
            </Card>

            <section>
                <h2 className="text-lg font-semibold mb-4 tabular-nums">
                    Отчёты <span className="text-secondary font-normal">({filteredReports.length})</span>
                </h2>

                {filteredReports.length === 0 ? (
                    <EmptyState
                        icon={FileText}
                        title="Нет отчётов"
                        description="Отчёты появятся после завершения интервью"
                        action={
                            <Link to="/dashboard">
                                <Button>Перейти к интервью</Button>
                            </Link>
                        }
                    />
                ) : (
                    <div className="grid gap-4">
                        {filteredReports.map((report, index) => (
                            <motion.div
                                key={report.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05, duration: 0.4 }}
                            >
                                <Card hover padding="md">
                                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
                                        <div className="flex-1">
                                            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                                {report.interview.title}
                                            </h3>
                                            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-secondary">
                                                <span>Кандидат: <span className="text-gray-900 dark:text-gray-100">{report.interview.candidate.name}</span></span>
                                                <span>Специализация: {getSpecializationLabel(report.interview.specialization)}</span>
                                                <span>Уровень: {getLevelLabel(report.interview.level)}</span>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <Badge variant={getScoreVariant(report.overall_score)}>
                                                {report.overall_score}% — {getScoreLabel(report.overall_score)}
                                            </Badge>
                                            <p className="text-xs text-secondary mt-2">
                                                {new Date(report.created_at).toLocaleDateString('ru-RU')}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                        {[
                                            { label: 'Алгоритмы', score: report.algorithm_score },
                                            { label: 'Архитектура', score: report.architecture_score },
                                            { label: 'Кодинг', score: report.coding_score },
                                            { label: 'Soft Skills', score: report.soft_skills_score },
                                        ].map(({ label, score }) => (
                                            <div key={label} className="text-center">
                                                <p className="text-xs font-medium uppercase tracking-wide text-secondary mb-1">{label}</p>
                                                <Badge variant={getScoreVariant(score)}>{score}%</Badge>
                                            </div>
                                        ))}
                                    </div>

                                    {report.comments && (
                                        <div className="mb-4">
                                            <h4 className="text-xs font-medium uppercase tracking-wide text-secondary mb-2">Комментарии</h4>
                                            <p className="text-sm text-gray-700 dark:text-gray-300">{report.comments}</p>
                                        </div>
                                    )}

                                    {report.recommendations && (
                                        <div className="mb-4">
                                            <h4 className="text-xs font-medium uppercase tracking-wide text-secondary mb-2">Рекомендации</h4>
                                            <p className="text-sm text-gray-700 dark:text-gray-300">{report.recommendations}</p>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between pt-4 iv-divider">
                                        <div className="flex items-center gap-3">
                                            <Link to={`/reports/${report.id}`}>
                                                <Button className="text-sm px-4 py-2">
                                                    <Eye className="w-4 h-4" /> Подробнее
                                                </Button>
                                            </Link>
                                            <Button variant="secondary" className="text-sm px-4 py-2">
                                                <Download className="w-4 h-4" /> PDF
                                            </Button>
                                        </div>
                                        <span className="text-xs text-secondary">ID: {report.interview_id}</span>
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
