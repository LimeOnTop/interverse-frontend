import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import PublicNav from '../components/PublicNav'
import SiteFooter from '../components/SiteFooter'
import PageTransition from '../components/ui/PageTransition'
import { SUBSCRIPTION_PLANS } from '../utils/subscription'

export default function PricingPage() {
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
                        {SUBSCRIPTION_PLANS.map((plan) => (
                            <section
                                key={plan.id}
                                className={`iv-form-card p-8 flex flex-col ${
                                    plan.paid
                                        ? 'ring-2 ring-inter-verse-green dark:ring-purple-400'
                                        : ''
                                }`}
                            >
                                <div className="iv-form-card-shine-clip" aria-hidden>
                                    <div className="iv-form-card-shine" />
                                </div>

                                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                                    {plan.name}
                                </h2>
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

                                {plan.paid ? (
                                    <Link
                                        to="/register"
                                        className="btn-primary-adaptive w-full text-center justify-center py-3"
                                    >
                                        Начать с Pro
                                    </Link>
                                ) : (
                                    <Link
                                        to="/register"
                                        className="w-full text-center py-3 text-sm font-medium text-secondary border border-gray-200 dark:border-gray-600 rounded-lg hover:border-inter-verse-green dark:hover:border-purple-400 transition-iv"
                                    >
                                        Зарегистрироваться бесплатно
                                    </Link>
                                )}
                            </section>
                        ))}
                    </div>
                </section>
            </PageTransition>

            <SiteFooter />
        </div>
    )
}
