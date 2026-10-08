import { useState, useEffect, useMemo } from 'react'
import { ArrowRight, Download, Loader2, Lock, Search, Trash2 } from 'lucide-react'
import { api } from '../services/api'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import PageTransition from '../components/ui/PageTransition'
import Spinner from '../components/ui/Spinner'
import { downloadReportPdf } from '../lib/exportReportPdf'
import { usePersistedState } from '../hooks/usePersistedForm'
import { formatDay, levelLabel, pluralRu, specializationLabel, type ReportWithInterview } from '../lib/dashboard'

type Report = ReportWithInterview

const LEVEL_FILTERS = ['intern', 'junior', 'middle', 'senior', 'lead']

function reportTitle(report: Report) {
    const spec = specializationLabel(report.interview?.specialization)
    const level = levelLabel(report.interview?.level)
    return [spec, level].filter(Boolean).join(' · ') || report.interview?.title || 'Тренировка'
}

function clampScore(value: number | undefined) {
    return Math.max(0, Math.min(100, Math.round(value || 0)))
}

/** One-paragraph explanation under the latest headline, built from the numbers only. */
function insightText(report: Report) {
    const parts: string[] = []
    const tasks = report.task_total || 0
    if (tasks > 0) {
        parts.push(report.coding_passed || report.coding_score >= 60
            ? (tasks === 1 ? 'Задача решена.' : 'Задачи решены.')
            : `Практика — ${clampScore(report.coding_score)}%.`)
    }
    const total = report.theory_total || 0
    if (total > 0) {
        const correct = report.theory_correct || 0
        let line = `В теории — ${correct} ${pluralRu(correct, ['верный ответ', 'верных ответа', 'верных ответов'])} из ${total}`
        const topics = (report.focus ?? []).map((group) => group.title).slice(0, 2)
        if (topics.length > 0) line += `: начните с ${topics.join(' и ')}`
        parts.push(`${line}.`)
    }
    return parts.join(' ') || report.comments || 'Откройте отчёт, чтобы посмотреть разбор ответов.'
}

function statText(reports: Report[]) {
    if (reports.length < 2) {
        return 'Один отчёт — отправная точка. Сравнение появится после следующей тренировки.'
    }
    const diff = clampScore(reports[0].overall_score) - clampScore(reports[1].overall_score)
    if (diff === 0) return 'Итог последней тренировки совпал с предыдущей.'
    const points = `${Math.abs(diff)} ${pluralRu(Math.abs(diff), ['пункт', 'пункта', 'пунктов'])}`
    return diff > 0
        ? `Последняя тренировка на ${points} выше предыдущей.`
        : `Последняя тренировка на ${points} ниже предыдущей — повторите слабые темы.`
}

export default function ReportsPage() {
    const [reports, setReports] = useState<Report[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = usePersistedState('reports-search', '')
    const [levelFilter, setLevelFilter] = usePersistedState('reports-level', 'all')
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [exportingId, setExportingId] = useState<string | null>(null)

    useEffect(() => {
        fetchReports()
    }, [])

    const fetchReports = async () => {
        try {
            setLoading(true)
            const response = await api.get('/reports/')
            const reportsData: Report[] = response.data.reports || []
            reportsData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            setReports(reportsData)
        } catch {
            toast.error('Ошибка при загрузке отчётов')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (reportId: string) => {
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

    const handleExportPdf = async (report: Report) => {
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

    const filteredReports = useMemo(() => {
        const query = searchTerm.toLowerCase().trim()
        return reports.filter((report) => {
            if (levelFilter !== 'all' && report.interview?.level !== levelFilter) return false
            if (!query) return true
            const haystack = [
                report.interview?.title,
                report.interview?.specialization,
                specializationLabel(report.interview?.specialization),
                levelLabel(report.interview?.level),
                ...(report.technologies ?? []),
                ...(report.focus ?? []).map((group) => group.title),
            ].join(' ').toLowerCase()
            return haystack.includes(query)
        })
    }, [reports, searchTerm, levelFilter])

    const levels = useMemo(
        () => LEVEL_FILTERS.filter((level) => reports.some((report) => report.interview?.level === level)),
        [reports],
    )

    if (loading) return <Spinner size="lg" className="h-64" />

    const latest = reports[0]
    const practiceTech = latest?.technologies?.[0]

    return (
        <PageTransition>
            <header className="library-head">
                <div>
                    <span className="lib-eyebrow">Результаты / библиотека</span>
                    <h1>Ваши отчёты</h1>
                    <p>Сохраняйте сильные стороны. Превращайте ошибки в следующую тренировку.</p>
                </div>
                <Link to="/interviews/create" className="lib-btn is-primary">
                    + Новая тренировка <ArrowRight />
                </Link>
            </header>

            {!latest ? (
                <section className="collection-empty">
                    <h3>Отчётов пока нет</h3>
                    <p>Отчёт появится после завершения первой тренировки: с итогом, разбором ответов и темами для повторения.</p>
                    <div className="actions">
                        <Link to="/interviews/create" className="lib-btn is-primary">
                            Начать тренировку <ArrowRight />
                        </Link>
                    </div>
                </section>
            ) : (
                <>
                    <div className="library-intro">
                        <section className="library-insight">
                            <span className="lib-eyebrow">Последний вывод · {reportTitle(latest).replace(' · ', ' / ')}</span>
                            <h2>{latest.headline || 'Итоги последней тренировки.'}</h2>
                            <p>{insightText(latest)}</p>
                            <Link to={`/reports/${latest.id}`} className="lib-textbtn">
                                {latest.weak_points_count ? 'Отработать слабые темы →' : 'Открыть разбор →'}
                            </Link>
                        </section>
                        <aside className="library-stat">
                            <span className="lib-eyebrow">Завершено</span>
                            <strong>{String(reports.length).padStart(2, '0')}</strong>
                            <p>{statText(reports)}</p>
                        </aside>
                    </div>

                    <div className="list-controls">
                        <div className="search-wrap">
                            <Search aria-hidden="true" strokeWidth={1.75} />
                            <input
                                type="search"
                                aria-label="Поиск отчётов"
                                placeholder="Название, направление или технология"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <select
                            aria-label="Уровень отчётов"
                            value={levelFilter}
                            onChange={(e) => setLevelFilter(e.target.value)}
                        >
                            <option value="all">Все уровни</option>
                            {levels.map((level) => (
                                <option key={level} value={level}>{levelLabel(level)}</option>
                            ))}
                        </select>
                    </div>

                    <div className="collection-heading">
                        <h2>История тренировок <span>· {filteredReports.length}</span></h2>
                        <small>Сначала последние</small>
                    </div>

                    {filteredReports.length === 0 ? (
                        <section className="collection-empty">
                            <h3>Отчёты не найдены</h3>
                            <p>Попробуйте другое название, технологию или уровень.</p>
                            <div className="actions">
                                <button
                                    type="button"
                                    className="lib-textbtn"
                                    onClick={() => {
                                        setSearchTerm('')
                                        setLevelFilter('all')
                                    }}
                                >
                                    Сбросить фильтры
                                </button>
                            </div>
                        </section>
                    ) : (
                        <div className="report-list">
                            {filteredReports.map((report, index) => (
                                <ReportEntry
                                    key={report.id}
                                    report={report}
                                    index={index}
                                    exporting={exportingId === report.id}
                                    deleting={deletingId === report.id}
                                    onExport={() => void handleExportPdf(report)}
                                    onDelete={() => void handleDelete(report.id)}
                                />
                            ))}
                        </div>
                    )}

                    <section className="next-practice">
                        <div>
                            <h3>Дайте результату продолжение.</h3>
                            <p>Повторите темы из отчёта и проверьте себя в новой тренировке.</p>
                        </div>
                        <Link to="/interviews/create" className="lib-btn">
                            {practiceTech ? `Практика по ${practiceTech}` : 'Новая практика'} <ArrowRight />
                        </Link>
                    </section>
                </>
            )}
        </PageTransition>
    )
}

interface ReportEntryProps {
    report: Report
    index: number
    exporting: boolean
    deleting: boolean
    onExport: () => void
    onDelete: () => void
}

function ReportEntry({ report, index, exporting, deleting, onExport, onDelete }: ReportEntryProps) {
    const score = clampScore(report.overall_score)
    const theoryTotal = report.theory_total || 0
    const taskTotal = report.task_total || 0
    const showTheory = theoryTotal > 0 || taskTotal === 0
    const showPractice = taskTotal > 0 || theoryTotal === 0
    const weakCount = report.weak_points_count || 0
    const focus = report.focus ?? []
    const counts = [
        theoryTotal > 0 && `${theoryTotal} ${pluralRu(theoryTotal, ['вопрос', 'вопроса', 'вопросов'])}`,
        taskTotal > 0 && `${taskTotal} ${pluralRu(taskTotal, ['задача', 'задачи', 'задач'])}`,
    ].filter(Boolean).join(' · ')

    return (
        <article className="report-entry" style={{ '--i': index } as React.CSSProperties}>
            <aside className="report-mark">
                <div
                    className="score-ring"
                    style={{ '--score': `${score}%` } as React.CSSProperties}
                    aria-label={`Общий результат ${score} процентов`}
                >
                    <strong>{score}<span>%</span></strong>
                </div>
                <small>Итоговый результат</small>
            </aside>
            <div className="report-main">
                <header className="report-main-header">
                    <div>
                        <h3><Link to={`/reports/${report.id}`}>{reportTitle(report)}</Link></h3>
                        <div className="report-meta">
                            {(report.technologies ?? []).slice(0, 4).map((tech) => (
                                <span key={tech} className="lib-chip">{tech}</span>
                            ))}
                            <span>{formatDay(report.created_at)}</span>
                            {counts && <span>{counts}</span>}
                        </div>
                    </div>
                    <span className="lib-chip is-done">Завершено</span>
                </header>

                <div className="report-parts">
                    {showTheory && (
                        <div>
                            <div className="scoreline">
                                <span>Теория {theoryTotal > 0 && <span className="muted">· {report.theory_correct || 0} / {theoryTotal}</span>}</span>
                                <b>{clampScore(report.algorithm_score)}%</b>
                            </div>
                            <div className="lib-bar"><span style={{ width: `${clampScore(report.algorithm_score)}%` }} /></div>
                        </div>
                    )}
                    {showPractice && (
                        <div>
                            <div className="scoreline">
                                <span>Практика {taskTotal > 0 && <span className="muted">· {taskTotal} {pluralRu(taskTotal, ['задача', 'задачи', 'задач'])}</span>}</span>
                                <b>{clampScore(report.coding_score)}%</b>
                            </div>
                            <div className="lib-bar"><span style={{ width: `${clampScore(report.coding_score)}%` }} /></div>
                        </div>
                    )}
                </div>

                <div className="report-next">
                    {weakCount === 0 ? (
                        <span>Ошибок нет — закрепите результат новой тренировкой</span>
                    ) : report.locked ? (
                        <>
                            <span>{weakCount} {pluralRu(weakCount, ['ошибка', 'ошибки', 'ошибок'])}</span>
                            <Link to="/subscription">Темы для повторения — в Pro</Link>
                        </>
                    ) : (
                        <>
                            <span>
                                {weakCount} {pluralRu(weakCount, ['ошибка', 'ошибки', 'ошибок'])}
                                {focus.length > 0 && ` / ${focus.length} ${pluralRu(focus.length, ['группа', 'группы', 'групп'])} тем`}
                            </span>
                            {focus.slice(0, 4).map((group) => (
                                <span key={group.title} className="lib-chip">{group.title}</span>
                            ))}
                        </>
                    )}
                </div>

                <footer className="report-entry-footer">
                    <div className="side">
                        {report.locked ? (
                            <Link to="/subscription" className="quiet-action" title="Скачивание отчёта в PDF доступно в Pro">
                                <Lock /> PDF в Pro
                            </Link>
                        ) : (
                            <button type="button" className="quiet-action" disabled={exporting} onClick={onExport}>
                                {exporting ? <Loader2 className="animate-spin" /> : <Download />} Скачать PDF
                            </button>
                        )}
                        <button
                            type="button"
                            className="quiet-action is-danger"
                            disabled={deleting}
                            onClick={onDelete}
                            aria-label="Удалить отчёт"
                        >
                            {deleting ? <Loader2 className="animate-spin" /> : <Trash2 />} Удалить
                        </button>
                    </div>
                    <Link to={`/reports/${report.id}`} className="lib-btn is-primary">
                        Разобрать результат <ArrowRight />
                    </Link>
                </footer>
            </div>
        </article>
    )
}
