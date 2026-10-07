import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Check, Code2, Plus } from 'lucide-react'
import { api } from '../services/api'
import DailyActivityBlock from '../components/DailyActivityBlock'
import Spinner from '../components/ui/Spinner'
import PageTransition from '../components/ui/PageTransition'
import ScoreBars from '../components/report/ScoreBars'
import FocusPlan from '../components/report/FocusPlan'
import { useAuthStore } from '../store/authStore'
import {
    formatDay,
    levelLabel,
    pluralRu,
    specializationLabel,
    useDashboardSummary,
    type ReportWithInterview,
} from '../lib/dashboard'

interface Interview {
    id: string
    title: string
    status: string
    level: string
    specialization: string
    tech_stack?: string
    technologies?: string[]
    created_at: string
    scheduled_at?: string
}

const STATUS_LABELS: Record<string, string> = {
    scheduled: 'Запланирована',
    in_progress: 'В процессе',
    completed: 'Завершено',
    cancelled: 'Отменена',
}

function technologiesOf(interview: Interview): string[] {
    if (interview.technologies?.length) return interview.technologies
    if (!interview.tech_stack || interview.tech_stack === 'null') return []
    try {
        const parsed = JSON.parse(interview.tech_stack)
        return Array.isArray(parsed) ? parsed : parsed ? [String(parsed)] : []
    } catch {
        return [interview.tech_stack]
    }
}

function firstSentences(text: string, limit = 180) {
    const clean = text.replace(/^\s*[-–—•*]\s+/gm, '').replace(/\s+/g, ' ').trim()
    if (clean.length <= limit) return clean
    const cut = clean.slice(0, limit)
    const end = cut.lastIndexOf('. ')
    return end > 60 ? cut.slice(0, end + 1) : `${cut.trimEnd()}…`
}

export default function DashboardPage() {
    const user = useAuthStore((state) => state.user)
    const { summary, loading } = useDashboardSummary()
    const [interviews, setInterviews] = useState<Interview[]>([])
    const [reportByInterview, setReportByInterview] = useState<Record<string, string>>({})

    useEffect(() => {
        api.get('/interviews/', { params: { limit: 50 } })
            .then((response) => setInterviews(response.data.interviews || []))
            .catch(() => setInterviews([]))
        api.get('/reports/', { params: { limit: 100 } })
            .then((response) => {
                const map: Record<string, string> = {}
                for (const report of response.data.reports || []) {
                    if (report.interview_id && !map[report.interview_id]) map[report.interview_id] = report.id
                }
                setReportByInterview(map)
            })
            .catch(() => setReportByInterview({}))
    }, [])

    const recent = useMemo(
        () => [...interviews]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 5),
        [interviews],
    )

    if (loading) return <Spinner size="lg" className="h-64" />

    const report = summary?.last_report ?? null
    const isPro = summary?.plan === 'paid'
    const firstName = (user?.name || '').split(' ')[0]
    const target = report?.interview
        ? `${specializationLabel(report.interview.specialization)} ${levelLabel(report.interview.level)}`
        : recent[0]
            ? `${specializationLabel(recent[0].specialization)} ${levelLabel(recent[0].level)}`
            : ''

    const quota = summary?.quota
    const quotaCaption = !quota ? undefined : quota.period === 'day' ? (
        <>Создано тренировок сегодня.<br />Дневной лимит Pro — {quota.limit}.</>
    ) : (
        <>
            Тренировки тарифа Basic.{' '}
            <Link to="/subscription" className="font-medium text-inter-verse-green dark:text-purple-400 underline underline-offset-2">
                Больше тренировок в Pro
            </Link>
        </>
    )

    return (
        <PageTransition className="space-y-6 sm:space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                        {firstName ? `С возвращением, ${firstName}` : 'С возвращением'}
                    </h1>
                    <p className="mt-2 text-secondary">
                        {target ? `Продолжайте подготовку к ${target}.` : 'Начните первую тренировку под свой стек.'}
                    </p>
                </div>
                <Link to="/interviews/create" className="btn-primary-adaptive hidden sm:inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm">
                    <Plus className="w-4 h-4" /> Новая тренировка <ArrowRight className="w-4 h-4" />
                </Link>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.65fr_1fr]">
                <HeroPanel report={report} />
                <LastResultPanel report={report} />
            </div>

            {quota && (
                <DailyActivityBlock completedToday={quota.used} dailyNorm={quota.limit} caption={quotaCaption} />
            )}

            {summary && (
                <div className="iv-panel grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-200 dark:divide-gray-600">
                    <Metric label="Завершено тренировок" value={summary.trainings.completed} hint="За всё время" />
                    <Metric label="Тренировок в процессе" value={summary.trainings.in_progress} hint="Можно продолжить" />
                    <Metric
                        label="Ошибок для разбора"
                        value={report?.weak_points_count ?? 0}
                        hint={report ? 'В последнем отчёте' : 'Пока нет отчётов'}
                    />
                </div>
            )}

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.65fr_1fr] items-start">
                <section className="iv-panel p-5 sm:p-6">
                    <div className="flex items-center justify-between gap-3 pb-4 border-b border-gray-200 dark:border-gray-600">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Ваши тренировки</h2>
                        <Link to="/interview-service" className="text-sm font-semibold text-inter-verse-green dark:text-purple-400 hover:underline">
                            Все тренировки →
                        </Link>
                    </div>
                    {recent.length === 0 ? (
                        <div className="py-8 text-center">
                            <p className="text-secondary mb-4">Тренировок пока нет.</p>
                            <Link to="/interviews/create" className="btn-primary-adaptive inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm">
                                <Plus className="w-4 h-4" /> Новая тренировка
                            </Link>
                        </div>
                    ) : (
                        <ul>
                            {recent.map((interview, index) => (
                                <motion.li
                                    key={interview.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.04 }}
                                >
                                    <TrainingRow interview={interview} reportId={reportByInterview[interview.id]} />
                                </motion.li>
                            ))}
                        </ul>
                    )}
                </section>

                <FocusPlan
                    title="Фокус подготовки"
                    locked={!isPro && (report?.weak_points_count ?? 0) > 0}
                    groups={report?.focus || []}
                    count={report?.focus_count ?? 0}
                    description={report ? undefined : 'Появится после первого отчёта.'}
                    action={false}
                />
            </div>
        </PageTransition>
    )
}

function HeroPanel({ report }: { report: ReportWithInterview | null }) {
    const tech = report?.technologies?.[0]
    const tag = report?.interview
        ? `${specializationLabel(report.interview.specialization)} / ${levelLabel(report.interview.level)}`.toUpperCase()
        : ''
    const weak = report?.weak_points_count ?? 0
    const [first, second] = (report?.headline || '').split('\n')

    return (
        <section className="relative overflow-hidden rounded-xl gradient-bg-adaptive text-white p-6 sm:p-8 grid sm:grid-cols-[1fr_auto] gap-6 items-center">
            <div className="relative z-[1]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
                    {report ? 'На основе последнего отчёта' : 'Первый шаг'}
                </p>
                <h2 className="mt-3 text-2xl sm:text-3xl font-bold leading-tight">
                    {report ? <>{first}{second && <><br />{second}</>}</> : <>Пройдите первую тренировку.<br />Мы покажем, что подтянуть.</>}
                </h2>
                <p className="mt-3 text-sm text-white/80 max-w-xl leading-relaxed">
                    {report?.comments
                        ? firstSentences(report.comments)
                        : 'Вопросы и практические задачи под ваш стек и грейд. После тренировки появится отчёт с результатом.'}
                </p>
                <Link
                    to={report ? `/reports/${report.id}` : '/interviews/create'}
                    className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-inter-verse-green dark:text-purple-700 hover:bg-white/90 transition-iv"
                >
                    {report
                        ? weak > 0 ? `Разобрать ${weak} ${pluralRu(weak, ['ошибку', 'ошибки', 'ошибок'])}` : 'Открыть отчёт'
                        : 'Начать тренировку'}
                    <ArrowRight className="w-4 h-4" />
                </Link>
            </div>
            {report && (
                <div className="hidden sm:flex flex-col items-center gap-3 pr-2">
                    <div className="w-36 h-36 rounded-full border border-white/25 flex items-center justify-center">
                        <div className="w-24 h-24 rounded-full border border-white/40 flex items-center justify-center font-mono text-lg">
                            {`{ ${(tech || 'code').toLowerCase().slice(0, 8)} }`}
                        </div>
                    </div>
                    {tag && <span className="rounded-md border border-white/30 px-2 py-1 text-[10px] font-semibold tracking-wider">{tag}</span>}
                </div>
            )}
        </section>
    )
}

function LastResultPanel({ report }: { report: ReportWithInterview | null }) {
    if (!report) {
        return (
            <section className="iv-panel p-5 sm:p-6 flex flex-col justify-center">
                <p className="iv-eyebrow">Последний результат</p>
                <p className="mt-3 text-secondary">Здесь появится результат после первой завершённой тренировки.</p>
            </section>
        )
    }

    return (
        <section className="iv-panel p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
                <p className="iv-eyebrow">Последний результат</p>
                <span className="iv-pill">Завершено</span>
            </div>
            <div className="mt-3 text-5xl font-bold tabular-nums tracking-tight gradient-text-adaptive">
                {report.overall_score}<span className="text-2xl">%</span>
            </div>
            <p className="mt-1 text-sm text-secondary">
                {[
                    specializationLabel(report.interview?.specialization),
                    levelLabel(report.interview?.level),
                    formatDay(report.interview?.scheduled_at || report.created_at),
                ].filter(Boolean).join(' · ')}
            </p>
            <ScoreBars
                className="mt-5"
                theory={report.algorithm_score}
                coding={report.coding_score}
                theoryCorrect={report.theory_correct}
                theoryTotal={report.theory_total}
                taskTotal={report.task_total}
            />
            <Link to={`/reports/${report.id}`} className="mt-5 inline-block text-sm font-semibold text-inter-verse-green dark:text-purple-400 hover:underline">
                Открыть полный отчёт →
            </Link>
        </section>
    )
}

function Metric({ label, value, hint }: { label: string; value: number; hint: string }) {
    return (
        <div className="p-5 sm:p-6">
            <p className="text-sm text-secondary">{label}</p>
            <p className="mt-2 text-3xl font-bold tabular-nums text-gray-900 dark:text-gray-100">{value}</p>
            <p className="mt-2 text-xs text-secondary">{hint}</p>
        </div>
    )
}

function TrainingRow({ interview, reportId }: { interview: Interview; reportId?: string }) {
    const completed = interview.status === 'completed'
    const techs = technologiesOf(interview)
    const meta = [
        techs.length > 3 ? `${techs.slice(0, 3).join(' · ')} +${techs.length - 3}` : techs.join(' · '),
        formatDay(interview.created_at, false),
    ].filter(Boolean).join(' · ')

    let action: { label: string; to: string } | null = null
    if (completed) action = reportId ? { label: 'Отчёт', to: `/reports/${reportId}` } : null
    else if (interview.status === 'in_progress') action = { label: 'Продолжить', to: `/interview/${interview.id}` }
    else if (interview.status === 'scheduled') action = { label: 'Начать', to: `/interview/${interview.id}` }

    return (
        <div className="flex items-center gap-4 py-4 border-b last:border-b-0 border-gray-200 dark:border-gray-600">
            <span className="w-10 h-10 shrink-0 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center justify-center text-inter-verse-green dark:text-purple-400">
                {completed ? <Check className="w-4 h-4" /> : <Code2 className="w-4 h-4" />}
            </span>
            <div className="min-w-0 flex-1">
                <span className={`text-[11px] font-semibold ${completed ? 'text-inter-verse-green dark:text-purple-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    {STATUS_LABELS[interview.status] || interview.status}
                </span>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{interview.title}</h3>
                {meta && <p className="text-xs text-secondary truncate mt-0.5">{meta}</p>}
            </div>
            {action && (
                <Link
                    to={action.to}
                    className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-600 px-3 sm:px-4 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100 hover:border-inter-verse-green dark:hover:border-purple-400 transition-iv"
                >
                    {action.label} <ArrowRight className="w-4 h-4" />
                </Link>
            )}
        </div>
    )
}
