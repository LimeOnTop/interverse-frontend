import { useEffect, useMemo, useState } from 'react'
import { format, isValid, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'
import {
    CartesianGrid,
    LabelList,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts'
import { api } from '../services/api'
import { useTheme } from '../contexts/ThemeContext'

interface ReportScore {
    created_at?: string
    overall_score?: number
}

interface DailyProgress {
    key: string
    label: string
    score: number
    count: number
}

/** Average overall result of all trainings per day, oldest day first. */
export function buildDailyProgress(reports: ReportScore[]): DailyProgress[] {
    const days = new Map<string, { sum: number; count: number; date: Date }>()
    for (const report of reports) {
        if (!report.created_at || typeof report.overall_score !== 'number') continue
        const date = parseISO(report.created_at)
        if (!isValid(date)) continue
        const key = format(date, 'yyyy-MM-dd')
        const day = days.get(key) ?? { sum: 0, count: 0, date }
        day.sum += report.overall_score
        day.count += 1
        days.set(key, day)
    }

    return [...days.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, day]) => ({
            key,
            label: format(day.date, 'd MMM', { locale: ru }),
            score: Math.round(day.sum / day.count),
            count: day.count,
        }))
}

export default function ProgressChart() {
    const { isDark } = useTheme()
    const [reports, setReports] = useState<ReportScore[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        api.get('/reports/', { params: { limit: 500 } })
            .then((response) => setReports(response.data.reports || []))
            .catch((error) => console.error('Error fetching reports:', error))
            .finally(() => setLoading(false))
    }, [])

    const data = useMemo(() => buildDailyProgress(reports), [reports])
    const accentColor = isDark ? '#9333EA' : '#013220'
    const gridColor = isDark ? '#4B5563' : '#E5E7EB'
    const axisColor = isDark ? '#9CA3AF' : '#6B7280'
    const labelColor = isDark ? '#E5E7EB' : '#111827'

    if (loading) {
        return (
            <div className="flex items-center justify-center h-80">
                <div className="iv-spinner h-8 w-8" />
            </div>
        )
    }

    const last = data[data.length - 1]
    const first = data[0]
    const delta = data.length > 1 ? last.score - first.score : 0

    return (
        <div>
            <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-secondary">Прогресс</p>
                    <p className="text-sm text-secondary mt-1">Средний результат всех тренировок за день</p>
                </div>
                {last && (
                    <div className="text-left sm:text-right">
                        <p className="text-xs text-secondary">Последний результат</p>
                        <p className="text-2xl sm:text-3xl font-semibold tabular-nums">
                            {last.score}%
                            {data.length > 1 && (
                                <span className={`ml-2 text-base ${delta >= 0 ? 'text-inter-verse-green dark:text-purple-400' : 'text-red-500'}`}>
                                    {delta >= 0 ? '+' : ''}{delta}
                                </span>
                            )}
                        </p>
                    </div>
                )}
            </div>

            {data.length === 0 ? (
                <p className="text-sm text-secondary py-16 text-center">
                    Пройдите тренировку, чтобы увидеть прогресс.
                </p>
            ) : (
                <div className="h-[240px] sm:h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 24, right: 24, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                            <XAxis dataKey="label" tick={{ fill: axisColor, fontSize: 11 }} axisLine={{ stroke: gridColor }} tickLine={false} interval="preserveStartEnd" minTickGap={16} />
                            <YAxis domain={[0, 100]} tickFormatter={(value: number) => `${value}%`} tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: isDark ? '#4A4A4A' : '#FFFFFF',
                                    border: `1px solid ${gridColor}`,
                                    borderRadius: 0,
                                    fontSize: 13,
                                }}
                                formatter={(value: number, _name, item) => [
                                    `${value}% (тренировок: ${(item.payload as DailyProgress).count})`,
                                    'Средний результат',
                                ]}
                            />
                            <Line
                                type="monotone"
                                dataKey="score"
                                stroke={accentColor}
                                strokeWidth={2}
                                dot={{ r: 4, fill: accentColor }}
                                activeDot={{ r: 6 }}
                                animationDuration={800}
                            >
                                <LabelList dataKey="score" position="top" formatter={(value: number) => `${value}%`} style={{ fill: labelColor, fontSize: 11 }} />
                            </Line>
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    )
}
