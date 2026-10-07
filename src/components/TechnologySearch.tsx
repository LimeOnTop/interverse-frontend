import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Check } from 'lucide-react'

interface Technology {
    id: string
    name: string
    category: string
    description: string
    popularity: number
}

interface TechnologySearchProps {
    selectedTechnologies: string[]
    onTechnologiesChange: (technologies: string[]) => void
    category?: string
    placeholder?: string
}

const TechnologySearch: React.FC<TechnologySearchProps> = ({
    selectedTechnologies,
    onTechnologiesChange,
    category,
    placeholder = "Поиск технологий..."
}) => {
    const [query, setQuery] = useState('')
    const [technologies, setTechnologies] = useState<Technology[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const searchRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // Fetch technologies based on query
    useEffect(() => {
        const fetchTechnologies = async () => {
            if (query.length < 2) {
                setTechnologies([])
                return
            }

            setIsLoading(true)
            try {
                const params = new URLSearchParams({
                    q: query,
                    limit: '10'
                })

                if (category) {
                    params.append('category', category)
                }

                const response = await fetch(`/api/v1/technologies/search?${params}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                })

                if (response.ok) {
                    const data = await response.json()
                    setTechnologies(data.technologies || [])
                }
            } catch (error) {
                console.error('Error fetching technologies:', error)
            } finally {
                setIsLoading(false)
            }
        }

        const timeoutId = setTimeout(fetchTechnologies, 300)
        return () => clearTimeout(timeoutId)
    }, [query, category])

    // Fetch popular technologies when dropdown opens
    useEffect(() => {
        const fetchPopularTechnologies = async () => {
            if (!isOpen || query.length >= 2) return

            setIsLoading(true)
            try {
                const params = new URLSearchParams({
                    limit: '20'
                })

                if (category) {
                    params.append('category', category)
                }

                const response = await fetch(`/api/v1/technologies?${params}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                })

                if (response.ok) {
                    const data = await response.json()
                    setTechnologies(data.technologies || [])
                }
            } catch (error) {
                console.error('Error fetching popular technologies:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchPopularTechnologies()
    }, [isOpen, category])

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleTechnologySelect = (technology: Technology) => {
        if (!selectedTechnologies.includes(technology.name)) {
            onTechnologiesChange([...selectedTechnologies, technology.name])
        }
        setQuery('')
        setIsOpen(false)
    }

    const handleTechnologyRemove = (technology: string) => {
        onTechnologiesChange(selectedTechnologies.filter(t => t !== technology))
    }

    const getCategoryColor = (category: string) => {
        return category
            ? 'font-semibold text-inter-verse-green dark:text-purple-400'
            : 'text-secondary'
    }

    return (
        <div className="relative" ref={searchRef}>
            {/* Selected Technologies */}
            {selectedTechnologies.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                    {selectedTechnologies.map((tech) => (
                        <motion.div
                            key={tech}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="inline-flex items-center gap-2 px-3 py-1 gradient-bg-adaptive text-white rounded-md text-sm"
                        >
                            <span>{tech}</span>
                            <button
                                onClick={() => handleTechnologyRemove(tech)}
                                className="hover:bg-white dark:bg-iv-dark-surface hover:bg-opacity-20 rounded-md p-0.5 transition-colors"
                            >
                                <X size={14} />
                            </button>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Search Input */}
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsOpen(true)}
                    placeholder={placeholder}
                    className="input-field pl-10 pr-4"
                />
                {isLoading && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <div className="iv-spinner h-4 w-4" />
                    </div>
                )}
            </div>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-50 w-full mt-2 bg-white dark:bg-iv-dark-surface border border-gray-200 dark:border-iv-dark-line rounded-md shadow-lg max-h-60 overflow-y-auto"
                    >
                        {technologies.length === 0 && !isLoading ? (
                            <div className="p-4 text-center text-gray-500">
                                {query.length < 2 ? 'Начните вводить название технологии...' : 'Технологии не найдены'}
                            </div>
                        ) : (
                            technologies.map((tech) => {
                                const isSelected = selectedTechnologies.includes(tech.name)
                                return (
                                    <motion.div
                                        key={tech.id}
                                        whileHover={{ backgroundColor: '#f8fafc' }}
                                        className={`p-3 cursor-pointer border-b border-gray-100 last:border-b-0 ${isSelected ? 'bg-green-50' : ''
                                            }`}
                                        onClick={() => !isSelected && handleTechnologySelect(tech)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-medium text-gray-900">{tech.name}</span>
                                                    <span className={`px-2 py-0.5 rounded-md text-xs ${getCategoryColor(tech.category)}`}>
                                                        {tech.category}
                                                    </span>
                                                </div>
                                                {tech.description && (
                                                    <p className="text-sm text-gray-600">{tech.description}</p>
                                                )}
                                            </div>
                                            {isSelected && (
                                                <Check className="h-5 w-5 text-inter-verse-green" />
                                            )}
                                        </div>
                                    </motion.div>
                                )
                            })
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default TechnologySearch
