import { motion } from 'framer-motion'
import { Star, TrendingUp, Users, Award, Crown } from 'lucide-react'

interface LevelStepProps {
    selectedLevel: string
    onSelect: (level: string) => void
    onNext: () => void
    onBack: () => void
}

const levels = [
    {
        id: 'intern',
        name: 'Intern',
        description: 'Начинающий разработчик',
        experience: '0-1 год',
        icon: Star,
        color: 'bg-blue-100 text-blue-600',
    },
    {
        id: 'junior',
        name: 'Junior',
        description: 'Младший разработчик',
        experience: '1-2 года',
        icon: TrendingUp,
        color: 'bg-green-100 text-green-600',
    },
    {
        id: 'middle',
        name: 'Middle',
        description: 'Средний разработчик',
        experience: '2-5 лет',
        icon: Users,
        color: 'bg-yellow-100 text-yellow-600',
    },
    {
        id: 'senior',
        name: 'Senior',
        description: 'Старший разработчик',
        experience: '5+ лет',
        icon: Award,
        color: 'bg-purple-100 text-purple-600',
    },
    {
        id: 'lead',
        name: 'Lead / CTO',
        description: 'Руководитель',
        experience: '7+ лет',
        icon: Crown,
        color: 'bg-red-100 text-red-600',
    },
]

export default function LevelStep({
    selectedLevel,
    onSelect,
    onNext,
    onBack,
}: LevelStepProps) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="max-w-4xl mx-auto"
        >
            <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                    Выберите уровень кандидата
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                    Определите ожидаемый уровень кандидата
                </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {levels.map((level) => {
                    const Icon = level.icon
                    const isSelected = selectedLevel === level.id

                    return (
                        <motion.div
                            key={level.id}
                            className={`card p-6 cursor-pointer transition-all duration-200 ${isSelected
                                ? 'ring-2 ring-inter-verse-green bg-green-50 dark:ring-purple-500 dark:bg-purple-900/20'
                                : 'hover:shadow-lg hover:border-gray-200 dark:hover:border-gray-600'
                                }`}
                            onClick={() => onSelect(level.id)}
                        >
                            <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center ${isSelected ? 'gradient-bg-adaptive' : level.color
                                }`}>
                                <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : level.color.split(' ')[1]
                                    }`} />
                            </div>
                            <h3 className={`text-lg font-semibold mb-2 ${isSelected ? 'text-inter-verse-green dark:text-purple-400' : 'text-gray-900 dark:text-gray-100'
                                }`}>
                                {level.name}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                                {level.description}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                                {level.experience}
                            </p>
                            {isSelected && (
                                <div className="mt-4 flex items-center text-inter-verse-green dark:text-purple-400 text-sm font-medium">
                                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    Выбрано
                                </div>
                            )}
                        </motion.div>
                    )
                })}
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
                <button
                    onClick={onBack}
                    className="btn-secondary"
                >
                    Назад
                </button>
                <button
                    onClick={onNext}
                    disabled={!selectedLevel}
                    className="btn-primary-adaptive disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Далее
                </button>
            </div>
        </motion.div>
    )
}
