import { motion } from 'framer-motion'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

interface ThemeToggleProps {
    iconClassName?: string
    className?: string
}

export default function ThemeToggle({ iconClassName = '', className = '' }: ThemeToggleProps) {
    const { isDark, toggleTheme } = useTheme()

    return (
        <button
            onClick={toggleTheme}
            className={`btn-icon relative overflow-hidden min-w-[44px] min-h-[44px] ${className}`}
            aria-label="Переключить тему"
        >
            <motion.div
                key={isDark ? 'dark' : 'light'}
                initial={{ rotate: -180, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
                {isDark ? (
                    <Moon className={`w-5 h-5 ${iconClassName || 'text-purple-400'}`} strokeWidth={1.75} />
                ) : (
                    <Sun className={`w-5 h-5 ${iconClassName || 'text-inter-verse-green'}`} strokeWidth={1.75} />
                )}
            </motion.div>
        </button>
    )
}
