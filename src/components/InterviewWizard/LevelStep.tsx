import { motion } from 'framer-motion'
import { Star, TrendingUp, Users, Award, Crown, Check } from 'lucide-react'
import Card from '../ui/Card'
import Button from '../ui/Button'

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
    },
    {
        id: 'junior',
        name: 'Junior',
        description: 'Младший разработчик',
        experience: '1-2 года',
        icon: TrendingUp,
    },
    {
        id: 'middle',
        name: 'Middle',
        description: 'Средний разработчик',
        experience: '2-5 лет',
        icon: Users,
    },
    {
        id: 'senior',
        name: 'Senior',
        description: 'Старший разработчик',
        experience: '5+ лет',
        icon: Award,
    },
    {
        id: 'lead',
        name: 'Lead / CTO',
        description: 'Руководитель',
        experience: '7+ лет',
        icon: Crown,
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
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    Выберите грейд
                </h2>
                <p className="text-secondary text-sm">
                    На каком уровне вы планируете тренироваться?
                </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {levels.map((level) => {
                    const Icon = level.icon
                    const isSelected = selectedLevel === level.id

                    return (
                        <Card
                            key={level.id}
                            hover
                            padding="md"
                            className={`wizard-option-card ${isSelected ? 'wizard-option-card-selected' : ''}`}
                            onClick={() => onSelect(level.id)}
                        >
                            <div className="wizard-option-icon">
                                <Icon className="w-6 h-6" strokeWidth={1.75} />
                            </div>
                            <h3 className={`text-lg font-semibold mb-2 ${isSelected ? 'text-inter-verse-green dark:text-purple-400' : 'text-gray-900 dark:text-gray-100'}`}>
                                {level.name}
                            </h3>
                            <p className="text-secondary text-sm mb-2">
                                {level.description}
                            </p>
                            <p className="text-xs text-secondary">
                                {level.experience}
                            </p>
                            {isSelected && (
                                <div className="mt-4 flex items-center text-inter-verse-green dark:text-purple-400 text-sm font-medium">
                                    <Check className="w-4 h-4 mr-2" strokeWidth={2} />
                                    Выбрано
                                </div>
                            )}
                        </Card>
                    )
                })}
            </div>

            <div className="flex justify-between">
                <Button variant="secondary" onClick={onBack}>Назад</Button>
                <Button onClick={onNext} disabled={!selectedLevel}>Далее</Button>
            </div>
        </motion.div>
    )
}
