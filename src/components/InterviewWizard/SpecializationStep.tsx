import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import {
    Monitor,
    Server,
    Settings,
    TestTube,
    Brain
} from 'lucide-react'
import Card from '../ui/Card'

interface SpecializationStepProps {
    selectedSpecialization: string
    onSelect: (specialization: string) => void
    onNext: () => void
}

const specializations = [
    {
        id: 'frontend',
        name: 'Frontend',
        description: 'React, Vue, Angular, TypeScript',
        icon: Monitor,
    },
    {
        id: 'backend',
        name: 'Backend',
        description: 'Node.js, Python, Go, Java',
        icon: Server,
    },
    {
        id: 'devops',
        name: 'DevOps',
        description: 'Docker, Kubernetes, AWS, CI/CD',
        icon: Settings,
    },
    {
        id: 'qa',
        name: 'QA',
        description: 'Testing, Automation, Selenium',
        icon: TestTube,
    },
    {
        id: 'data_science',
        name: 'Data Science',
        description: 'Python, ML, Statistics, SQL',
        icon: Brain,
    },
]

export default function SpecializationStep({
    selectedSpecialization,
    onSelect,
    onNext,
}: SpecializationStepProps) {
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
                    Выберите направление
                </h2>
                <p className="text-secondary text-sm">
                    Какое направление вы хотите отработать на тренировке?
                </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {specializations.map((spec) => {
                    const Icon = spec.icon
                    const isSelected = selectedSpecialization === spec.id

                    return (
                        <Card
                            key={spec.id}
                            hover
                            padding="md"
                            className={`wizard-option-card ${isSelected ? 'wizard-option-card-selected' : ''}`}
                            onClick={() => {
                                onSelect(spec.id)
                                onNext()
                            }}
                        >
                            <div className="wizard-option-icon">
                                <Icon className="w-6 h-6" strokeWidth={1.75} />
                            </div>
                            <h3 className={`text-lg font-semibold mb-2 ${isSelected ? 'text-inter-verse-green dark:text-purple-400' : 'text-gray-900 dark:text-gray-100'}`}>
                                {spec.name}
                            </h3>
                            <p className="text-secondary text-sm">
                                {spec.description}
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
        </motion.div>
    )
}
