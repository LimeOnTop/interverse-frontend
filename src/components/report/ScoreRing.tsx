import { useId } from 'react'

/** Overall result as a ring in the logo gradient. */
export default function ScoreRing({ score, size = 160 }: { score: number; size?: number }) {
    const gradientId = `ring${useId().replace(/:/g, '')}`
    const radius = 68
    const circumference = 2 * Math.PI * radius
    const filled = (Math.min(100, Math.max(0, score)) / 100) * circumference

    return (
        <div className="relative mx-auto" style={{ width: size, height: size }}>
            <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90" aria-hidden>
                <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" className="[stop-color:#013220] dark:[stop-color:#c084fc]" />
                        <stop offset="100%" className="[stop-color:#01784a] dark:[stop-color:#9333ea]" />
                    </linearGradient>
                </defs>
                <circle cx="80" cy="80" r={radius} fill="none" strokeWidth="8" className="stroke-gray-200 dark:stroke-iv-dark-line" />
                <circle
                    cx="80"
                    cy="80"
                    r={radius}
                    fill="none"
                    stroke={`url(#${gradientId})`}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${filled} ${circumference}`}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <strong className="text-4xl font-bold tabular-nums tracking-tight gradient-text-adaptive">{score}%</strong>
                <small className="text-[11px] text-secondary mt-0.5">результат</small>
            </div>
        </div>
    )
}
