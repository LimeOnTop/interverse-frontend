import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import ProgressChart from '../components/ProgressChart'
import PageTransition from '../components/ui/PageTransition'
import Spinner from '../components/ui/Spinner'
import ScoreBars from '../components/report/ScoreBars'
import FocusPlan from '../components/report/FocusPlan'
import { formatDay, pluralRu, useDashboardSummary, type ReportWithInterview } from '../lib/dashboard'

const TARGET_SCORE = 80

/** Next goal from the weaker scored section of the latest report. */
function nextGoal(report: ReportWithInterview) {
    const sections = [
        (report.theory_total ?? 0) > 0 && { name: 'теорию', score: report.algorithm_score },
        (report.task_total ?? 0) > 0 && { name: 'практику', score: report.coding_score },
    ].filter(Boolean) as { name: string; score: number }[]
    const weakest = sections.sort((a, b) => a.score - b.score)[0]
    if (!weakest || weakest.score >= TARGET_SCORE) {
        return { title: 'Повысить грейд тренировки', hint: `Все разделы выше ${TARGET_SCORE}%` }
    }
    return { title: `Поднять ${weakest.name} до ${TARGET_SCORE}%`, hint: `Сейчас ${weakest.score}%` }
}

export default function ActivityPage() {
    const { summary, loading } = useDashboardSummary()

    if (loading) return <Spinner size="lg" className="h-64" />

    const report = summary?.last_report ?? null
    const completed = summary?.trainings.completed ?? 0
    const goal = report ? nextGoal(report) : null

    return (
        <PageTransition className="space-y-6 sm:space-y-8">
            <div>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Ваш прогресс</h1>
                <p className="mt-2 text-secondary">Факты подготовки по завершённым тренировкам.</p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                <div className="iv-panel p-5 sm:p-6">
                    <p className="iv-eyebrow">Последний результат</p>
                    <p className="mt-3 text-4xl font-bold tabular-nums gradient-text-adaptive">
                        {report ? <>{report.overall_score}<span className="text-xl">%</span></> : '—'}
                    </p>
                    <p className="mt-2 text-xs text-secondary">
                        {report ? formatDay(report.interview?.scheduled_at || report.created_at) : 'Пока нет отчётов'}
                    </p>
                </div>
                <div className="iv-panel p-5 sm:p-6">
                    <p className="iv-eyebrow">Завершено</p>
                    <p className="mt-3 text-4xl font-bold tabular-nums text-gray-900 dark:text-gray-100">{completed}</p>
                    <p className="mt-2 text-xs text-secondary">
                        {completed} {pluralRu(completed, ['тренировка', 'тренировки', 'тренировок'])} за всё время
                    </p>
                </div>
                <div className="iv-panel p-5 sm:p-6">
                    <p className="iv-eyebrow">Следующая цель</p>
                    <h2 className="mt-3 text-xl font-semibold text-gray-900 dark:text-gray-100">
                        {goal ? goal.title : 'Пройти первую тренировку'}
                    </h2>
                    <p className="mt-2 text-xs text-secondary">{goal ? goal.hint : 'После неё появится отчёт'}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.65fr_1fr] items-start">
                <section className="iv-panel p-5 sm:p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Результат тренировки</h2>
                    {report ? (
                        <>
                            <p className="mt-2 text-sm text-secondary">
                                {formatDay(report.interview?.scheduled_at || report.created_at, false)} · {report.overall_score}%
                            </p>
                            <ScoreBars
                                className="mt-5"
                                theory={report.algorithm_score}
                                coding={report.coding_score}
                                theoryCorrect={report.theory_correct}
                                theoryTotal={report.theory_total}
                                taskTotal={report.task_total}
                            />
                            {completed < 2 && (
                                <p className="mt-5 text-xs text-secondary">
                                    Пока есть один отчёт. Для сравнения результатов нужна следующая завершённая тренировка.
                                </p>
                            )}
                            <Link
                                to={`/reports/${report.id}`}
                                className="mt-5 inline-flex items-center gap-2 rounded-lg border border-gray-200 dark:border-iv-dark-line px-4 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100 hover:border-inter-verse-green dark:hover:border-purple-400 transition-iv"
                            >
                                Разобрать результат <ArrowRight className="w-4 h-4" />
                            </Link>
                        </>
                    ) : (
                        <p className="mt-3 text-secondary">Завершите тренировку, чтобы увидеть результат по теории и практике.</p>
                    )}
                </section>

                <FocusPlan
                    locked={summary?.plan !== 'paid' && (report?.weak_points_count ?? 0) > 0}
                    groups={report?.focus || []}
                    count={report?.focus_count ?? 0}
                    description={report ? undefined : 'Появится после первого отчёта.'}
                />
            </div>

            {completed >= 2 && (
                <section className="iv-panel p-5 sm:p-6">
                    <ProgressChart />
                </section>
            )}
        </PageTransition>
    )
}
