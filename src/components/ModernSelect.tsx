import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Option {
    value: string
    label: string
    icon?: React.ReactNode
}

interface ModernSelectProps {
    options: Option[]
    value: string
    onChange: (value: string) => void
    placeholder: string
    className?: string
}

export default function ModernSelect({
    options,
    value,
    onChange,
    placeholder,
    className = '',
}: ModernSelectProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const selectRef = useRef<HTMLDivElement>(null)

    const selectedOption = options.find(option => option.value === value)

    const filteredOptions = options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
    )

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
                setIsOpen(false)
                setSearchTerm('')
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSelect = (option: Option) => {
        onChange(option.value)
        setIsOpen(false)
        setSearchTerm('')
    }

    return (
        <div className={`relative ${className}`} ref={selectRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-left focus:outline-none focus:ring-2 gradient-ring-adaptive focus:border-transparent transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-500 flex items-center justify-between"
            >
                <div className="flex items-center space-x-3">
                    {selectedOption?.icon}
                    <span className={selectedOption ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}>
                        {selectedOption?.label || placeholder}
                    </span>
                </div>
                <ChevronDown
                    className={`w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''
                        }`}
                />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="modern-select-dropdown"
                    >
                        <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                            <input
                                type="text"
                                placeholder="Поиск..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 gradient-ring-adaptive focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                        <div className="max-h-60 overflow-y-auto">
                            {filteredOptions.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => handleSelect(option)}
                                    className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 flex items-center justify-between group"
                                >
                                    <div className="flex items-center space-x-3">
                                        {option.icon}
                                        <span className="text-gray-900 dark:text-gray-100">{option.label}</span>
                                    </div>
                                    {value === option.value && (
                                        <Check className="w-4 h-4 text-inter-verse-green dark:text-purple-400" />
                                    )}
                                </button>
                            ))}
                            {filteredOptions.length === 0 && (
                                <div className="px-4 py-3 text-gray-500 dark:text-gray-400 text-sm">
                                    Ничего не найдено
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
