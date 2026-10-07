import { pluralRu } from '../../lib/dashboard'

interface ScoreBarsProps {
    theory: number
    coding: number
    theoryCorrect?: number
    theoryTotal?: number
    taskTotal?: number
    className?: string
}

/** Theory and coding results as two labelled progress bars. */
export default function ScoreBars({ theory, coding, theoryCorrect, theoryTotal = 0, taskTotal = 0, className = '' }: ScoreBarsProps) {
    const rows = [
        theoryTotal > 0 && {
            name: 'Теория',
            hint: typeof theoryCorrect === 'number' ? `${theoryCorrect} из ${theoryTotal}` : `${theoryTotal} ${pluralRu(theoryTotal, ['вопрос', 'вопроса', 'вопросов'])}`,
            score: theory,
        },
        taskTotal > 0 && {
            name: 'Кодинг',
            hint: `${taskTotal} ${pluralRu(taskTotal, ['задача', 'задачи', 'задач'])}`,
            score: coding,
        },
    ].filter(Boolean) as { name: string; hint: string; score: number }[]

    if (rows.length === 0) return null

    return (
        <div className={`grid gap-5 sm:grid-cols-2 ${className}`}>
            {rows.map((row) => (
                <div key={row.name}>
                    <div className="flex items-baseline justify-between gap-3 text-sm mb-2">
                        <span className="text-gray-900 dark:text-gray-100">
                            {row.name} <span className="text-secondary">· {row.hint}</span>
                        </span>
                        <b className="tabular-nums text-gray-900 dark:text-gray-100">{row.score}%</b>
                    </div>
                    <div className="iv-track"><span style={{ width: `${Math.min(100, Math.max(0, row.score))}%` }} /></div>
                </div>
            ))}
        </div>
    )
}
