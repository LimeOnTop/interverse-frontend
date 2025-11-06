import { motion } from 'framer-motion'
import {
    Monitor,
    Server,
    Settings,
    TestTube,
    Brain
} from 'lucide-react'

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
                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                    Выберите специализацию
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                    Выберите направление для проведения интервью
                </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {specializations.map((spec) => {
                    const Icon = spec.icon
                    const isSelected = selectedSpecialization === spec.id

                    return (
                        <motion.div
                            key={spec.id}
                            className={`card p-6 cursor-pointer transition-all duration-200 ${isSelected
                                ? 'ring-2 ring-inter-verse-green bg-green-50 dark:ring-purple-500 dark:bg-purple-900/20'
                                : 'hover:shadow-lg hover:border-gray-200 dark:hover:border-gray-600'
                                }`}
                            onClick={() => onSelect(spec.id)}
                        >
                            <div className="w-12 h-12 rounded-xl mb-4 flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                                <Icon className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                            </div>
                            <h3 className={`text-lg font-semibold mb-2 ${isSelected ? 'text-inter-verse-green dark:text-purple-400' : 'text-gray-900 dark:text-gray-100'
                                }`}>
                                {spec.name}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                                {spec.description}
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

            <div className="text-center">
                <button
                    onClick={onNext}
                    disabled={!selectedSpecialization}
                    className="btn-primary-adaptive disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Далее
                </button>
            </div>
        </motion.div>
    )
}
