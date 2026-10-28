import ReportDisclosure from './report/ReportDisclosure'
import { instantMotion } from '../lib/motion'
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Archive, Check, ChevronDown, ExternalLink, Loader2, Pencil, Play, RotateCcw } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '../services/api'
import { startInterviewSession, formatSessionStartError } from '../lib/interviewSession'
import { stepResults, type Preparation, type PreparationsState } from '../lib/preparations'
import type { ReportWithInterview } from '../lib/dashboard'
import { levelLabel, formatDay, pluralRu } from '../lib/dashboard'
import { isTrainingLimitError } from '../store/promoStore'
import { reminderChanged } from '../lib/practiceReminders'
import { ReminderButton } from './PracticeReminderDialog'
import PreparationCreateDialog from './PreparationCreateDialog'
import '../styles/vacancy-path.css'

export function PreparationSection({ data, mode = 'training', query = '', scope = 'all', level = 'all' }: { data: PreparationsState; mode?: 'dashboard' | 'training' | 'reports'; query?: string; scope?: string; level?: string }) {
    const { preparations, reports, error, loading, reload } = data
    const [showArchived, setShowArchived] = useState(false)
    const location = useLocation()
    const requested = new URLSearchParams(location.search).get('preparation')
    if (error) return <section className="vp-notice" role="status">{error} <button onClick={() => void reload()}>Повторить</button></section>
    if (loading) return <p className="vp-muted" role="status">Загружаем подготовки по вакансиям…</p>
    const archivedCount = preparations.filter(item => item.archived).length
    const visible = preparations.filter(item => {
        const done = item.steps.every((_, index) => item.attempts.some(attempt => attempt.step_index === index && attempt.status === 'completed'))
        return (!item.archived || showArchived || requested === item.id) && (scope !== 'done' || done) && (scope !== 'active' || !done) && (level === 'all' || item.level === level) && [item.title, item.company, ...item.steps.map(step => step.technology)].join(' ').toLowerCase().includes(query.trim().toLowerCase())
    })
    if (!visible.length && !archivedCount && !preparations.length) return null
    return <section className="vp-section" aria-label={mode === 'reports' ? 'Отчёты по вакансиям' : 'Подготовка по вакансиям'}><div className="vp-section-title"><h2>{mode === 'reports' ? 'Отчёты по вакансиям' : 'Подготовка по вакансиям'} <span>· {visible.length}</span></h2>{archivedCount > 0 && <button className="vp-archive-toggle" aria-pressed={showArchived} onClick={() => setShowArchived(value => !value)}>{showArchived ? 'Скрыть архив' : `Архив · ${archivedCount}`}</button>}</div>{visible.map(item => <VacancyPreparationCard key={item.id} preparation={item} reports={reports} mode={mode} onReload={reload} />)}{!visible.length && <p className="vp-muted">{query || level !== 'all' ? 'По этим фильтрам подготовок не найдено.' : 'Активных подготовок нет. Архив можно раскрыть выше.'}</p>}</section>
}
function VacancyPreparationCard({ preparation: preparation, reports, mode, onReload }: { preparation: Preparation; reports: ReportWithInterview[]; mode: string; onReload: () => Promise<void> }) {
    const location = useLocation()
    const navigate = useNavigate()
    const requested = new URLSearchParams(location.search).get('preparation') === preparation.id
    const [expanded, setExpanded] = useState(requested)
    const [editing, setEditing] = useState(false)
    const [busy, setBusy] = useState<number | null>(null)
    const [archiving, setArchiving] = useState(false)
    const pending = useRef<Record<number, string>>({})
    const lock = useRef(false)
    const passed = preparation.steps.filter((_, index) => stepResults(preparation, index, reports).passed).length
    useEffect(() => { if (requested) setExpanded(true) }, [requested])
    async function start(index: number) {
        if (lock.current) return
        lock.current = true; setBusy(index)
        try {
            const request = pending.current[index] ?? crypto.randomUUID(); pending.current[index] = request
            const { data } = await api.post(`/preparations/${preparation.id}/steps/${index}/prepare`, { request_id: request })
            if (!data.interview_id) throw new Error('Не удалось создать тренировку')
            await startInterviewSession(api, data.interview_id); delete pending.current[index]; reminderChanged(); navigate(`/interview/${data.interview_id}`)
        } catch (error) { if (!isTrainingLimitError(error)) toast.error(formatSessionStartError(error)); await onReload() }
        finally { lock.current = false; setBusy(null) }
    }
    async function archive() {
        if (archiving) return
        setArchiving(true)
        try {
            await api.post(`/preparations/${preparation.id}/archive`, { revision: preparation.revision || 0, archived: !preparation.archived })
            reminderChanged(); await onReload()
            toast.success(preparation.archived ? 'Подготовка восстановлена. Попытка не списана.' : 'Подготовка в архиве. Планы её этапов отменены; отчёты сохранены.')
        } catch (error) { toast.error(formatSessionStartError(error)) }
        finally { setArchiving(false) }
    }
    const controls = (index: number) => !preparation.archived && <ReminderButton target={{ kind: 'preparation', target_id: preparation.id, step_index: index, title: preparation.steps[index].technology + ' · ' + preparation.title }} />
    return <article className={`vp-card ${preparation.archived ? 'is-archived' : ''}`} id={`preparation-${preparation.id}`}>
        <header className="vp-head"><span className="vp-mark" aria-hidden>{(preparation.company || preparation.title).slice(0, 2).toUpperCase()}</span><div><span className="vp-label">{preparation.archived ? 'В архиве · подготовка по вакансии' : 'Подготовка по вакансии'}</span><h3>{preparation.title}</h3><p>{[preparation.company, levelLabel(preparation.level), `${preparation.steps.length} ${pluralRu(preparation.steps.length, ['технология', 'технологии', 'технологий'])}`].filter(Boolean).join(' · ')}</p></div><button className="vp-expand" aria-expanded={expanded} aria-controls={`vp-${preparation.id}-${mode}`} onClick={() => setExpanded(value => !value)}>{expanded ? 'Свернуть' : mode === 'reports' ? 'Отчёты по этапам' : 'Открыть путь'}<ChevronDown size={16} className={expanded ? 'vp-rotated' : ''} /></button></header>
        <div className="vp-summary"><div className="vp-mini" aria-label={`${passed} из ${preparation.steps.length} этапов засчитано`}>{preparation.steps.map((step, index) => <span key={step.id || index} title={step.technology} className={stepResults(preparation, index, reports).passed ? 'is-passed' : ''}>{stepResults(preparation, index, reports).passed ? <Check size={14} /> : index + 1}</span>)}</div><small>{passed} из {preparation.steps.length} этапов засчитано</small></div>
        <ReportDisclosure open={expanded} instant={instantMotion()}><div className="vp-content" id={`vp-${preparation.id}-${mode}`}><div className="vp-instructions"><h4>{mode === 'reports' ? 'Результаты по технологиям' : 'Ваш путь к собеседованию'}</h4><p>Для зачёта нужно больше 80%. Сохраняем лучший результат.</p><small>Вся подготовка — одна попытка, включая повторы. Теория · около 10 минут на этап.</small></div>
            {mode === 'reports' ? <div>{preparation.steps.map((step, index) => {
                const result = stepResults(preparation, index, reports)
                const requestedStage = new URLSearchParams(location.search).get('stage')
                return <details className="vp-report-step" key={step.id || index} open={requested && result.attempts.some(attempt => attempt.interview_id === requestedStage)}><summary><span className={`vp-node ${result.passed ? 'is-passed' : ''}`}>{result.passed ? <Check size={16} /> : index + 1}</span><span className="vp-report-name">{step.technology}<small>{result.results.length ? `${result.results.length} ${pluralRu(result.results.length, ['отчёт', 'отчёта', 'отчётов'])}` : result.active ? 'Тренировка не завершена' : 'Пока нет отчёта'}</small></span><span>{result.best !== null ? `${Math.round(result.best)}%` : ''}</span><ChevronDown size={16} /></summary><div className="vp-report-body">{result.results.length ? <><p>{result.passed ? 'Этап засчитан. Можно перейти к следующей технологии.' : 'Повторите сложные темы: для зачёта нужно больше 80%.'}</p>{result.results.map(report => <div className="vp-attempt" key={report.id}><div><b>{Math.round(report.overall_score)}%</b><small>{formatDay(report.created_at)} · {report.overall_score > 80 ? 'Засчитано' : 'Стоит повторить'}</small></div><Link className="vp-btn primary" to={`/reports/${report.id}?preparation=${preparation.id}`}>Открыть полный отчёт</Link></div>)}</> : <p>{result.active ? 'Завершите тренировку, чтобы получить отчёт.' : 'Пройдите этап, чтобы увидеть результат и разбор ответов.'}</p>}{!preparation.archived && <div className="vp-actions"><button className="vp-btn" disabled={busy !== null} onClick={() => void start(index)}>{busy === index && <Loader2 size={16} className="animate-spin" />}{result.active ? 'Продолжить тренировку' : result.results.length ? 'Повторить этап' : 'Начать этап'}</button>{controls(index)}</div>}</div></details>
            })}</div> : <ol className="vp-path">{preparation.steps.map((step, index) => {
                const result = stepResults(preparation, index, reports)
                return <li key={step.id || index}><span className={`vp-node ${result.passed ? 'is-passed' : ''}`}>{result.passed ? <Check size={17} /> : String(index + 1).padStart(2, '0')}</span><div className={`vp-step ${result.passed ? 'is-complete' : ''}`}><div className="vp-step-title"><h4>{step.technology}</h4><span>{result.passed ? `${Math.round(result.best!)}% · Засчитано` : result.active ? 'В процессе' : result.best !== null ? `${Math.round(result.best)}% · Стоит повторить` : 'Не начато'}</span></div><p>Теория · {levelLabel(preparation.level)}</p><div className="vp-actions">{!preparation.archived && <><button className="vp-btn" disabled={busy !== null} onClick={() => void start(index)}>{busy === index ? <Loader2 size={16} className="animate-spin" /> : <Play size={14} />}{result.active ? 'Продолжить' : result.attempts.some(attempt => attempt.status === 'completed') ? 'Повторить этап' : 'Начать этап'}</button>{controls(index)}</>}{result.results.length > 0 && <Link className="vp-link" to={`/reports/${result.results[0].id}?preparation=${preparation.id}`}>Отчёт по этапу →</Link>}</div></div></li>
            })}</ol>}
            <div className="vp-manage mt-5"><button className="vp-btn" disabled={archiving} onClick={event => { event.currentTarget.focus(); setEditing(true) }}><Pencil size={14} />Изменить подготовку</button><button className="vp-btn" disabled={archiving} onClick={() => void archive()}>{preparation.archived ? <RotateCcw size={14} /> : <Archive size={14} />}{preparation.archived ? 'Восстановить' : 'В архив'}</button></div>
        </div></ReportDisclosure>
        <footer className="vp-footer"><span>{preparation.archived ? 'Отчёты сохранены. После восстановления этапы снова доступны.' : mode === 'reports' ? 'Полный разбор открывается в обычном отчёте этапа' : 'Все этапы доступны независимо друг от друга'}</span>{preparation.url && <a href={preparation.url} target="_blank" rel="noopener noreferrer">Исходная вакансия <ExternalLink size={12} /></a>}</footer>
        {editing && <PreparationCreateDialog preparation={preparation} onClose={() => setEditing(false)} onSaved={onReload} />}
    </article>
}
