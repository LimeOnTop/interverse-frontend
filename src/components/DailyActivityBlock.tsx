import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import Card from './ui/Card'
import { useTheme } from '../contexts/ThemeContext'

export const DEFAULT_DAILY_NORM = 5

const MAX_CUBES = 30
const CUBE_SIZE_PX = 6
const CUBE_GAP_PX = 2
const BAR_GAP_PX = 3
const MIN_BARS = 24
const MAX_BARS = 160
const THEME_TICK_PAUSE_MS = 350

interface DailyActivityBlockProps {
    completedToday: number
    dailyNorm?: number
}

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value))
}

/** 0→1-5, 1→5-10, 2→8-15, 3→12-20, 4→16-25, 5→20-30 */
const HEIGHT_RANGES: Record<number, { min: number; max: number }> = {
    0: { min: 1, max: 5 },
    1: { min: 3, max: 10 },
    2: { min: 5, max: 15 },
    3: { min: 7, max: 20 },
    4: { min: 9, max: 25 },
    5: { min: 11, max: 30 },
}

export function heightRangeForProgress(completedToday: number, dailyNorm: number) {
    const level = clamp(Math.round(completedToday), 0, Math.max(dailyNorm, 5))
    const mappedLevel = clamp(level, 0, 5)
    const range = HEIGHT_RANGES[mappedLevel] ?? HEIGHT_RANGES[0]

    return {
        min: clamp(range.min, 0, MAX_CUBES),
        max: clamp(range.max, 0, MAX_CUBES),
    }
}

function randomInt(min: number, max: number) {
    if (max <= min) return min
    return min + Math.floor(Math.random() * (max - min + 1))
}

const MAX_NEIGHBOR_DELTA = 5

function stepBarHeight(current: number, min: number, max: number) {
    const clamped = clamp(current, min, max)
    let delta = 0
    if (clamped <= min) {
        delta = 1
    } else if (clamped >= max) {
        delta = -1
    } else {
        delta = Math.random() < 0.5 ? -1 : 1
    }
    return clamp(clamped + delta, min, max)
}

/** Keep bar within [min,max] and within ±MAX_NEIGHBOR_DELTA of the left neighbor. */
function clampToLeftNeighbor(height: number, leftHeight: number, min: number, max: number) {
    const low = Math.max(min, leftHeight - MAX_NEIGHBOR_DELTA)
    const high = Math.min(max, leftHeight + MAX_NEIGHBOR_DELTA)
    return clamp(height, low, high)
}

function seedHeights(barCount: number, min: number, max: number) {
    const heights: number[] = []
    for (let index = 0; index < barCount; index += 1) {
        if (index === 0) {
            heights.push(randomInt(min, max))
            continue
        }
        const left = heights[index - 1]
        const low = Math.max(min, left - MAX_NEIGHBOR_DELTA)
        const high = Math.min(max, left + MAX_NEIGHBOR_DELTA)
        heights.push(randomInt(low, high))
    }
    return heights
}

function barsForWidth(width: number) {
    if (width <= 0) return MIN_BARS
    const stride = CUBE_SIZE_PX + BAR_GAP_PX
    const count = Math.floor((width + BAR_GAP_PX) / stride)
    return clamp(count, MIN_BARS, MAX_BARS)
}

const CUBE_BOTTOM_LIGHT_RGB = { r: 251, g: 146, b: 120 } // peach
const CUBE_BOTTOM_DARK_RGB = { r: 220, g: 38, b: 38 } // red-600
const CUBE_TOP_LIGHT_RGB = { r: 74, g: 222, b: 128 } // light green (green-400)
const CUBE_TOP_DARK_RGB = { r: 147, g: 51, b: 234 } // logo purple

function cubeColor(cubeIndex: number, isDark: boolean) {
    const t = MAX_CUBES <= 1 ? 1 : cubeIndex / (MAX_CUBES - 1)
    const bottom = isDark ? CUBE_BOTTOM_DARK_RGB : CUBE_BOTTOM_LIGHT_RGB
    const top = isDark ? CUBE_TOP_DARK_RGB : CUBE_TOP_LIGHT_RGB
    const r = Math.round(bottom.r + (top.r - bottom.r) * t)
    const g = Math.round(bottom.g + (top.g - bottom.g) * t)
    const b = Math.round(bottom.b + (top.b - bottom.b) * t)
    return `rgb(${r}, ${g}, ${b})`
}

export default function DailyActivityBlock({
    completedToday,
    dailyNorm = DEFAULT_DAILY_NORM,
}: DailyActivityBlockProps) {
    const { isDark } = useTheme()
    const visualizerRef = useRef<HTMLDivElement>(null)
    const ticksPausedUntilRef = useRef(0)
    const isFirstThemeRef = useRef(true)
    const [barCount, setBarCount] = useState(MIN_BARS)

    const progress = dailyNorm > 0
        ? clamp(completedToday / dailyNorm, 0, 1)
        : 0
    const percent = Math.round(progress * 100)
    const range = useMemo(
        () => heightRangeForProgress(completedToday, dailyNorm),
        [completedToday, dailyNorm],
    )

    const [heights, setHeights] = useState<number[]>(() =>
        Array.from({ length: MIN_BARS }, () => 0),
    )

    useEffect(() => {
        if (isFirstThemeRef.current) {
            isFirstThemeRef.current = false
            return
        }
        // Freeze equalizer updates while theme colors/transitions settle.
        ticksPausedUntilRef.current = Date.now() + THEME_TICK_PAUSE_MS
    }, [isDark])

    useEffect(() => {
        const node = visualizerRef.current
        if (!node) return

        const update = () => {
            setBarCount(barsForWidth(node.clientWidth))
        }

        update()

        const observer = new ResizeObserver(update)
        observer.observe(node)
        return () => observer.disconnect()
    }, [])

    useEffect(() => {
        setHeights(seedHeights(barCount, range.min, range.max))

        let alive = true
        let timer = 0

        const scheduleNext = (delay: number) => {
            timer = window.setTimeout(tick, delay)
        }

        const tick = () => {
            if (!alive) return

            const themeBusy = Date.now() < ticksPausedUntilRef.current
                || document.documentElement.classList.contains('theme-transition')

            if (themeBusy) {
                scheduleNext(40)
                return
            }

            setHeights((prev) => {
                if (prev.length === 0) return prev

                const next = prev.slice()

                for (let index = 0; index < next.length; index += 1) {
                    let height = stepBarHeight(next[index], range.min, range.max)
                    if (index > 0) {
                        height = clampToLeftNeighbor(height, next[index - 1], range.min, range.max)
                    }
                    next[index] = height
                }

                return next
            })

            scheduleNext(28 + Math.random() * 22)
        }

        scheduleNext(Math.random() * 30)

        return () => {
            alive = false
            window.clearTimeout(timer)
        }
    }, [range.min, range.max, barCount])

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className="flex flex-col sm:flex-row sm:items-stretch gap-4 lg:gap-6 w-full"
        >
            <Card padding="md" className="sm:w-64 lg:w-72 shrink-0">
                <div className="h-full flex flex-col justify-between gap-6">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-secondary">
                            Активность
                        </p>
                        <p className="text-3xl font-semibold tabular-nums text-gray-900 dark:text-gray-100 mt-2">
                            {completedToday}
                            <span className="text-secondary text-xl font-medium"> / {dailyNorm}</span>
                        </p>
                        <p className="text-sm text-secondary mt-2">
                            Пройдено сегодня. Эквалайзер отображает твой прогресс. Заставь его играть на полную!
                        </p>
                    </div>

                    <div>
                        <div className="flex items-center justify-between text-xs text-secondary mb-2">
                            <span>Прогресс</span>
                            <span className="tabular-nums font-medium text-gray-900 dark:text-gray-100">{percent}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 dark:bg-iv-dark-bg border border-gray-200 dark:border-gray-600 overflow-hidden">
                            <motion.div
                                className="h-full gradient-bg-adaptive"
                                initial={{ width: 0 }}
                                animate={{ width: `${percent}%` }}
                                transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                            />
                        </div>
                    </div>
                </div>
            </Card>

            <div
                ref={visualizerRef}
                className="eq-visualizer flex-1 w-full flex items-end justify-between min-w-0 self-center sm:self-stretch overflow-hidden"
                style={{
                    minHeight: MAX_CUBES * (CUBE_SIZE_PX + CUBE_GAP_PX),
                }}
                role="img"
                aria-label={`Дневная активность ${completedToday} из ${dailyNorm}`}
            >
                {heights.map((litCubes, index) => (
                    <div
                        key={index}
                        className="eq-bar flex flex-col-reverse shrink-0"
                        style={{
                            width: CUBE_SIZE_PX,
                            gap: CUBE_GAP_PX,
                            height: MAX_CUBES * (CUBE_SIZE_PX + CUBE_GAP_PX) - CUBE_GAP_PX,
                        }}
                        aria-hidden
                    >
                        {Array.from({ length: MAX_CUBES }, (_, cubeIndex) => {
                            const lit = cubeIndex < litCubes
                            return (
                                <span
                                    key={cubeIndex}
                                    className={`eq-cube block shrink-0 ${lit ? 'eq-cube-lit' : 'eq-cube-dim'}`}
                                    style={{
                                        width: CUBE_SIZE_PX,
                                        height: CUBE_SIZE_PX,
                                        backgroundColor: lit ? cubeColor(cubeIndex, isDark) : 'transparent',
                                    }}
                                />
                            )
                        })}
                    </div>
                ))}
            </div>
        </motion.div>
    )
}

export function countCompletedToday(
    interviews: Array<{
        status: string
        updated_at?: string
        updatedAt?: string
        created_at?: string
        createdAt?: string
    }>,
    now = new Date(),
): number {
    // Local calendar day of the user (browser timezone), resets at 00:00.
    const start = new Date(now)
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(end.getDate() + 1)

    return interviews.filter((interview) => {
        if (interview.status !== 'completed') {
            return false
        }

        const stamp = interview.updated_at
            || interview.updatedAt
            || interview.created_at
            || interview.createdAt
        if (!stamp) {
            return false
        }

        const date = new Date(stamp)
        return !Number.isNaN(date.getTime()) && date >= start && date < end
    }).length
}

function localDayKey(date = new Date()) {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
}

function msUntilNextLocalMidnight(now = new Date()) {
    const next = new Date(now)
    next.setHours(0, 0, 0, 0)
    next.setDate(next.getDate() + 1)
    return Math.max(0, next.getTime() - now.getTime())
}

/** Recomputes when the user's local calendar day changes (at 00:00). */
export function useLocalCalendarDay() {
    const [dayKey, setDayKey] = useState(() => localDayKey())

    useEffect(() => {
        let timer = 0

        const syncDay = () => {
            const next = localDayKey()
            setDayKey((prev) => (prev === next ? prev : next))
        }

        const schedule = () => {
            window.clearTimeout(timer)
            timer = window.setTimeout(() => {
                syncDay()
                schedule()
            }, msUntilNextLocalMidnight() + 50)
        }

        schedule()

        const onVisible = () => {
            if (document.visibilityState === 'hidden') return
            syncDay()
            schedule()
        }

        document.addEventListener('visibilitychange', onVisible)
        window.addEventListener('focus', onVisible)

        return () => {
            window.clearTimeout(timer)
            document.removeEventListener('visibilitychange', onVisible)
            window.removeEventListener('focus', onVisible)
        }
    }, [])

    return dayKey
}
