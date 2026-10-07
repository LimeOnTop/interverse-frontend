import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Download, Sparkles, Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '../services/api'
import PageTransition from '../components/ui/PageTransition'
import Spinner from '../components/ui/Spinner'
import Button from '../components/ui/Button'
import { isFallbackReport, reanalyzeReport, type GeneratedReport } from '../lib/reportAnalysis'
import { PASS_SCORE_THRESHOLD, getScoreLabel } from '../lib/reportScores'
import { formatDay, levelLabel, specializationLabel } from '../lib/dashboard'
import { downloadReportPdf } from '../lib/exportReportPdf'
import ScoreRing from '../components/report/ScoreRing'
import ScoreBars from '../components/report/ScoreBars'
import FocusPlan from '../components/report/FocusPlan'
import ErrorList from '../components/report/ErrorList'
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
    const [tab, setTab] = useState<ReportTab>('errors')

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
    const weakCount = report.weak_points_count ?? report.weak_points?.length ?? 0
    const [headlineFirst, headlineSecond] = (report.headline || getScoreLabel(report.overall_score)).split('\n')
    const title = [specializationLabel(report.interview?.specialization), levelLabel(report.interview?.level)].filter(Boolean).join(' · ')
        || report.interview?.title || 'Тренировка'
    const subtitle = [
        'Отчёт по тренировке',
        (report.technologies || []).slice(0, 3).join(', '),
        formatDay(report.interview?.scheduled_at || report.created_at),
    ].filter(Boolean).join(' · ')

    const tabs: { key: ReportTab; label: string }[] = [
        { key: 'errors', label: `Ошибки · ${weakCount}` },
        { key: 'strengths', label: 'Сильные стороны' },
        { key: 'answers', label: `Все ответы · ${reviews.length}` },
    ]

    return (
        <PageTransition className="space-y-6 sm:space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                    <Link to="/reports" className="inline-flex items-center gap-1.5 text-sm text-secondary hover:text-gray-900 dark:hover:text-gray-100 mb-2">
                        <ArrowLeft className="w-4 h-4" /> Отчёты
                    </Link>
                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">{title}</h1>
                    <p className="mt-2 text-secondary">{subtitle}</p>
                </div>
                {locked ? (
                    <Link to="/subscription" className="shrink-0 inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 dark:border-iv-dark-line px-4 py-2.5 text-sm font-semibold text-gray-900 dark:text-gray-100" title="Скачивание отчёта в PDF доступно в Pro">
                        <Lock className="w-4 h-4" /> PDF в Pro
                    </Link>
                ) : (
                    <Button type="button" variant="secondary" className="shrink-0 rounded-lg" loading={exporting} onClick={() => void handleExportPdf()}>
                        <Download className="w-4 h-4" /> Печать / PDF
                    </Button>
                )}
            </div>

            <motion.section
                className="iv-panel p-5 sm:p-8 grid gap-6 md:grid-cols-[12rem_1fr] md:gap-10 items-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="text-center">
                    <ScoreRing score={report.overall_score} />
                    <p className={`mt-3 text-sm font-semibold ${report.overall_score >= PASS_SCORE_THRESHOLD ? 'text-inter-verse-green dark:text-purple-400' : 'text-red-600 dark:text-red-400'}`}>
                        {getScoreLabel(report.overall_score)} · по шкале сервиса
                    </p>
                </div>
                <div className="min-w-0">
                    <p className="iv-eyebrow">Главный вывод</p>
                    <h2 className="mt-2 text-2xl sm:text-3xl font-bold leading-tight text-gray-900 dark:text-gray-100">
                        {headlineFirst}{headlineSecond && <><br />{headlineSecond}</>}
                    </h2>
                    {report.comments && (
                        <p className="mt-3 text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                            {report.comments.replace(/^\s*[-–—•*]\s+/gm, '')}
                        </p>
                    )}
                    <ScoreBars
                        className="mt-5"
                        theory={report.algorithm_score}
                        coding={report.coding_score}
                        theoryCorrect={report.theory_correct}
                        theoryTotal={report.theory_total}
                        taskTotal={report.task_total}
                    />
                    <p className="mt-5 text-xs text-secondary">
                        Архитектура и Soft Skills в тренировках пока не оцениваются. Балл не является прогнозом получения оффера.
                    </p>
                    {needsAnalysis && (
                        <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
                            <Button onClick={handleAnalyze} loading={analyzing} className="rounded-lg">
                                <Sparkles className="w-4 h-4" /> Проанализировать
                            </Button>
                            <span className="text-sm text-secondary">AI-анализ ещё не выполнен.</span>
                        </div>
                    )}
                </div>
            </motion.section>

            <div className="flex gap-6 overflow-x-auto border-b border-gray-200 dark:border-iv-dark-line" role="tablist">
                {tabs.map((item) => (
                    <button
                        key={item.key}
                        type="button"
                        role="tab"
                        aria-selected={tab === item.key}
                        onClick={() => setTab(item.key)}
                        className={`shrink-0 -mb-px pb-3 text-sm font-semibold border-b-2 transition-iv ${
                            tab === item.key
                                ? 'border-inter-verse-green text-inter-verse-green dark:border-purple-400 dark:text-purple-400'
                                : 'border-transparent text-secondary hover:text-gray-900 dark:hover:text-gray-100'
                        }`}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.65fr_1fr] items-start">
                <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="min-w-0">
                    {tab === 'errors' && (
                        locked
                            ? <WeakPointsSection locked count={weakCount} points={[]} />
                            : <ErrorList points={report.weak_points || []} />
                    )}
                    {tab === 'strengths' && <StrengthsTab report={report} locked={locked} />}
                    {tab === 'answers' && <QuestionGrid items={reviews} />}
                </motion.div>

                <div className="lg:sticky lg:top-0">
                    <FocusPlan
                        locked={locked && weakCount > 0}
                        groups={report.focus || []}
                        count={report.focus_count ?? 0}
                        description={locked ? 'План по ошибкам этой тренировки' : undefined}
                    />
                </div>
            </div>
        </PageTransition>
    )
}

type ReportTab = 'errors' | 'strengths' | 'answers'

function StrengthsTab({ report, locked }: { report: Report; locked: boolean }) {
    if (locked) {
        return (
            <section>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Сильные стороны</h2>
                <p className="mt-2 text-secondary">Сильные стороны и рекомендации интервьюера доступны в Pro.</p>
                <Link to="/subscription" className="mt-5 btn-primary-adaptive inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm">
                    Перейти на Pro
                </Link>
            </section>
        )
    }
    return (
        <section className="space-y-8">
            <div>
                <p className="iv-eyebrow">Из комментария интервьюера</p>
                <h2 className="mt-2 mb-4 text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Сильные стороны</h2>
                <AccentList text={report.strengths} />
            </div>
            {report.weaknesses && (
                <div>
                    <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">Над чем поработать</h3>
                    <AccentList text={report.weaknesses} />
                </div>
            )}
            {report.recommendations && (
                <div>
                    <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">Рекомендации</h3>
                    <AccentList text={report.recommendations} />
                </div>
            )}
        </section>
    )
}
