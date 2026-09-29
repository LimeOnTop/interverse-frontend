import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, X } from 'lucide-react'
import { useTechnologySearch } from '../hooks/useTechnologySearch'

interface ProfileSkillsEditorProps {
    skills: string[]
    onChange: (skills: string[]) => void
}

export default function ProfileSkillsEditor({ skills, onChange }: ProfileSkillsEditorProps) {
    const [isSearchOpen, setIsSearchOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const { isSearchActive, searchResults, isSearching } = useTechnologySearch(searchTerm)

    const toggleSkill = (tech: string) => {
        if (skills.includes(tech)) {
            onChange(skills.filter((item) => item !== tech))
        } else {
            onChange([...skills, tech])
        }
    }

    const closeSearchIfEmpty = () => {
        if (!searchTerm) setIsSearchOpen(false)
    }

    return (
        <div className="space-y-4">
            {skills.length > 0 ? (
                <div className="wizard-stack-panel">
                    <div className="flex flex-wrap gap-2">
                        {skills.map((tech) => (
                            <button
                                key={tech}
                                type="button"
                                onClick={() => toggleSkill(tech)}
                                className="wizard-stack-chip cursor-pointer hover:opacity-70 transition-iv inline-flex items-center gap-1"
                                aria-label={`Убрать ${tech}`}
                            >
                                {tech}
                                <X className="w-3.5 h-3.5 opacity-70" strokeWidth={2} />
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="wizard-stack-panel flex items-center">
                    <p className="text-sm text-secondary">Пока нет навыков — добавьте через поиск</p>
                </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
                <AnimatePresence initial={false}>
                    {isSearchOpen && (
                        <motion.div
                            key="search-input"
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 240 }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="overflow-hidden"
                        >
                            <input
                                type="text"
                                placeholder="поиск технологии"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="input-field-underlined text-sm w-full"
                                autoFocus
                                onBlur={closeSearchIfEmpty}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                <button
                    type="button"
                    onClick={() => setIsSearchOpen(true)}
                    className="btn-primary-adaptive text-sm px-4 py-2 inline-flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" strokeWidth={2.5} />
                    Добавить навык
                </button>
            </div>

            {isSearchOpen && isSearchActive && (
                <div>
                    {isSearching ? (
                        <p className="text-sm text-secondary">Ищем технологии…</p>
                    ) : searchResults.length === 0 ? (
                        <p className="text-sm text-secondary">Ничего не найдено — попробуйте другой запрос</p>
                    ) : (
                        <div className="grid sm:grid-cols-2 gap-2">
                            {searchResults.map((tech) => {
                                const isSelected = skills.includes(tech)
                                return (
                                    <motion.button
                                        key={tech}
                                        type="button"
                                        onClick={() => toggleSkill(tech)}
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
            )}
        </div>
    )
}
