import { useRevealMotion } from '../../hooks/useRevealMotion'
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
        description: 'Основы и первые решения',
        experience: 'Знакомство с темами',
        icon: Star,
    },
    {
        id: 'junior',
        name: 'Junior',
        description: 'Базовые вопросы',
        experience: 'Закрепление основ',
        icon: TrendingUp,
    },
    {
        id: 'middle',
        name: 'Middle',
        description: 'Самостоятельные решения',
        experience: 'Применение знаний',
        icon: Users,
    },
    {
        id: 'senior',
        name: 'Senior',
        description: 'Сложные вопросы и компромиссы',
        experience: 'Углублённая практика',
        icon: Award,
    },
    {
        id: 'lead',
        name: 'Lead',
        description: 'Системный подход',
        experience: 'Комплексные решения',
        icon: Crown,
    },
]

export default function LevelStep({
    selectedLevel,
    onSelect,
    onNext,
    onBack,
}: LevelStepProps) {
    const reveal = useRevealMotion()
    return (
        <motion.div data-motion-owned
            {...reveal}
            className="max-w-4xl mx-auto"
        >
            <div className="text-center mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    Выбери сложность
                </h2>
                <p className="text-secondary text-sm">
                    Выбери сложность вопросов. Она не определяет твой профессиональный уровень.
                </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
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
                            <div className="flex items-center gap-4 sm:block">
                                <div className="wizard-option-icon shrink-0 !mb-0 sm:!mb-4">
                                    <Icon className="w-6 h-6" strokeWidth={1.75} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className={`text-base sm:text-lg font-semibold mb-0.5 sm:mb-2 ${isSelected ? 'text-inter-verse-green dark:text-purple-400' : 'text-gray-900 dark:text-gray-100'}`}>
                                        {level.name}
                                        <span className="sm:hidden text-xs font-normal text-secondary ml-2">{level.experience}</span>
                                    </h3>
                                    <p className="text-secondary text-sm sm:mb-2">
                                        {level.description}
                                    </p>
                                    <p className="hidden sm:block text-xs text-secondary">
                                        {level.experience}
                                    </p>
                                </div>
                                {isSelected && (
                                    <Check className="sm:hidden w-5 h-5 shrink-0 text-inter-verse-green dark:text-purple-400" strokeWidth={2} />
                                )}
                            </div>
                            {isSelected && (
                                <div className="hidden sm:flex mt-4 items-center text-inter-verse-green dark:text-purple-400 text-sm font-medium">
                                    <Check className="w-4 h-4 mr-2" strokeWidth={2} />
                                    Выбрано
                                </div>
                            )}
                        </Card>
                    )
                })}
            </div>

            <div className="wizard-actions">
                <Button variant="secondary" onClick={onBack}>Назад</Button>
                <Button onClick={onNext} disabled={!selectedLevel}>Далее</Button>
            </div>
        </motion.div>
    )
}
