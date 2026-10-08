import { Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { useEffect, useState } from 'react'
import PageTransition from '../components/ui/PageTransition'
import Button from '../components/ui/Button'
import { useAuthStore } from '../store/authStore'
import { api } from '../services/api'
import { Link } from 'react-router-dom'
import { formatDay, useDashboardSummary } from '../lib/dashboard'
import {
    FALLBACK_PAID_OFFERS,
    FREE_PLAN,
    PRO_FEATURES,
    PRO_TRACK_PLAN,
    PRO_TRAININGS_PER_DAY,
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

type PaymentHistoryItem = {
    id: number
    name: string
    amount: string
    paid_at: string
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
        <div className="mb-5">
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
                    Осталось {earlyBirdRemaining} из {earlyBirdLimit} мест по скидке
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
    const [earlyBirdRemaining, setEarlyBirdRemaining] = useState(27)
    const [earlyBirdLimit, setEarlyBirdLimit] = useState(100)
    const [payments, setPayments] = useState<PaymentHistoryItem[]>([])
    const { summary } = useDashboardSummary()

    useEffect(() => {
        api.get('/payments/history')
            .then((response) => setPayments(response.data.payments || []))
            .catch(() => setPayments([]))
    }, [])

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

    const expiresAt = user?.subscription_expires_at ? formatDay(user.subscription_expires_at) : ''
    const quota = summary?.quota

    return (
        <PageTransition className="space-y-6 sm:space-y-8">
            <div>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Ваш план подготовки</h1>
                <p className="mt-2 text-secondary">
                    {currentPlan === 'paid'
                        ? (expiresAt ? `Pro активен до ${expiresAt}` : 'Pro активен.')
                        : 'Сейчас активен тариф Basic.'}
                </p>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <section className="iv-panel p-5 sm:p-6">
                    <span className="iv-pill">Текущий тариф</span>
                    <h2 className="mt-3 text-2xl font-bold text-gray-900 dark:text-gray-100">{subscriptionPlanLabel(currentPlan)}</h2>
                    <p className="mt-2 text-sm text-secondary leading-relaxed">
                        {currentPlan === 'paid'
                            ? `До ${quota?.limit ?? PRO_TRAININGS_PER_DAY} тренировок в день, подробный разбор ошибок, подбор вакансий и экспорт отчёта.`
                            : FREE_PLAN.description}
                    </p>
                    {currentPlan === 'paid' && expiresAt && (
                        <p className="mt-4 text-sm text-gray-900 dark:text-gray-100">
                            Действует до <b>{expiresAt}</b>
                        </p>
                    )}
                    {payments.length > 0 && (
                        <div className="mt-5">
                            <p className="iv-eyebrow mb-2">История оплат</p>
                            <ul className="divide-y divide-gray-200 dark:divide-iv-dark-line">
                                {payments.map((payment) => (
                                    <li key={payment.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                                        <span className="min-w-0">
                                            <span className="block truncate text-gray-900 dark:text-gray-100">{payment.name}</span>
                                            <span className="text-xs text-secondary">{formatDay(payment.paid_at)}</span>
                                        </span>
                                        <b className="tabular-nums text-gray-900 dark:text-gray-100">{formatRub(payment.amount)}</b>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </section>

                <section className="iv-panel p-5 sm:p-6">
                    <p className="iv-eyebrow">{quota?.period === 'day' ? 'Лимит на сегодня' : 'Лимит тарифа'}</p>
                    {quota ? (
                        <>
                            <p className="mt-3 text-4xl font-bold tabular-nums text-gray-900 dark:text-gray-100">
                                {quota.used} <span className="text-lg font-medium text-secondary">/ {quota.limit} создано</span>
                            </p>
                            <div className="iv-track mt-4">
                                <span style={{ width: `${quota.limit > 0 ? Math.min(100, (quota.used / quota.limit) * 100) : 0}%` }} />
                            </div>
                            <p className="mt-3 text-xs text-secondary">
                                {quota.period === 'day'
                                    ? `Осталось ${quota.remaining}. Лимит обновится в 12:00 по Москве.`
                                    : quota.remaining > 0
                                        ? 'Бесплатная тренировка ещё доступна.'
                                        : 'Бесплатная тренировка использована. Больше тренировок в Pro.'}
                            </p>
                        </>
                    ) : (
                        <p className="mt-3 text-secondary">Не удалось загрузить лимит.</p>
                    )}
                </section>
            </div>

            <section>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {currentPlan === 'paid' ? 'Продлить Pro' : 'Выберите период Pro'}
                </h2>
                <p className="mt-1 text-sm text-secondary">
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
                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {paidOffers.map((plan) => (
                        <div key={plan.id} className="iv-panel p-5 flex flex-col">
                            <div className="flex items-start justify-between gap-2">
                                <h3 className="font-semibold text-gray-900 dark:text-gray-100">{plan.name.replace(/^Pro · /, '')}</h3>
                                {plan.badge && <span className="iv-pill">{plan.badge}</span>}
                            </div>
                            <div className="mt-3 flex-1">
                                <PriceBlock offer={plan} earlyBirdRemaining={earlyBirdRemaining} earlyBirdLimit={earlyBirdLimit} />
                            </div>
                            <Button
                                type="button"
                                variant="primary"
                                className="w-full justify-center"
                                loading={buyingPlan === plan.id}
                                disabled={buyingPlan !== null && buyingPlan !== plan.id}
                                onClick={() => void handleBuy(plan.id)}
                            >
                                {currentPlan === 'paid' ? 'Продлить' : 'Выбрать период'}
                            </Button>
                        </div>
                    ))}
                </div>
            </section>

            <section className="iv-panel p-5 sm:p-6">
                <p className="iv-eyebrow mb-3">Что входит в Pro</p>
                <ul className="grid gap-2.5 sm:grid-cols-2">
                    {PRO_FEATURES.map((feature) => (
                        <li key={feature} className="flex items-start gap-3 text-sm text-gray-800 dark:text-gray-200">
                            <Check className="w-4 h-4 mt-0.5 shrink-0 text-inter-verse-green dark:text-purple-300" strokeWidth={2} />
                            <span>{feature}</span>
                        </li>
                    ))}
                </ul>
            </section>

            <Link to="/tracks" className="iv-panel p-5 sm:p-6 flex items-start gap-4 hover:border-inter-verse-green dark:hover:border-purple-400 transition-iv">
                <span className="font-mono text-xs font-semibold pt-1 gradient-text-adaptive">СКОРО</span>
                <span>
                    <span className="block font-semibold text-gray-900 dark:text-gray-100">{PRO_TRACK_PLAN.name}</span>
                    <span className="block text-sm text-secondary mt-1">{PRO_TRACK_PLAN.description}</span>
                </span>
            </Link>
        </PageTransition>
    )
}
