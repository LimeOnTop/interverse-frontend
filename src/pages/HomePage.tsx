import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle } from 'lucide-react'
import PublicNav from '../components/PublicNav'
import HeroSlider from '../components/HeroSlider'
import ScrollDownIndicator from '../components/ScrollDownIndicator'
import Card from '../components/ui/Card'
import TestimonialsCarousel from '../components/TestimonialsCarousel'
import SiteFooter from '../components/SiteFooter'

const features = [
    {
        step: '1',
        title: 'Выбери направление',
        description: 'Frontend, Backend, DevOps, QA или Data Science — тренируйся под ту роль, на которую идёшь',
    },
    {
        step: '2',
        title: 'Укажи свои навыки',
        description: 'React, Go, Python, Kubernetes — вопросы и задачи под технологии из твоего резюме',
    },
    {
        step: '3',
        title: 'Задай уровень',
        description: 'Intern, Junior, Middle, Senior — сложность тренировки соответствует целевой позиции',
    },
]

const benefits = [
    'Симуляция реальных технических интервью',
    'Вопросы под ваш стек и уровень',
    'Разбор ошибок и слабых тем в отчёте',
    'Отслеживание прогресса между тренировками',
    'Подготовка к live-coding и system design',
    'Тренируйтесь в удобном темпе, без давления',
]

export default function HomePage() {
    return (
        <div className="min-h-screen relative bg-gray-50 dark:bg-iv-dark-bg">
            <PublicNav landing overlay />
            <HeroSlider />

            <div className="relative z-10">
                {/* Features */}
                <section id="landing-features" className="iv-landing-section iv-landing-section-glass bg-white dark:bg-iv-dark-surface/80 scroll-mt-0">
                    <div className="h-[10vh] min-h-[48px] flex items-center justify-center">
                        <ScrollDownIndicator targetId="landing-features-content" />
                    </div>
                    <div id="landing-features-content" className="max-w-content mx-auto px-6 lg:px-8 pb-20">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                            className="mb-12"
                        >
                            <h2 className="text-3xl font-bold tracking-tight mb-3">Как проходит тренировка</h2>
                            <p className="text-secondary max-w-xl">Три шага — и вы уже отрабатываете навыки на симуляции интервью</p>
                        </motion.div>

                        <div className="grid md:grid-cols-3 gap-6">
                            {features.map((feature, index) => (
                                    <motion.div
                                        key={feature.step}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.5, delay: index * 0.1 }}
                                    >
                                        <Card hover padding="lg" className="h-full">
                                            <span className="text-3xl font-bold gradient-text-adaptive tabular-nums">{feature.step}</span>
                                            <h3 className="text-lg font-semibold mt-3 mb-2">{feature.title}</h3>
                                            <p className="text-secondary text-sm leading-relaxed">{feature.description}</p>
                                        </Card>
                                    </motion.div>
                                ))}
                        </div>
                    </div>
                </section>

                {/* Testimonials */}
                <section className="iv-landing-section bg-gray-50 dark:bg-iv-dark-bg overflow-hidden">
                    <div className="max-w-content mx-auto px-6 lg:px-8 py-20">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                            className="mb-10"
                        >
                            <h2 className="text-3xl font-bold tracking-tight mb-3">Отзывы о тренировках</h2>
                            <p className="text-secondary max-w-xl">
                                Разработчики делятся, как симуляции помогли им подготовиться к реальным собеседованиям
                            </p>
                        </motion.div>
                    </div>
                    <div className="pb-20">
                        <TestimonialsCarousel />
                    </div>
                </section>

                {/* Benefits */}
                <section className="iv-landing-section">
                    <div className="max-w-content mx-auto px-6 lg:px-8 py-20">
                        <div className="grid lg:grid-cols-2 gap-12 items-center">
                            <div>
                                <h2 className="text-3xl font-bold tracking-tight mb-3">Готовься как к настоящему интервью</h2>
                                <p className="text-secondary mb-8">Системная практика вместо хаотичного зубрёжки перед собеседованием</p>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {benefits.map((benefit, index) => (
                                        <motion.div
                                            key={benefit}
                                            initial={{ opacity: 0, x: -12 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: index * 0.05 }}
                                            className="flex items-start gap-3"
                                        >
                                            <CheckCircle className="w-5 h-5 text-inter-verse-green dark:text-purple-400 shrink-0 mt-0.5" strokeWidth={1.75} />
                                            <span className="text-sm text-gray-700 dark:text-gray-300">{benefit}</span>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                            <Card padding="lg" className="gradient-bg-adaptive text-white border-0 shadow-iv-xl">
                                <h3 className="text-2xl font-bold mb-3">Пора тренироваться?</h3>
                                <p className="text-white/80 text-sm mb-6 leading-relaxed">
                                    Зарегистрируйся и пройди первую симуляцию интервью за несколько минут — бесплатно.
                                </p>
                                <Link
                                    to="/register"
                                    className="inline-flex items-center gap-2 bg-white text-inter-verse-green dark:text-purple-700 px-6 py-3 font-medium hover:bg-gray-100 transition-iv"
                                >
                                    Начать тренировку
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </Card>
                        </div>
                    </div>
                </section>

                <SiteFooter />
            </div>
        </div>
    )
}
