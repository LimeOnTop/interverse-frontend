import React from 'react'
import { motion } from 'framer-motion'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

const ThemeToggle: React.FC = () => {
    const { isDark, toggleTheme } = useTheme()

    return (
        <div className="flex items-center space-x-3">
            <Sun className={`w-4 h-4 transition-colors duration-200 ${!isDark ? 'text-yellow-500' : 'text-gray-400'}`} />

            <button
                onClick={toggleTheme}
                className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                style={{
                    backgroundColor: isDark ? '#4c1d95' : '#e5e7eb'
                }}
                aria-label="Переключить тему"
            >
                <motion.div
                    className="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg"
                    animate={{
                        x: isDark ? 20 : 4,
                    }}
                    transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30
                    }}
                />
            </button>

            <Moon className={`w-4 h-4 transition-colors duration-200 ${isDark ? 'text-purple-400' : 'text-gray-400'}`} />
        </div>
    )
}

export default ThemeToggle
