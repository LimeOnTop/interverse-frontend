import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Search } from 'lucide-react'
import { api } from '../services/api'
import {
    startInterviewSession,
    formatSessionStartError,
} from '../lib/interviewSession'
import toast from 'react-hot-toast'
import PageTransition from '../components/ui/PageTransition'
import Spinner from '../components/ui/Spinner'
import { usePersistedState } from '../hooks/usePersistedForm'
import { formatDay, levelLabel, pluralRu, specializationLabel } from '../lib/dashboard'

interface Interview {
    id: string
    title: string
    description?: string
    status: string
    level: string
    specialization: string
    tech_stack?: string
    technologies?: string[]
    created_at: string
    scheduled_at?: string
}

interface ReportRef {
    id: string
    score: number
    theoryTotal: number
    taskTotal: number
}

type Scope = 'all' | 'active' | 'done'

const STATUS_LABELS: Record<string, string> = {
    scheduled: 'Не начата',
    in_progress: 'В процессе',
    completed: 'Завершена',
    cancelled: 'Отменена',
}

const isActive = (interview: Interview) => interview.status === 'scheduled' || interview.status === 'in_progress'
const isDone = (interview: Interview) => interview.status === 'completed'

function technologiesOf(interview: Interview): string[] {
    if (interview.technologies?.length) return interview.technologies
    if (!interview.tech_stack || interview.tech_stack === 'null') return []
    try {
        const parsed = JSON.parse(interview.tech_stack)
        return Array.isArray(parsed) ? parsed.map(String) : parsed ? [String(parsed)] : []
    } catch {
        return [interview.tech_stack]
    }
}

function sessionTitle(interview: Interview) {
    const role = [specializationLabel(interview.specialization), levelLabel(interview.level)].filter(Boolean).join(' · ')
    return role || interview.title || 'Тренировка'
}

/** Two letters for the card mark: first technology, else the direction. */
function monogram(interview: Interview) {
    const source = technologiesOf(interview)[0] || specializationLabel(interview.specialization) || interview.title || '?'
    const letters = source.replace(/[^\p{L}\p{N}]/gu, '')
    return (letters.charAt(0).toUpperCase() + letters.charAt(1).toLowerCase()) || '{ }'
}

export default function InterviewServicePage() {
    const navigate = useNavigate()
    const [interviews, setInterviews] = useState<Interview[]>([])
    const [reports, setReports] = useState<Record<string, ReportRef>>({})
    const [loading, setLoading] = useState(true)
    const [startingId, setStartingId] = useState<string | null>(null)
    const [scope, setScope] = usePersistedState<Scope>('sessions-scope', 'all')
    const [query, setQuery] = usePersistedState('sessions-search', '')

    useEffect(() => {
        let alive = true
        Promise.all([
            api.get('/interviews/', { params: { limit: 100 } }),
            api.get('/reports/', { params: { limit: 100 } }).catch(() => null),
        ])
            .then(([interviewsResponse, reportsResponse]) => {
                if (!alive) return
                setInterviews(interviewsResponse.data.interviews || [])
                const map: Record<string, ReportRef> = {}
                for (const report of reportsResponse?.data.reports || []) {
                    if (!report.interview_id || map[report.interview_id]) continue
                    map[report.interview_id] = {
                        id: report.id,
                        score: Math.max(0, Math.min(100, Math.round(report.overall_score || 0))),
                        theoryTotal: report.theory_total || 0,
                        taskTotal: report.task_total || 0,
                    }
                }
                setReports(map)
            })
            .catch(() => {
                if (alive) toast.error('Ошибка при загрузке тренировок')
            })
            .finally(() => {
                if (alive) setLoading(false)
            })
        return () => { alive = false }
    }, [])

    const handleStart = async (interview: Interview) => {
        try {
            setStartingId(interview.id)
            await startInterviewSession(api, interview.id)
            toast.success('Тренировка запущена!')
            navigate(`/interview/${interview.id}`)
        } catch (error) {
            console.error('Error starting session:', error)
            toast.error(formatSessionStartError(error))
        } finally {
            setStartingId(null)
        }
    }

    // Unfinished first, then newest.
    const sorted = useMemo(
        () => [...interviews].sort((a, b) => {
            const rank = Number(isActive(b)) - Number(isActive(a))
            return rank || new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        }),
        [interviews],
    )

    const counts = useMemo(() => ({
        all: interviews.length,
        active: interviews.filter(isActive).length,
        done: interviews.filter(isDone).length,
    }), [interviews])

    const visible = useMemo(() => {
        const needle = query.toLocaleLowerCase('ru').trim()
        return sorted.filter((interview) => {
            if (scope === 'active' && !isActive(interview)) return false
            if (scope === 'done' && !isDone(interview)) return false
            if (!needle) return true
            return [
                interview.title,
                specializationLabel(interview.specialization),
                levelLabel(interview.level),
                ...technologiesOf(interview),
            ].join(' ').toLocaleLowerCase('ru').includes(needle)
        })
    }, [sorted, scope, query])

    if (loading) return <Spinner size="lg" className="h-64" />

    const pad = (value: number) => String(value).padStart(2, '0')
    const waiting = counts.active
    const scopes: [Scope, string, number][] = [
        ['all', 'Все', counts.all],
        ['active', 'В процессе', counts.active],
        ['done', 'Завершённые', counts.done],
    ]

    return (
        <PageTransition className="practice-library">
            <header className="library-head">
                <div>
                    <span className="lib-eyebrow">Практика / ваша библиотека</span>
                    <h1>Ваши тренировки</h1>
                    <p>Каждая попытка — шаг к уверенному ответу.</p>
                </div>
                <Link to="/interviews/create" className="lib-btn is-primary">+ Новая тренировка</Link>
            </header>

            <div className="session-overview">
                <section className="session-feature">
                    <span className="lib-eyebrow">{waiting > 0 ? 'Вернитесь к практике' : 'Следующий шаг'}</span>
                    {waiting > 0 ? (
                        <>
                            <h2>Начатое можно<br />продолжить.</h2>
                            <p>
                                {waiting} {pluralRu(waiting, ['тренировка ждёт', 'тренировки ждут', 'тренировок ждут'])} вашего
                                возвращения. Выберите нужную ниже или начните подготовку под новую роль.
                            </p>
                        </>
                    ) : (
                        <>
                            <h2>Начните новую<br />тренировку.</h2>
                            <p>
                                {counts.all > 0
                                    ? 'Незавершённых тренировок нет. Выберите роль и стек — вопросы и задачи подберутся под них.'
                                    : 'Выберите роль и стек — вопросы и задачи подберутся под них.'}
                            </p>
                        </>
                    )}
                    <Link to="/interviews/create" className="lib-btn">Выбрать новую роль</Link>
                </section>
                <aside className="session-summary">
                    <div>
                        <span className="lib-eyebrow">Ваш ритм</span>
                        <h2>Практика в удобном темпе</h2>
                    </div>
                    <div className="session-numbers">
                        <div><strong>{pad(counts.all)}</strong><small>Всего тренировок</small></div>
                        <div><strong>{pad(counts.active)}</strong><small>В процессе</small></div>
                        <div><strong>{pad(counts.done)}</strong><small>{pluralRu(counts.done, ['Завершена', 'Завершены', 'Завершено'])}</small></div>
                    </div>
                </aside>
            </div>

            <div className="session-toolbar">
                <div className="session-filters" role="group" aria-label="Статус тренировок">
                    {scopes.map(([id, title, count]) => (
                        <button key={id} type="button" aria-pressed={scope === id} onClick={() => setScope(id)}>
                            {title}<span>{count}</span>
                        </button>
                    ))}
                </div>
                <div className="search-wrap session-search">
                    <Search aria-hidden="true" strokeWidth={1.75} />
                    <input
                        type="search"
                        aria-label="Поиск тренировок"
                        placeholder="Название или технология"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="collection-heading">
                <h2>Библиотека <span>· <span aria-live="polite">{visible.length}</span></span></h2>
                <small>Сначала незавершённые</small>
            </div>

            {visible.length === 0 ? (
                <section className="collection-empty">
                    {counts.all === 0 ? (
                        <>
                            <h3>Тренировок пока нет</h3>
                            <p>Создайте первую тренировку: выберите направление, уровень и технологии.</p>
                            <div className="actions">
                                <Link to="/interviews/create" className="lib-btn is-primary">Начать тренировку <ArrowRight /></Link>
                            </div>
                        </>
                    ) : (
                        <>
                            <h3>Тренировки не найдены</h3>
                            <p>Измените запрос или выберите другой статус.</p>
                            <div className="actions">
                                <button type="button" className="lib-btn" onClick={() => { setScope('all'); setQuery('') }}>
                                    Сбросить фильтры
                                </button>
                            </div>
                        </>
                    )}
                </section>
            ) : (
                <div className="session-cards">
                    {visible.map((interview) => (
                        <SessionCard
                            key={interview.id}
                            interview={interview}
                            report={reports[interview.id]}
                            starting={startingId === interview.id}
                            busy={startingId !== null}
                            onStart={() => void handleStart(interview)}
                        />
                    ))}
                </div>
            )}

            <footer className="session-footnote">
                <span>Результаты завершённых тренировок доступны в отчётах.</span>
                <Link to="/reports" className="lib-textbtn">Все отчёты <ArrowRight /></Link>
            </footer>
        </PageTransition>
    )
}

interface SessionCardProps {
    interview: Interview
    report?: ReportRef
    starting: boolean
    busy: boolean
    onStart: () => void
}

function SessionCard({ interview, report, starting, busy, onStart }: SessionCardProps) {
    const done = isDone(interview)
    const techs = technologiesOf(interview)
    const statusClass = done ? 'is-done' : isActive(interview) ? 'is-pending' : ''
    const counts = report && [
        report.theoryTotal > 0 && `${report.theoryTotal} ${pluralRu(report.theoryTotal, ['вопрос', 'вопроса', 'вопросов'])}`,
        report.taskTotal > 0 && `${report.taskTotal} ${pluralRu(report.taskTotal, ['задача', 'задачи', 'задач'])}`,
    ].filter(Boolean).join(' · ')

    let bottom = 'Вернитесь к тренировке, когда будет удобно'
    if (done) bottom = report ? [counts, 'отчёт готов'].filter(Boolean).join(' · ') : 'Отчёт формируется'
    else if (interview.status === 'scheduled') bottom = 'Вопросы и задачи подобраны — можно начинать'
    else if (interview.status === 'cancelled') bottom = 'Тренировка отменена'

    return (
        <article className="session-card">
            <div className="session-monogram" aria-hidden="true">{done ? '✓' : monogram(interview)}</div>
            <div className="session-card-body">
                <div className="session-card-heading">
                    <h3>{sessionTitle(interview)}</h3>
                    <span className={`lib-chip ${statusClass}`}>{STATUS_LABELS[interview.status] || interview.status}</span>
                </div>
                <div className="session-card-meta">
                    {techs.slice(0, 4).map((tech) => <span key={tech} className="session-tech">{tech}</span>)}
                    {techs.length > 4 && <span className="session-tech">+{techs.length - 4}</span>}
                    <span>{formatDay(interview.created_at)}</span>
                </div>
                <p className="session-card-bottom">{bottom}</p>
            </div>
            <div className="session-card-actions">
                {done ? (
                    report ? (
                        <>
                            <div className="session-result">
                                <strong>{report.score}%</strong>
                                <small>Итоговая оценка</small>
                            </div>
                            <Link to={`/reports/${report.id}`} className="lib-btn">Открыть отчёт</Link>
                        </>
                    ) : (
                        <Link to="/reports" className="lib-btn">К отчётам</Link>
                    )
                ) : interview.status === 'in_progress' ? (
                    <Link to={`/interview/${interview.id}`} className="lib-btn">Продолжить <ArrowRight /></Link>
                ) : interview.status === 'scheduled' ? (
                    <button type="button" className="lib-btn is-primary" disabled={busy} onClick={onStart}>
                        {starting ? 'Запуск…' : 'Начать'} <ArrowRight />
                    </button>
                ) : null}
            </div>
        </article>
    )
}
