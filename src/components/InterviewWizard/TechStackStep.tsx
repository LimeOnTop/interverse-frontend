import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search } from 'lucide-react'
import Button from '../ui/Button'
import { useTechnologySearch } from '../../hooks/useTechnologySearch'

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
    const [isSearchOpen, setIsSearchOpen] = useState(false)
    const { isSearchActive, searchResults, isSearching } = useTechnologySearch(searchTerm)

    const availableTechs = techStacks[selectedSpecialization as keyof typeof techStacks] || []
    const displayedTechs = isSearchActive ? searchResults : availableTechs

    const handleTechSelect = (tech: string) => {
        if (selectedTechStack.includes(tech)) {
            onUpdateTechStack(selectedTechStack.filter(t => t !== tech))
        } else {
            onUpdateTechStack([...selectedTechStack, tech])
        }
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
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    Выберите навыки
                </h2>
                <p className="text-secondary text-sm">
                    Отметьте технологии, которые хотите прокачать на тренировке
                </p>
            </div>

            <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {selectedTechStack.length > 0
                            ? `Выбранные технологии (${selectedTechStack.length})`
                            : 'Выбранные технологии'
                        }
                    </h3>
                    <div
                        className="relative flex items-center"
                        onMouseEnter={() => { if (!isSearchOpen) setIsSearchOpen(true) }}
                        onMouseLeave={() => { if (isSearchOpen && !searchTerm) setIsSearchOpen(false) }}
                    >
                        <AnimatePresence>
                            {isSearchOpen && (
                                <motion.div
                                    key="search-input"
                                    initial={{ opacity: 0, width: 0, x: 20 }}
                                    animate={{ opacity: 1, width: 220, x: 0 }}
                                    exit={{ opacity: 0, width: 0, x: 20 }}
                                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                                    className="mr-2 overflow-hidden"
                                >
                                    <input
                                        type="text"
                                        placeholder="поиск технологии"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="input-field-underlined text-sm w-full"
                                        autoFocus
                                        onBlur={() => { if (!searchTerm) setIsSearchOpen(false) }}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <button
                            onClick={(e) => { e.preventDefault(); setIsSearchOpen(true) }}
                            className="btn-icon"
                            aria-label="Поиск технологий"
                        >
                            <Search className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {selectedTechStack.length > 0 ? (
                    <div className="wizard-stack-panel">
                        <div className="flex flex-wrap gap-2">
                            {selectedTechStack.map((tech) => (
                                <button
                                    key={tech}
                                    type="button"
                                    onClick={() => handleTechSelect(tech)}
                                    className="wizard-stack-chip cursor-pointer hover:opacity-70 transition-iv"
                                    aria-label={`Убрать ${tech}`}
                                >
                                    {tech}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="wizard-stack-panel flex items-center">
                        <p className="text-sm text-secondary">Пока ничего не выбрано — отметьте технологии ниже</p>
                    </div>
                )}
            </div>

            <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    {isSearchActive ? 'Результаты поиска' : 'Доступные технологии'}
                </h3>
                {isSearchActive && isSearching ? (
                    <p className="text-sm text-secondary mb-3">Ищем технологии…</p>
                ) : null}
                {isSearchActive && !isSearching && displayedTechs.length === 0 ? (
                    <p className="text-sm text-secondary">Ничего не найдено — попробуйте другой запрос</p>
                ) : (
                    <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {displayedTechs.map((tech) => {
                            const isSelected = selectedTechStack.includes(tech)

                            return (
                                <motion.button
                                    key={tech}
                                    type="button"
                                    onClick={() => handleTechSelect(tech)}
                                    whileTap={{ scale: 0.98 }}
                                    className={`wizard-tech-chip ${isSelected ? 'wizard-tech-chip-selected' : ''}`}
                                >
                                    {tech}
                                </motion.button>
                            )
                        })}
                    </div>
                )}
            </div>

            <div className="flex justify-between">
                <Button variant="secondary" onClick={onBack}>Назад</Button>
                <Button onClick={onNext} disabled={selectedTechStack.length === 0}>Далее</Button>
            </div>
        </motion.div>
    )
}
