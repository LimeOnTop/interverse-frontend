import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
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
    borderless?: boolean
    /** Show search field. Default: true when there are more than 8 options. */
    searchable?: boolean
}

export default function ModernSelect({
    options,
    value,
    onChange,
    placeholder,
    className = '',
    borderless = false,
    searchable,
}: ModernSelectProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({})
    const selectRef = useRef<HTMLDivElement>(null)
    const menuRef = useRef<HTMLDivElement>(null)

    const showSearch = searchable ?? options.length > 8
    const selectedOption = options.find(option => option.value === value)

    const filteredOptions = options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const updateMenuPosition = () => {
        const trigger = selectRef.current
        if (!trigger) return

        const rect = trigger.getBoundingClientRect()
        const viewportPadding = 8
        const menuMaxHeight = 280
        const spaceBelow = window.innerHeight - rect.bottom - viewportPadding
        const spaceAbove = rect.top - viewportPadding
        const openUp = spaceBelow < Math.min(menuMaxHeight, 180) && spaceAbove > spaceBelow
        const available = Math.max(120, openUp ? spaceAbove : spaceBelow)

        setMenuStyle({
            position: 'fixed',
            left: rect.left,
            width: rect.width,
            zIndex: 80,
            maxHeight: Math.min(menuMaxHeight, available),
            ...(openUp
                ? { bottom: window.innerHeight - rect.top + 4 }
                : { top: rect.bottom + 4 }),
        })
    }

    useLayoutEffect(() => {
        if (!isOpen) return
        updateMenuPosition()
    }, [isOpen, filteredOptions.length, showSearch])

    useEffect(() => {
        if (!isOpen) return

        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node
            if (selectRef.current?.contains(target) || menuRef.current?.contains(target)) {
                return
            }
            setIsOpen(false)
            setSearchTerm('')
        }

        const handleReposition = () => updateMenuPosition()

        document.addEventListener('mousedown', handleClickOutside)
        window.addEventListener('resize', handleReposition)
        window.addEventListener('scroll', handleReposition, true)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            window.removeEventListener('resize', handleReposition)
            window.removeEventListener('scroll', handleReposition, true)
        }
    }, [isOpen])

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
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                className={`w-full px-4 py-3 iv-surface border border-gray-200 dark:border-iv-dark-line rounded-xl text-left focus:outline-none focus:ring-2 gradient-ring-adaptive transition-[color,background-color,border-color,box-shadow] duration-200 flex items-center justify-between ${
                    borderless
                        ? 'border-0'
                        : 'border border-gray-200 dark:border-iv-dark-line focus:border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                }`}
            >
                <div className="flex items-center space-x-3 min-w-0">
                    {selectedOption?.icon}
                    <span className={`truncate ${selectedOption ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}>
                        {selectedOption?.label || placeholder}
                    </span>
                </div>
                <ChevronDown
                    className={`w-5 h-5 shrink-0 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            ref={menuRef}
                            role="listbox"
                            initial={{ opacity: 0, y: -6, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -6, scale: 0.98 }}
                            transition={{ duration: 0.15 }}
                            style={menuStyle}
                            className="modern-select-dropdown modern-select-dropdown-portal"
                        >
                            {showSearch && (
                                <div className="p-3 border-b border-gray-100 dark:border-iv-dark-line shrink-0">
                                    <input
                                        type="text"
                                        placeholder="Поиск..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-iv-dark-line rounded-lg focus:outline-none focus:ring-2 gradient-ring-adaptive focus:border-transparent bg-white dark:bg-iv-dark-bg text-gray-900 dark:text-gray-100"
                                        onClick={(e) => e.stopPropagation()}
                                        autoFocus
                                    />
                                </div>
                            )}
                            <div className="overflow-y-auto overscroll-contain" style={{ maxHeight: showSearch ? 'calc(100% - 3.5rem)' : '100%' }}>
                                {filteredOptions.map((option) => (
                                    <button
                                        key={option.value === '' ? '__empty__' : option.value}
                                        type="button"
                                        role="option"
                                        aria-selected={value === option.value}
                                        onClick={() => handleSelect(option)}
                                        className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 flex items-center justify-between group"
                                    >
                                        <div className="flex items-center space-x-3 min-w-0">
                                            {option.icon}
                                            <span className="text-gray-900 dark:text-gray-100 truncate">{option.label}</span>
                                        </div>
                                        {value === option.value && (
                                            <Check className="w-4 h-4 shrink-0 text-inter-verse-green dark:text-purple-400" />
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
                </AnimatePresence>,
                document.body,
            )}
        </div>
    )
}
