import { Check } from 'lucide-react'
import { PRO_TRACK_PLAN, formatRub } from '../utils/subscription'

/** Prices are shown only on /pricing and /subscription; elsewhere pass showPrice={false}. */
export default function ProTrackCard({ className = '', showPrice = true }: { className?: string; showPrice?: boolean }) {
    return (
        <section className={`iv-form-card p-6 sm:p-8 flex flex-col ${className}`}>
            <div className="iv-form-card-shine-clip" aria-hidden>
                <div className="iv-form-card-shine" />
            </div>

            <div className="flex items-start justify-between gap-3 mb-2">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {PRO_TRACK_PLAN.name}
                </h2>
                <span className="text-xs font-semibold uppercase tracking-wide text-white bg-inter-verse-green dark:bg-purple-500 px-2.5 py-1 rounded-md">
                    {PRO_TRACK_PLAN.badge}
                </span>
            </div>

            <p className="text-sm text-secondary mb-6 leading-relaxed">
                {PRO_TRACK_PLAN.description}
            </p>

            {showPrice && <div className="mb-6">
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                    {formatRub(PRO_TRACK_PLAN.price)}
                </div>
                <div className="text-sm text-secondary mt-1">{PRO_TRACK_PLAN.priceHint}</div>
                <div className="mt-2 text-xs font-medium text-inter-verse-green dark:text-purple-300">
                    Платные курсы по одной профессии стоят около {formatRub(PRO_TRACK_PLAN.coursePrice)}
                </div>
            </div>}

            <ul className="space-y-3 mb-6 flex-1">
                {PRO_TRACK_PLAN.features.map((feature) => (
                    <li
                        key={feature}
                        className="flex items-start gap-3 text-sm text-gray-800 dark:text-gray-200"
                    >
                        <Check
                            className="w-4 h-4 mt-0.5 shrink-0 text-inter-verse-green dark:text-purple-300"
                            strokeWidth={2}
                        />
                        <span>{feature}</span>
                    </li>
                ))}
            </ul>

            <p className="text-xs text-secondary leading-relaxed mb-6">
                {PRO_TRACK_PLAN.proUpgradeNote}
            </p>

            <div className="w-full py-3 text-center text-xs font-semibold uppercase tracking-wide rounded-lg text-white bg-inter-verse-green dark:bg-purple-500">
                Скоро
            </div>
        </section>
    )
}
