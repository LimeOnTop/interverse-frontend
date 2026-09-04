import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Download, Calendar, MapPin, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '../services/api'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useTheme } from '../contexts/ThemeContext'
import PageHeader from '../components/ui/PageHeader'
import PageTransition from '../components/ui/PageTransition'
import Card from '../components/ui/Card'
import Spinner from '../components/ui/Spinner'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { isFallbackReport, reanalyzeReport, type GeneratedReport } from '../lib/reportAnalysis'
import { buildReportSections, getScoreLabel, getScoreVariant } from '../lib/reportScores'
import SectionScoreBadge from '../components/report/SectionScoreBadge'
import ReportAnswerReviews from '../components/report/ReportAnswerReviews'

interface Report extends GeneratedReport {
    algorithm_passed?: boolean
    architecture_passed?: boolean
    coding_passed?: boolean
    soft_skills_passed?: boolean
    interview: {
        id: string
        title: string
        specialization: string
        level: string
        scheduled_at: string
        duration?: number
    }
}

export default function ReportDetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { isDark } = useTheme()
    const [report, setReport] = useState<Report | null>(null)
    const [loading, setLoading] = useState(true)
    const [analyzing, setAnalyzing] = useState(false)

    useEffect(() => {
        if (id) {
            fetchReport(id)
        }
    }, [id])

    const fetchReport = async (reportId: string) => {
        try {
            setLoading(true)
            const response = await api.get(`/reports/${reportId}`)
            const reportData = response.data.report
            if (!reportData) {
                setReport(null)
                return
            }
            setReport(reportData)
        } catch (error: any) {
            toast.error('Ошибка при загрузке отчёта')
        } finally {
            setLoading(false)
        }
    }

    const handleAnalyze = async () => {
        if (!report || !id) return

        try {
            setAnalyzing(true)
            const updated = await reanalyzeReport(id)
            setReport(updated as Report)

            if (updated.id !== id) {
                navigate(`/reports/${updated.id}`, { replace: true })
            }

            if (isFallbackReport(updated)) {
                toast.error('AI-анализ не удался. Попробуйте позже.')
            } else {
                toast.success('Отчёт проанализирован')
            }
        } catch (error: unknown) {
            const message = typeof error === 'object'
                && error !== null
                && 'response' in error
                && typeof (error as { response?: { data?: { error?: unknown } } }).response?.data?.error === 'string'
                ? (error as { response: { data: { error: string } } }).response.data.error
                : 'Не удалось выполнить AI-анализ'
            toast.error(message)
        } finally {
            setAnalyzing(false)
        }
    }

    const needsAnalysis = report ? isFallbackReport(report) : false

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

    const sections = report ? buildReportSections(report) : []
    const chartData = sections
        .filter((section) => !section.comingSoon)
        .map((section) => ({
            name: section.name,
            score: section.passed === false && section.score === 0 ? 0 : section.score,
        }))

    if (loading) return <Spinner size="lg" className="h-64" />

    if (!report) {
        return (
            <PageTransition className="text-center py-12">
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Отчёт не найден</h2>
                <Link to="/reports">
                    <Button>Вернуться к отчётам</Button>
                </Link>
            </PageTransition>
        )
    }

    return (
        <PageTransition className="space-y-8">
            <PageHeader
                title="Отчёт по тренировке"
                description={report.interview?.title || 'Тренировка'}
                breadcrumbs={[
                    { label: 'Отчёты', href: '/reports' },
                    { label: report.interview?.title || 'Тренировка' },
                ]}
                action={
                    <Button>
                        <Download className="w-5 h-5" /> Экспорт PDF
                    </Button>
                }
            />

            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <Card padding="lg">
                            <div className="text-center">
                                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Общая оценка</h2>
                                <div className="relative w-32 h-32 mx-auto mb-6">
                                    <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                                        <circle cx="60" cy="60" r="50" stroke="currentColor" strokeWidth="8" fill="none" className="text-gray-200 dark:text-gray-700" />
                                        <circle
                                            cx="60" cy="60" r="50" stroke="currentColor" strokeWidth="8" fill="none"
                                            strokeDasharray={`${2 * Math.PI * 50}`}
                                            strokeDashoffset={`${2 * Math.PI * 50 * (1 - report.overall_score / 100)}`}
                                            className="text-inter-verse-green dark:text-purple-500"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-3xl font-bold tabular-nums text-gray-900 dark:text-gray-100">{report.overall_score}%</span>
                                    </div>
                                </div>
                                <Badge variant={getScoreVariant(report.overall_score)} className="text-base px-4 py-2">
                                    {getScoreLabel(report.overall_score)}
                                </Badge>
                            </div>
                        </Card>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        <Card padding="lg">
                            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Детальная оценка</h2>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#4b5563' : '#e5e7eb'} />
                                        <XAxis dataKey="name" tick={{ fill: isDark ? '#d1d5db' : '#374151' }} stroke={isDark ? '#6b7280' : '#9ca3af'} />
                                        <YAxis domain={[0, 100]} tick={{ fill: isDark ? '#d1d5db' : '#374151' }} stroke={isDark ? '#6b7280' : '#9ca3af'} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: isDark ? '#4A4A4A' : '#ffffff',
                                                border: isDark ? '1px solid #6b7280' : '1px solid #e5e7eb',
                                                borderRadius: '0',
                                                color: isDark ? '#f3f4f6' : '#111827'
                                            }}
                                            labelStyle={{ color: isDark ? '#d1d5db' : '#6b7280' }}
                                        />
                                        <Bar dataKey="score" fill={isDark ? '#9333ea' : '#013220'} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <Card padding="lg">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Комментарии интервьюера</h2>
                                {needsAnalysis && (
                                    <Button
                                        onClick={handleAnalyze}
                                        loading={analyzing}
                                        className="shrink-0"
                                    >
                                        <Sparkles className="w-4 h-4" />
                                        Проанализировать
                                    </Button>
                                )}
                            </div>
                            {needsAnalysis && (
                                <p className="text-sm text-secondary mb-4">
                                    AI-анализ ещё не выполнен. Нажмите кнопку, чтобы получить развёрнутый фидбек.
                                </p>
                            )}
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{report.comments}</p>
                        </Card>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                        <ReportAnswerReviews items={report.answer_reviews || []} />
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                        <Card padding="lg">
                            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Рекомендации</h2>
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{report.recommendations}</p>
                        </Card>
                    </motion.div>
                </div>

                <div className="space-y-6">
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                        <Card padding="md">
                            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">О тренировке</h3>
                            <div className="space-y-3 text-sm text-secondary">
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4" />
                                    {getSpecializationLabel(report.interview?.specialization || '')} • {getLevelLabel(report.interview?.level || '')}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    {report.interview?.scheduled_at
                                        ? new Date(report.interview.scheduled_at).toLocaleDateString('ru-RU', {
                                            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
                                        })
                                        : '—'}
                                </div>
                            </div>
                        </Card>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                        <Card padding="md">
                            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Оценки по критериям</h3>
                            <div className="space-y-4">
                                {sections.map((section) => (
                                    <div key={section.key} className="flex items-center justify-between gap-3">
                                        <span className="text-sm text-secondary">{section.name}</span>
                                        <SectionScoreBadge section={section} />
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                        <Card padding="md">
                            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Детали интервью</h3>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <p className="text-secondary mb-1">Дата проведения</p>
                                    <p className="text-gray-900 dark:text-gray-100">
                                        {report.interview?.scheduled_at
                                            ? new Date(report.interview.scheduled_at).toLocaleDateString('ru-RU', {
                                                year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                            })
                                            : '—'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-secondary mb-1">ID интервью</p>
                                    <p className="font-mono text-xs text-gray-900 dark:text-gray-100">{report.interview?.id || report.interview_id}</p>
                                </div>
                                <div>
                                    <p className="text-secondary mb-1">ID отчёта</p>
                                    <p className="font-mono text-xs text-gray-900 dark:text-gray-100">{report.id}</p>
                                </div>
                            </div>
                        </Card>
                    </motion.div>

                    <Link to="/reports">
                        <Button variant="secondary" className="w-full">
                            <ArrowLeft className="w-4 h-4" /> Назад к отчётам
                        </Button>
                    </Link>
                </div>
            </div>
        </PageTransition>
    )
}
