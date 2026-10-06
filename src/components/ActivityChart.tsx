import { useEffect, useMemo, useState } from 'react'
import { format, isValid, parseISO, startOfMonth, subMonths } from 'date-fns'
import { ru } from 'date-fns/locale'
import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts'
import { api } from '../services/api'
import { useTheme } from '../contexts/ThemeContext'

interface Interview {
    id: string
    status: string
    updated_at?: string
    scheduled_at?: string
    created_at?: string
}

interface MonthlyActivity {
    key: string
    label: string
    count: number
}

const MONTHS_TO_SHOW = 12

function buildMonthlyActivity(interviews: Interview[]): MonthlyActivity[] {
    const now = new Date()
    const buckets: MonthlyActivity[] = Array.from({ length: MONTHS_TO_SHOW }, (_, index) => {
        const date = startOfMonth(subMonths(now, MONTHS_TO_SHOW - 1 - index))
        return {
            key: format(date, 'yyyy-MM'),
            label: format(date, 'LLL yy', { locale: ru }),
            count: 0,
        }
    })

    const bucketMap = new Map(buckets.map((bucket) => [bucket.key, bucket]))

    for (const interview of interviews) {
        if (interview.status !== 'completed') {
            continue
        }

        const dateValue = interview.updated_at || interview.scheduled_at || interview.created_at
        if (!dateValue) {
            continue
        }

        const date = parseISO(dateValue)
        if (!isValid(date)) {
            continue
        }

        const key = format(startOfMonth(date), 'yyyy-MM')
        const bucket = bucketMap.get(key)
        if (bucket) {
            bucket.count += 1
        }
    }

    return buckets
}

export default function ActivityChart() {
    const { isDark } = useTheme()
    const [interviews, setInterviews] = useState<Interview[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchInterviews = async () => {
            try {
                const response = await api.get('/interviews/')
                setInterviews(response.data.interviews || [])
            } catch (error) {
                console.error('Error fetching interviews:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchInterviews()
    }, [])

    const chartData = useMemo(() => buildMonthlyActivity(interviews), [interviews])
    const totalCompleted = useMemo(
        () => interviews.filter((interview) => interview.status === 'completed').length,
        [interviews],
    )
    const accentColor = isDark ? '#9333EA' : '#013220'
    const gridColor = isDark ? '#4B5563' : '#E5E7EB'
    const axisColor = isDark ? '#9CA3AF' : '#6B7280'

    if (loading) {
        return (
            <div className="flex items-center justify-center h-80">
                <div className="iv-spinner h-8 w-8" />
            </div>
        )
    }

    return (
        <div>
            <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-secondary">За 12 месяцев</p>
                    <p className="text-sm text-secondary mt-1">Пройденные интервью по месяцам</p>
                </div>
                <div className="text-left sm:text-right">
                    <p className="text-xs text-secondary">Всего пройдено</p>
                    <p className="text-2xl sm:text-3xl font-semibold tabular-nums">{totalCompleted}</p>
                </div>
            </div>

            <div className="h-[240px] sm:h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                        <XAxis dataKey="label" tick={{ fill: axisColor, fontSize: 11 }} axisLine={{ stroke: gridColor }} tickLine={false} interval="preserveStartEnd" minTickGap={12} />
                        <YAxis allowDecimals={false} tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip
                            cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}
                            contentStyle={{
                                backgroundColor: isDark ? '#4A4A4A' : '#FFFFFF',
                                border: `1px solid ${gridColor}`,
                                borderRadius: 0,
                                fontSize: 13,
                            }}
                            formatter={(value: number) => [`${value}`, 'Пройдено']}
                        />
                        <Bar dataKey="count" fill={accentColor} radius={0} maxBarSize={40} animationDuration={800} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
