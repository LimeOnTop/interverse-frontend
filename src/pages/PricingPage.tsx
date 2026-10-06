import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import PublicNav from '../components/PublicNav'
import SiteFooter from '../components/SiteFooter'
import PageTransition from '../components/ui/PageTransition'
import { api } from '../services/api'
import {
    FALLBACK_PAID_OFFERS,
    FREE_PLAN,
    formatRub,
    mapOffersResponse,
    type PaidOffer,
} from '../utils/subscription'

function PriceBlock({
    offer,
    earlyBirdRemaining,
    earlyBirdLimit,
}: {
    offer: PaidOffer
    earlyBirdRemaining: number
    earlyBirdLimit: number
}) {
    const showStrike =
        Boolean(offer.earlyBird) &&
        offer.regularPrice &&
        offer.regularPrice !== offer.price

    return (
        <div className="mb-6">
            <div className="flex items-baseline gap-3 flex-wrap">
                {showStrike && (
                    <span className="text-xl text-secondary line-through decoration-2">
                        {formatRub(offer.regularPrice!)}
                    </span>
                )}
                <span className="text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                    {formatRub(offer.price)}
                </span>
            </div>
            <div className="text-sm text-secondary mt-1">{offer.priceHint}</div>
            {offer.earlyBird && earlyBirdRemaining > 0 && (
                <div className="mt-2 text-xs font-medium text-inter-verse-green dark:text-purple-300">
                    Осталось {earlyBirdRemaining} из {earlyBirdLimit} мест по спеццене
                </div>
            )}
        </div>
    )
}

export default function PricingPage() {
    const [paidOffers, setPaidOffers] = useState<PaidOffer[]>(FALLBACK_PAID_OFFERS)
    const [earlyBirdRemaining, setEarlyBirdRemaining] = useState(100)
    const [earlyBirdLimit, setEarlyBirdLimit] = useState(100)

    useEffect(() => {
        api
            .get('/payments/offers')
            .then((response) => {
                const mapped = mapOffersResponse(response.data)
                setPaidOffers(mapped.paidOffers)
                setEarlyBirdRemaining(mapped.earlyBirdRemaining)
                setEarlyBirdLimit(mapped.earlyBirdLimit)
            })
            .catch(() => {
                // keep fallback catalog
            })
    }, [])

    return (
        <div className="min-h-screen relative bg-gray-50 dark:bg-iv-dark-bg flex flex-col">
            <PublicNav landing />

            <PageTransition className="flex-1">
                <section className="max-w-content mx-auto px-6 lg:px-8 py-12 lg:py-16">
                    <div className="max-w-2xl mb-10">
                        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mb-3">
                            Тарифы
                        </h1>
                        <p className="text-secondary leading-relaxed">
                            Выберите подходящий план для подготовки к техническим собеседованиям.
                            Оплата тарифа Pro означает согласие с условиями{' '}
                            <a
                                href="/legal/oferta.html"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-inter-verse-green dark:text-purple-400 hover:underline"
                            >
                                публичной оферты
                            </a>
                            .
                        </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 max-w-6xl">
                        <section className="iv-form-card p-8 flex flex-col">
                            <div className="iv-form-card-shine-clip" aria-hidden>
                                <div className="iv-form-card-shine" />
                            </div>

                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                                {FREE_PLAN.name}
                            </h2>
                            <p className="text-sm text-secondary mb-6 leading-relaxed">
                                {FREE_PLAN.description}
                            </p>

                            <div className="mb-6">
                                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                                    {FREE_PLAN.price}
                                </div>
                                <div className="text-sm text-secondary mt-1">{FREE_PLAN.priceHint}</div>
                            </div>

                            <ul className="space-y-3 mb-8 flex-1">
                                {FREE_PLAN.features.map((feature) => (
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

                            <Link
                                to="/register"
                                className="w-full text-center py-3 text-sm font-medium text-secondary border border-gray-200 dark:border-gray-600 rounded-lg hover:border-inter-verse-green dark:hover:border-purple-400 transition-iv"
                            >
                                Зарегистрироваться бесплатно
                            </Link>
                        </section>

                        {paidOffers.map((plan) => (
                            <section
                                key={plan.id}
                                className="iv-form-card p-8 flex flex-col ring-2 ring-inter-verse-green dark:ring-purple-400"
                            >
                                <div className="iv-form-card-shine-clip" aria-hidden>
                                    <div className="iv-form-card-shine" />
                                </div>

                                <div className="flex items-start justify-between gap-3 mb-2">
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                        {plan.name}
                                    </h2>
                                    {plan.badge && (
                                        <span className="text-xs font-semibold uppercase tracking-wide text-white bg-inter-verse-green dark:bg-purple-500 px-2.5 py-1 rounded-md">
                                            {plan.badge}
                                        </span>
                                    )}
                                </div>

                                <p className="text-sm text-secondary mb-6 leading-relaxed">
                                    {plan.description}
                                </p>

                                <PriceBlock
                                    offer={plan}
                                    earlyBirdRemaining={earlyBirdRemaining}
                                    earlyBirdLimit={earlyBirdLimit}
                                />

                                <ul className="space-y-3 mb-8 flex-1">
                                    {plan.features.map((feature) => (
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

                                <Link
                                    to="/register"
                                    className="btn-primary-adaptive w-full text-center justify-center py-3"
                                >
                                    Начать с Pro
                                </Link>
                            </section>
                        ))}
                    </div>
                </section>
            </PageTransition>

            <SiteFooter />
        </div>
    )
}
