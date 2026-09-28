import { Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { useEffect } from 'react'
import PageHeader from '../components/ui/PageHeader'
import PageTransition from '../components/ui/PageTransition'
import Button from '../components/ui/Button'
import { useAuthStore } from '../store/authStore'
import { api } from '../services/api'
import {
    SUBSCRIPTION_PLANS,
    resolveSubscriptionPlan,
    subscriptionPlanLabel,
} from '../utils/subscription'

export default function SubscriptionPage() {
    const { user, accessToken } = useAuthStore()
    const currentPlan = resolveSubscriptionPlan(user)

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

    const handleBuy = () => {
        toast('Оплата тарифа Pro скоро будет доступна')
    }

    return (
        <PageTransition>
            <PageHeader title="Подписка" />

            <div className="mb-6 max-w-4xl space-y-1">
                <p className="text-sm text-secondary leading-relaxed">
                    Сейчас активен тариф {subscriptionPlanLabel(currentPlan)}. Выберите подходящий вариант.
                </p>
                <p className="text-sm text-secondary leading-relaxed">
                    Оплата тарифа Pro означает согласие с условиями{' '}
                    <a
                        href="/legal/oferta.docx"
                        className="font-medium text-inter-verse-green dark:text-purple-400 hover:underline"
                        download
                    >
                        публичной оферты
                    </a>
                    .
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2 max-w-4xl">
                {SUBSCRIPTION_PLANS.map((plan) => {
                    const isCurrent = plan.id === currentPlan

                    return (
                        <section
                            key={plan.id}
                            className={`iv-form-card p-8 flex flex-col ${
                                isCurrent
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
                                {isCurrent && (
                                    <span className="text-xs font-medium text-inter-verse-green dark:text-purple-300 bg-inter-verse-green/10 dark:bg-purple-500/15 px-2.5 py-1 rounded-md">
                                        Активен
                                    </span>
                                )}
                            </div>

                            <p className="text-sm text-secondary mb-6 leading-relaxed">
                                {plan.description}
                            </p>

                            <div className="mb-6">
                                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                                    {plan.price}
                                </div>
                                <div className="text-sm text-secondary mt-1">{plan.priceHint}</div>
                            </div>

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

                            {isCurrent ? (
                                <div className="w-full text-center py-3 text-sm font-medium text-secondary border border-gray-200 dark:border-gray-600 rounded-lg">
                                    Текущий вариант
                                </div>
                            ) : plan.paid ? (
                                <Button
                                    type="button"
                                    className="w-full justify-center"
                                    onClick={handleBuy}
                                >
                                    Купить
                                </Button>
                            ) : (
                                <div className="w-full text-center py-3 text-sm text-secondary">
                                    Доступен без оплаты
                                </div>
                            )}
                        </section>
                    )
                })}
            </div>
        </PageTransition>
    )
}
