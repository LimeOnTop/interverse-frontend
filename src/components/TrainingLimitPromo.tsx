import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Sparkles, X } from 'lucide-react'
import { usePromoStore } from '../store/promoStore'
import { PRO_FEATURES } from '../utils/subscription'

/** Centered promo shown when a Basic user runs out of trainings. No prices here by design. */
export default function TrainingLimitPromo() {
    const { limitPromoOpen, closeLimitPromo } = usePromoStore()
    const navigate = useNavigate()

    useEffect(() => {
        if (!limitPromoOpen) return
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') closeLimitPromo()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [limitPromoOpen, closeLimitPromo])

    const goPro = () => {
        closeLimitPromo()
        navigate('/subscription')
    }

    return (
        <AnimatePresence>
            {limitPromoOpen && (
                <motion.div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={closeLimitPromo}
                >
                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="training-limit-promo-title"
                        className="iv-form-card relative w-full max-w-lg p-6 sm:p-8 text-left max-h-[90dvh] overflow-y-auto"
                        initial={{ opacity: 0, scale: 0.95, y: 12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 12 }}
                        onClick={(event) => event.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={closeLimitPromo}
                            className="absolute right-4 top-4 text-secondary hover:text-gray-900 dark:hover:text-gray-100"
                            aria-label="Закрыть"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-inter-verse-green dark:text-purple-400">
                            <Sparkles className="w-4 h-4" /> Pro
                        </div>
                        <h2 id="training-limit-promo-title" className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                            Вы достигли лимита тренировок
                        </h2>
                        <p className="text-secondary leading-relaxed mb-5">
                            На тарифе Basic доступна одна тренировка. В подписке Pro лимит расширен,
                            а ещё в ней есть:
                        </p>
                        <ul className="space-y-2 mb-7">
                            {PRO_FEATURES.map((feature) => (
                                <li key={feature} className="flex items-start gap-3 text-sm text-gray-800 dark:text-gray-200">
                                    <span className="font-bold text-inter-verse-green dark:text-purple-400" aria-hidden>—</span>
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>
                        <button type="button" onClick={goPro} className="btn-primary-adaptive w-full justify-center py-3">
                            Перейти на Pro
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
