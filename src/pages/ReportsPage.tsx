import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FileText, Search, Download, Eye, Trash2, Loader2, Lock } from 'lucide-react'
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
import SectionScoreBadge from '../components/report/SectionScoreBadge'
import { buildReportSections, getScoreLabel, getScoreVariant } from '../lib/reportScores'
import type { GeneratedReport } from '../lib/reportAnalysis'
import { downloadReportPdf } from '../lib/exportReportPdf'
import { usePersistedState } from '../hooks/usePersistedForm'

interface Report extends GeneratedReport {
    interview: {
        id: string
        title: string
        specialization: string
        level: string
    }
}

export default function ReportsPage() {
    const [reports, setReports] = useState<Report[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = usePersistedState('reports-search', '')
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [exportingId, setExportingId] = useState<string | null>(null)

    useEffect(() => {
        fetchReports()
    }, [])

    const fetchReports = async () => {
        try {
            setLoading(true)
            const response = await api.get('/reports/')
            const reportsData = response.data.reports || []
            setReports(reportsData)
        } catch {
            toast.error('Ошибка при загрузке отчётов')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (reportId: string, event: React.MouseEvent) => {
        event.preventDefault()
        event.stopPropagation()
        if (!window.confirm('Удалить этот отчёт?')) {
            return
        }

        try {
            setDeletingId(reportId)
            await api.delete(`/reports/${reportId}`)
            setReports((prev) => prev.filter((report) => report.id !== reportId))
            toast.success('Отчёт удалён')
        } catch (error) {
            console.error('Error deleting report:', error)
            toast.error('Не удалось удалить отчёт')
        } finally {
            setDeletingId(null)
        }
    }

    const handleExportPdf = async (report: Report, event: React.MouseEvent) => {
        event.preventDefault()
        event.stopPropagation()
        try {
            setExportingId(report.id)
            // List endpoint may omit answer reviews — fetch full report when needed.
            let payload: Report = report
            if (!report.answer_reviews?.length) {
                const { data } = await api.get(`/reports/${report.id}`)
                if (data?.report) payload = data.report
            }
            await downloadReportPdf(payload)
            toast.success('PDF скачан')
        } catch (error) {
            console.error('PDF export failed:', error)
            toast.error('Не удалось сформировать PDF')
        } finally {
            setExportingId(null)
        }
    }

    const filteredReports = reports.filter((report) =>
        report.interview?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.interview?.specialization?.toLowerCase().includes(searchTerm.toLowerCase()),
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
        <PageTransition className="space-y-6 sm:space-y-8">
            <PageHeader
                title="Отчёты"
                description="Результаты проведённых интервью"
            />

            <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" strokeWidth={1.75} />
                    <input
                        type="text"
                        placeholder="Поиск по названию тренировки или специализации..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="iv-search"
                    />
            </div>

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
                        {filteredReports.map((report, index) => {
                            const sections = buildReportSections(report)

                            return (
                                <motion.div
                                    key={report.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05, duration: 0.4 }}
                                >
                                    <Card hover padding="md">
                                        <div className="flex items-start gap-4 mb-5 sm:mb-6">
                                            <div className="shrink-0 text-center w-16 sm:w-20">
                                                <div className="text-3xl sm:text-4xl font-bold tabular-nums leading-none text-inter-verse-green dark:text-purple-400">
                                                    {report.overall_score}%
                                                </div>
                                                <Badge variant={getScoreVariant(report.overall_score)} className="mt-2 text-[10px] px-1.5">
                                                    {getScoreLabel(report.overall_score)}
                                                </Badge>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-base sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-1 sm:mb-2 leading-snug">
                                                    {report.interview?.title || 'Тренировка'}
                                                </h3>
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-secondary">
                                                    <span>{getSpecializationLabel(report.interview?.specialization || '')} · {getLevelLabel(report.interview?.level || '')}</span>
                                                    <span>{new Date(report.created_at).toLocaleDateString('ru-RU')}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-3 gap-y-3 mb-5 sm:mb-6">
                                            {sections.map((section) => (
                                                <div key={section.key} className="flex flex-col items-start sm:items-center">
                                                    <p className="text-[11px] font-medium uppercase tracking-wide text-secondary mb-1">{section.name}</p>
                                                    <SectionScoreBadge section={section} />
                                                </div>
                                            ))}
                                        </div>

                                        {report.comments && (
                                            <div className="mb-4">
                                                <h4 className="text-xs font-medium uppercase tracking-wide text-secondary mb-2">{report.locked ? 'Общий отзыв' : 'Комментарии'}</h4>
                                                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3 sm:line-clamp-none">{report.comments}</p>
                                            </div>
                                        )}

                                        {report.recommendations && (
                                            <div className="mb-4 hidden sm:block">
                                                <h4 className="text-xs font-medium uppercase tracking-wide text-secondary mb-2">Рекомендации</h4>
                                                <p className="text-sm text-gray-700 dark:text-gray-300">{report.recommendations}</p>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between gap-2 pt-4 iv-divider">
                                            <div className="flex items-center gap-2 sm:gap-3 flex-1 sm:flex-none">
                                                <Link to={`/reports/${report.id}`} className="flex-1 sm:flex-none">
                                                    <Button className="text-sm px-4 py-2 w-full">
                                                        <Eye className="w-4 h-4" /> Подробнее
                                                    </Button>
                                                </Link>
                                                {report.locked ? (
                                                    <Link
                                                        to="/subscription"
                                                        className="btn-secondary inline-flex items-center gap-2 text-sm px-4 py-2"
                                                        title="Скачивание отчёта в PDF доступно в Pro"
                                                    >
                                                        <Lock className="w-4 h-4" /> PDF в Pro
                                                    </Link>
                                                ) : (
                                                    <Button
                                                        type="button"
                                                        variant="secondary"
                                                        className="text-sm px-4 py-2"
                                                        loading={exportingId === report.id}
                                                        onClick={(e) => void handleExportPdf(report, e)}
                                                    >
                                                        <Download className="w-4 h-4" /> PDF
                                                    </Button>
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={(e) => void handleDelete(report.id, e)}
                                                disabled={deletingId === report.id}
                                                className="btn-icon w-9 h-9 hover:text-red-500 dark:hover:text-red-500 disabled:opacity-50"
                                                aria-label="Удалить отчёт"
                                            >
                                                {deletingId === report.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                    </Card>
                                </motion.div>
                            )
                        })}
                    </div>
                )}
            </section>
        </PageTransition>
    )
}
