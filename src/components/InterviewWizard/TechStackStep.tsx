import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, X } from 'lucide-react'

interface TechStackStepProps {
    selectedSpecialization: string
    selectedTechStack: string[]
    onUpdateTechStack: (techStack: string[]) => void
    onNext: () => void
    onBack: () => void
}

const techStacks = {
    frontend: [
        'React', 'Vue.js', 'Angular', 'TypeScript', 'JavaScript', 'HTML5', 'CSS3',
        'Sass', 'Less', 'Webpack', 'Vite', 'Next.js', 'Nuxt.js', 'Svelte', 'Tailwind CSS'
    ],
    backend: [
        'Node.js', 'Python', 'Go', 'Java', 'C#', 'PHP', 'Ruby', 'Rust', 'Express.js',
        'Django', 'Flask', 'Gin', 'Spring Boot', 'Laravel', 'Rails', 'Actix'
    ],
    devops: [
        'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'Terraform', 'Ansible',
        'Jenkins', 'GitLab CI', 'GitHub Actions', 'Prometheus', 'Grafana', 'ELK Stack'
    ],
    qa: [
        'Selenium', 'Cypress', 'Playwright', 'Jest', 'Mocha', 'Chai', 'TestNG',
        'JUnit', 'Postman', 'Newman', 'Appium', 'Robot Framework', 'Cucumber'
    ],
    data_science: [
        'Python', 'R', 'SQL', 'Pandas', 'NumPy', 'Scikit-learn', 'TensorFlow',
        'PyTorch', 'Jupyter', 'Tableau', 'Power BI', 'Apache Spark', 'Hadoop'
    ],
}

export default function TechStackStep({
    selectedSpecialization,
    selectedTechStack,
    onUpdateTechStack,
    onNext,
    onBack,
}: TechStackStepProps) {
    const [searchTerm, setSearchTerm] = useState('')

    const availableTechs = techStacks[selectedSpecialization as keyof typeof techStacks] || []
    const filteredTechs = availableTechs.filter(tech =>
        tech.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleTechSelect = (tech: string) => {
        if (selectedTechStack.includes(tech)) {
            onUpdateTechStack(selectedTechStack.filter(t => t !== tech))
        } else {
            onUpdateTechStack([...selectedTechStack, tech])
        }
    }

    const removeTech = (tech: string) => {
        onUpdateTechStack(selectedTechStack.filter(t => t !== tech))
    }

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
                    Выберите стек технологий
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                    Выберите технологии для оценки кандидата
                </p>
            </div>

            {/* Search */}
            <div className="mb-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Введите название технологии..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-field pl-10"
                    />
                </div>
            </div>

            {/* Selected Technologies */}
            {selectedTechStack.length > 0 && (
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                        Выбранные технологии ({selectedTechStack.length})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {selectedTechStack.map((tech) => (
                            <span
                                key={tech}
                                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-inter-verse-green dark:bg-purple-900/20 dark:text-purple-300"
                            >
                                {tech}
                                <button
                                    onClick={() => removeTech(tech)}
                                    className="ml-2 hover:text-green-600 dark:hover:text-purple-400"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Available Technologies */}
            <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    Доступные технологии
                </h3>
                <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {filteredTechs.map((tech) => {
                        const isSelected = selectedTechStack.includes(tech)

                        return (
                            <motion.button
                                key={tech}
                                onClick={() => handleTechSelect(tech)}
                                className={`p-3 rounded-xl text-sm font-medium transition-all duration-200 ${isSelected
                                    ? 'gradient-bg-adaptive text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                            >
                                {tech}
                            </motion.button>
                        )
                    })}
                </div>
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
                    disabled={selectedTechStack.length === 0}
                    className="btn-primary-adaptive disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Далее
                </button>
            </div>
        </motion.div>
    )
}
