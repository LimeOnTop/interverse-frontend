import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Download, Calendar, MapPin, Sparkles, Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '../services/api'
import PageHeader from '../components/ui/PageHeader'
import PageTransition from '../components/ui/PageTransition'
import Card from '../components/ui/Card'
import Spinner from '../components/ui/Spinner'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { isFallbackReport, reanalyzeReport, type GeneratedReport } from '../lib/reportAnalysis'
import { buildReportSections, getScoreLabel, getScoreVariant } from '../lib/reportScores'
import { downloadReportPdf } from '../lib/exportReportPdf'
import SectionScoreBadge from '../components/report/SectionScoreBadge'
import ReportAnswerReviews from '../components/report/ReportAnswerReviews'
import WeakPointsSection from '../components/report/WeakPointsSection'
import AccentList from '../components/report/AccentList'

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
    const [report, setReport] = useState<Report | null>(null)
    const [loading, setLoading] = useState(true)
    const [analyzing, setAnalyzing] = useState(false)
    const [exporting, setExporting] = useState(false)

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

    const handleExportPdf = async () => {
        if (!report) return
        try {
            setExporting(true)
            await downloadReportPdf(report)
            toast.success('PDF скачан')
        } catch (error) {
            console.error('PDF export failed:', error)
            toast.error('Не удалось сформировать PDF')
        } finally {
            setExporting(false)
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
    const locked = Boolean(report?.locked)

    if (loading) return <Spinner size="lg" className="h-64" />

    if (!report) {
        return (
            <PageTransition className="text-center py-12">
                <h2 className="text-xl sm:text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Отчёт не найден</h2>
                <Link to="/reports">
                    <Button>Вернуться к отчётам</Button>
                </Link>
            </PageTransition>
        )
    }

    return (
        <PageTransition className="space-y-5 sm:space-y-8">
            <PageHeader
                title="Отчёт по тренировке"
                description={report.interview?.title || 'Тренировка'}
                breadcrumbs={[
                    { label: 'Отчёты', href: '/reports' },
                    { label: report.interview?.title || 'Тренировка' },
                ]}
                action={
                    locked ? (
                        <Link to="/subscription" className="btn-secondary inline-flex items-center gap-2" title="Скачивание отчёта в PDF доступно в Pro">
                            <Lock className="w-4 h-4" /> PDF в Pro
                        </Link>
                    ) : (
                        <Button type="button" loading={exporting} onClick={() => void handleExportPdf()}>
                            <Download className="w-5 h-5" /> Экспорт PDF
                        </Button>
                    )
                }
            />

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card padding="lg">
                    <div className="text-center py-2">
                        <p className="text-sm font-medium uppercase tracking-wide text-secondary mb-2">Итоговый результат</p>
                        <div className="text-7xl sm:text-8xl font-bold tabular-nums leading-none text-inter-verse-green dark:text-purple-400">
                            {report.overall_score}%
                        </div>
                        <Badge variant={getScoreVariant(report.overall_score)} className="text-base px-4 py-2 mt-5">
                            {getScoreLabel(report.overall_score)}
                        </Badge>
                        <p className="lg:hidden text-sm text-secondary mt-4">
                            {getSpecializationLabel(report.interview?.specialization || '')} · {getLevelLabel(report.interview?.level || '')}
                            {report.interview?.scheduled_at && ` · ${new Date(report.interview.scheduled_at).toLocaleDateString('ru-RU')}`}
                        </p>
                    </div>
                    {/* Phones: section scores right under the result instead of a sidebar far below. */}
                    <div className="lg:hidden grid grid-cols-2 gap-3 mt-6 pt-5 border-t border-gray-200 dark:border-gray-600">
                        {sections.map((section) => (
                            <div key={section.key} className="flex flex-col items-start gap-1">
                                <span className="text-[11px] uppercase tracking-wide text-secondary">{section.name}</span>
                                <SectionScoreBadge section={section} />
                            </div>
                        ))}
                    </div>
                </Card>
            </motion.div>

            <div className="grid lg:grid-cols-3 gap-5 sm:gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        <WeakPointsSection
                            locked={locked}
                            count={report.weak_points_count ?? report.weak_points?.length ?? 0}
                            points={report.weak_points || []}
                        />
                    </motion.div>

                    {(!locked || report.comments || needsAnalysis) && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <Card padding="lg">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{locked ? 'Общий отзыв' : 'Комментарии интервьюера'}</h2>
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
                            {report.comments && <AccentList text={report.comments} />}
                            {report.strengths && (
                                <>
                                    <h3 className="text-lg font-semibold mt-6 mb-3 text-gray-900 dark:text-gray-100">Сильные стороны</h3>
                                    <AccentList text={report.strengths} />
                                </>
                            )}
                            {!locked && report.weaknesses && (
                                <>
                                    <h3 className="text-lg font-semibold mt-6 mb-3 text-gray-900 dark:text-gray-100">Над чем поработать</h3>
                                    <AccentList text={report.weaknesses} />
                                </>
                            )}
                        </Card>
                    </motion.div>
                    )}

                    {!locked && report.recommendations && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                            <Card padding="lg">
                                <h2 className="text-xl sm:text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Рекомендации</h2>
                                <AccentList text={report.recommendations} />
                            </Card>
                        </motion.div>
                    )}

                    {!locked && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                            <ReportAnswerReviews items={report.answer_reviews || []} />
                        </motion.div>
                    )}
                </div>

                <div className="space-y-6">
                    <motion.div className="hidden lg:block" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
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

                    <motion.div className="hidden lg:block" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
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

                    <motion.div className="hidden lg:block" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
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
