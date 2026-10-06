import { Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { useEffect, useState } from 'react'
import PageHeader from '../components/ui/PageHeader'
import PageTransition from '../components/ui/PageTransition'
import Button from '../components/ui/Button'
import { useAuthStore } from '../store/authStore'
import { api } from '../services/api'
import ProTrackCard from '../components/ProTrackCard'
import {
    FALLBACK_PAID_OFFERS,
    FREE_PLAN,
    formatRub,
    mapOffersResponse,
    resolveSubscriptionPlan,
    subscriptionPlanLabel,
    type PaidOffer,
} from '../utils/subscription'

type PaymentFormPayload = {
    action: string
    method: string
    fields: Record<string, string>
}

function submitRobokassaForm(payment: PaymentFormPayload) {
    const form = document.createElement('form')
    form.method = (payment.method || 'POST').toUpperCase() === 'GET' ? 'GET' : 'POST'
    form.action = payment.action
    form.acceptCharset = 'UTF-8'
    form.style.display = 'none'
    Object.entries(payment.fields || {}).forEach(([name, value]) => {
        const input = document.createElement('input')
        input.type = 'hidden'
        input.name = name
        input.value = String(value ?? '')
        form.appendChild(input)
    })
    document.body.appendChild(form)
    form.submit()
}

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

export default function SubscriptionPage() {
    const { user, accessToken } = useAuthStore()
    const currentPlan = resolveSubscriptionPlan(user)
    const [buyingPlan, setBuyingPlan] = useState<string | null>(null)
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

    useEffect(() => {
        if (!accessToken) return

        api.get('/auth/me')
            .then((response) => {
                if (response.data?.user) {
                    useAuthStore.setState({ user: response.data.user })
                }
            })
            .catch(() => {
                // keep cached user if refresh fails
            })
    }, [accessToken])

    const handleBuy = async (planId: string) => {
        try {
            setBuyingPlan(planId)
            const { data } = await api.post('/payments/', { plan: planId })
            const payment = data?.payment as PaymentFormPayload | undefined
            if (!payment?.action || !payment?.fields) {
                throw new Error('Некорректный ответ платёжного сервиса')
            }
            submitRobokassaForm(payment)
        } catch (error: unknown) {
            const message =
                (error as { response?: { data?: { error?: string } } })?.response?.data?.error ||
                (error as Error)?.message ||
                'Не удалось начать оплату'
            toast.error(message)
            setBuyingPlan(null)
        }
    }

    return (
        <PageTransition>
            <PageHeader title="Подписка" />

            <div className="mb-6 max-w-6xl space-y-1">
                <p className="text-sm text-secondary leading-relaxed">
                    Сейчас активен тариф {subscriptionPlanLabel(currentPlan)}. Выберите подходящий вариант.
                </p>
                <p className="text-sm text-secondary leading-relaxed">
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
                <section
                    className={`iv-form-card p-8 flex flex-col ${
                        currentPlan === 'free'
                            ? 'ring-2 ring-inter-verse-green dark:ring-purple-400'
                            : ''
                    }`}
                >
                    <div className="iv-form-card-shine-clip" aria-hidden>
                        <div className="iv-form-card-shine" />
                    </div>

                    <div className="flex items-start justify-between gap-3 mb-2">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {FREE_PLAN.name}
                        </h2>
                        {currentPlan === 'free' && (
                            <span className="text-xs font-medium text-inter-verse-green dark:text-purple-300 bg-inter-verse-green/10 dark:bg-purple-500/15 px-2.5 py-1 rounded-md">
                                Активен
                            </span>
                        )}
                    </div>

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

                    {currentPlan === 'free' ? (
                        <div className="w-full text-center py-3 text-sm font-medium text-secondary border border-gray-200 dark:border-gray-600 rounded-lg">
                            Текущий вариант
                        </div>
                    ) : (
                        <div className="w-full text-center py-3 text-sm text-secondary">
                            Доступен без оплаты
                        </div>
                    )}
                </section>

                {paidOffers.map((plan) => (
                    <section
                        key={plan.id}
                        className={`iv-form-card p-8 flex flex-col ${
                            currentPlan === 'paid'
                                ? 'ring-2 ring-inter-verse-green dark:ring-purple-400'
                                : ''
                        }`}
                    >
                        <div className="iv-form-card-shine-clip" aria-hidden>
                            <div className="iv-form-card-shine" />
                        </div>

                        <div className="flex items-start justify-between gap-3 mb-2">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {plan.name}
                            </h2>
                            <div className="flex items-center gap-2">
                                {plan.badge && (
                                    <span className="text-xs font-semibold uppercase tracking-wide text-white bg-inter-verse-green dark:bg-purple-500 px-2.5 py-1 rounded-md">
                                        {plan.badge}
                                    </span>
                                )}
                                {currentPlan === 'paid' && (
                                    <span className="text-xs font-medium text-inter-verse-green dark:text-purple-300 bg-inter-verse-green/10 dark:bg-purple-500/15 px-2.5 py-1 rounded-md">
                                        Pro
                                    </span>
                                )}
                            </div>
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

                        <Button
                            type="button"
                            className="w-full justify-center"
                            loading={buyingPlan === plan.id}
                            disabled={buyingPlan !== null && buyingPlan !== plan.id}
                            onClick={() => void handleBuy(plan.id)}
                        >
                            {currentPlan === 'paid' ? 'Продлить' : 'Купить'}
                        </Button>
                    </section>
                ))}

                <ProTrackCard />
            </div>
        </PageTransition>
    )
}
