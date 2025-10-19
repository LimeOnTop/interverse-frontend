import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle, Users, FileText, BarChart3 } from 'lucide-react'

export default function HomePage() {
    return (
        <div className="min-h-screen bg-white dark:bg-gray-900">
            {/* Header */}
            <header className="px-8 py-6">
                <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold gradient-text-adaptive">
                        InterVerse
                    </div>
                    <div className="flex items-center space-x-4">
                        <Link
                            to="/login"
                            className="text-gray-600 dark:text-purple-300 hover:text-gray-900 dark:hover:text-purple-200 transition-colors duration-200"
                        >
                            Войти
                        </Link>
                        <Link
                            to="/register"
                            className="btn-primary-adaptive dark:hover:brightness-110"
                        >
                            Регистрация
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="px-8 py-20">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
                            Создай интервью за{' '}
                            <span className="gradient-text-adaptive">3 шага</span>
                        </h1>
                        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
                            Платформа для стандартизации технических интервью.
                            Создавайте структурированные интервью, оценивайте кандидатов
                            и получайте подробные отчёты.
                        </p>
                        <Link
                            to="/register"
                            className="btn-primary-adaptive inline-flex items-center space-x-2 text-lg px-8 py-4"
                        >
                            <span>Создать интервью</span>
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* Features Section */}
            <section className="px-8 py-20 bg-gray-50 dark:bg-gray-800/50">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                            Как это работает
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                            Простой и эффективный процесс создания технических интервью
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                step: '1',
                                title: 'Выберите специализацию',
                                description: 'Frontend, Backend, DevOps, QA или Data Science',
                                icon: Users,
                            },
                            {
                                step: '2',
                                title: 'Выберите стек технологий',
                                description: 'React, Vue, Angular, Golang, Node.js и другие',
                                icon: FileText,
                            },
                            {
                                step: '3',
                                title: 'Выберите уровень кандидата',
                                description: 'Intern, Junior, Middle, Senior или Lead',
                                icon: BarChart3,
                            },
                        ].map((feature, index) => {
                            const Icon = feature.icon
                            return (
                                <motion.div
                                    key={feature.step}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                                    className="card p-8 text-center"
                                >
                                    <div className="w-16 h-16 gradient-bg-adaptive rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Icon className="w-8 h-8 text-white" />
                                    </div>
                                    <div className="text-4xl font-bold gradient-text-adaptive mb-4">
                                        {feature.step}
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                        {feature.title}
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-300">
                                        {feature.description}
                                    </p>
                                </motion.div>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="px-8 py-20">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                            Преимущества InterVerse
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300">
                            Современные инструменты для эффективного проведения интервью
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {[
                            'Структурированные интервью по специализациям',
                            'Автоматическая генерация отчётов',
                            'Система оценок по ключевым компетенциям',
                            'Управление кандидатами и историей интервью',
                            'Экспорт отчётов в PDF',
                            'Адаптивный интерфейс для всех устройств',
                        ].map((benefit, index) => (
                            <motion.div
                                key={benefit}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                                className="flex items-center space-x-3"
                            >
                                <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                                <span className="text-gray-700 dark:text-gray-300">{benefit}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="px-8 py-20 gradient-bg-adaptive">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                    >
                        <h2 className="text-3xl font-bold text-white mb-4">
                            Готовы начать?
                        </h2>
                        <p className="text-green-100 dark:text-purple-200 mb-8 text-lg">
                            Создайте свой первый интервью прямо сейчас
                        </p>
                        <Link
                            to="/register"
                            className="bg-white text-inter-verse-green dark:text-purple-600 px-8 py-4 rounded-xl font-medium hover:bg-gray-100 dark:hover:bg-gray-100 transition-all duration-200 inline-flex items-center space-x-2"
                        >
                            <span>Начать бесплатно</span>
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="px-8 py-12 border-t border-gray-200 dark:border-gray-700">
                <div className="max-w-4xl mx-auto text-center text-gray-600 dark:text-gray-400">
                    <p>&copy; 2024 InterVerse. Все права защищены.</p>
                </div>
            </footer>
        </div>
    )
}
