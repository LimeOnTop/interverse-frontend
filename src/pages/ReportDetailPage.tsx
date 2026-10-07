import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Download, Sparkles, Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '../services/api'
import PageHeader from '../components/ui/PageHeader'
import PageTransition from '../components/ui/PageTransition'
import Spinner from '../components/ui/Spinner'
import Button from '../components/ui/Button'
import { isFallbackReport, reanalyzeReport, type GeneratedReport } from '../lib/reportAnalysis'
import { buildReportSections, getScoreLabel, getScoreVariant } from '../lib/reportScores'
import { downloadReportPdf } from '../lib/exportReportPdf'
import SectionScoreBadge from '../components/report/SectionScoreBadge'
import QuestionGrid from '../components/report/QuestionGrid'
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

    const reviews = report.answer_reviews || []
    const questionCount = reviews.filter((item) => item.item_type !== 'task').length
    const taskCount = reviews.filter((item) => item.item_type === 'task').length
    const scoredSections = sections.filter((section) => !section.comingSoon)
    const scheduledAt = report.interview?.scheduled_at
        ? new Date(report.interview.scheduled_at).toLocaleDateString('ru-RU', {
            day: 'numeric', month: 'long', year: 'numeric',
        })
        : null

    return (
        <PageTransition className="space-y-5 sm:space-y-8">
            <PageHeader
                title="Отчёт по тренировке"
                description={report.interview?.title || 'Тренировка'}
                breadcrumbs={[
                    { label: 'Отчёты', href: '/reports' },
                    { label: report.interview?.title || 'Тренировка' },
                ]}
            />

            <div className="grid gap-8 lg:gap-10 lg:grid-cols-3 lg:grid-rows-[auto_1fr]">
                <motion.section
                    className="lg:col-span-2 text-center py-4 sm:py-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <p className="text-sm font-medium uppercase tracking-[0.2em] text-secondary">Итоговый результат</p>
                    <div className="mt-3 text-8xl sm:text-9xl font-bold tabular-nums leading-none tracking-tight gradient-text-adaptive">
                        {report.overall_score}%
                    </div>
                    <p className={`mt-4 text-lg font-semibold ${scoreTextClass(report.overall_score)}`}>
                        {getScoreLabel(report.overall_score)}
                    </p>
                    {scoredSections.length > 0 && (
                        <div className="mt-6 flex flex-wrap justify-center gap-x-10 gap-y-3">
                            {scoredSections.map((section) => (
                                <div key={section.key} className="flex flex-col items-center">
                                    <span className="text-xs uppercase tracking-wide text-secondary">{section.name}</span>
                                    <SectionScoreBadge section={section} className="mt-1 text-xl" />
                                </div>
                            ))}
                        </div>
                    )}
                </motion.section>

                <motion.aside
                    className="lg:col-start-3 lg:row-start-1 lg:row-span-2 lg:self-start lg:sticky lg:top-0"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="iv-surface border border-gray-200 dark:border-gray-600 shadow-iv-md overflow-hidden">
                        <div className="h-1 gradient-bg-adaptive" />
                        <div className="p-5 sm:p-6">
                            <p className="text-xs uppercase tracking-[0.2em] text-secondary">Тренировка</p>
                            <h3 className="mt-2 text-lg font-semibold text-gray-900 dark:text-gray-100 break-words">
                                {report.interview?.title || 'Тренировка'}
                            </h3>
                            <dl className="mt-5 space-y-3 text-sm">
                                <InfoRow label="Направление" value={getSpecializationLabel(report.interview?.specialization || '') || '—'} />
                                <InfoRow label="Грейд" value={getLevelLabel(report.interview?.level || '') || '—'} />
                                {scheduledAt && <InfoRow label="Дата" value={scheduledAt} />}
                                {(questionCount > 0 || taskCount > 0) && (
                                    <InfoRow
                                        label="Состав"
                                        value={[
                                            questionCount > 0 ? `${questionCount} ${plural(questionCount, ['вопрос', 'вопроса', 'вопросов'])}` : '',
                                            taskCount > 0 ? `${taskCount} ${plural(taskCount, ['задача', 'задачи', 'задач'])}` : '',
                                        ].filter(Boolean).join(' · ')}
                                    />
                                )}
                            </dl>

                            <div className="mt-6 space-y-2">
                                {locked ? (
                                    <Link to="/subscription" className="btn-secondary w-full inline-flex justify-center items-center gap-2" title="Скачивание отчёта в PDF доступно в Pro">
                                        <Lock className="w-4 h-4" /> PDF в Pro
                                    </Link>
                                ) : (
                                    <Button type="button" className="w-full" loading={exporting} onClick={() => void handleExportPdf()}>
                                        <Download className="w-4 h-4" /> Экспорт PDF
                                    </Button>
                                )}
                                <Link to="/reports" className="btn-ghost w-full inline-flex justify-center items-center gap-2">
                                    <ArrowLeft className="w-4 h-4" /> Все отчёты
                                </Link>
                            </div>
                        </div>
                    </div>
                </motion.aside>

                <div className="lg:col-span-2 space-y-10 sm:space-y-12">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        <WeakPointsSection
                            locked={locked}
                            count={report.weak_points_count ?? report.weak_points?.length ?? 0}
                            points={report.weak_points || []}
                        />
                    </motion.div>

                    {(report.comments || needsAnalysis) && (
                        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{locked ? 'Общий отзыв' : 'Комментарии интервьюера'}</h2>
                                {needsAnalysis && (
                                    <Button onClick={handleAnalyze} loading={analyzing} className="shrink-0">
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
                            {!locked && report.strengths && (
                                <>
                                    <h3 className="text-lg font-semibold mt-8 mb-3 text-gray-900 dark:text-gray-100">Сильные стороны</h3>
                                    <AccentList text={report.strengths} />
                                </>
                            )}
                            {!locked && report.weaknesses && (
                                <>
                                    <h3 className="text-lg font-semibold mt-8 mb-3 text-gray-900 dark:text-gray-100">Над чем поработать</h3>
                                    <AccentList text={report.weaknesses} />
                                </>
                            )}
                            {!locked && report.recommendations && (
                                <>
                                    <h3 className="text-lg font-semibold mt-8 mb-3 text-gray-900 dark:text-gray-100">Рекомендации</h3>
                                    <AccentList text={report.recommendations} />
                                </>
                            )}
                        </motion.section>
                    )}

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                        <QuestionGrid items={reviews} />
                    </motion.div>
                </div>
            </div>
        </PageTransition>
    )
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-baseline justify-between gap-4">
            <dt className="text-secondary">{label}</dt>
            <dd className="font-medium text-right text-gray-900 dark:text-gray-100">{value}</dd>
        </div>
    )
}

function plural(count: number, forms: [string, string, string]) {
    const mod10 = count % 10
    const mod100 = count % 100
    if (mod10 === 1 && mod100 !== 11) return forms[0]
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1]
    return forms[2]
}

function scoreTextClass(score: number) {
    return getScoreVariant(score) === 'danger'
        ? 'text-red-600 dark:text-red-400'
        : 'text-inter-verse-green dark:text-purple-400'
}
