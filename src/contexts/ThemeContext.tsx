import React, { createContext, useContext, useState, useEffect } from 'react'

interface ThemeContextType {
    isDark: boolean
    toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const useTheme = () => {
    const context = useContext(ThemeContext)
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider')
    }
    return context
}

interface ThemeProviderProps {
    children: React.ReactNode
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
    const [isDark, setIsDark] = useState(() => {
        // Проверяем сохраненную тему в localStorage
        const savedTheme = localStorage.getItem('theme')
        if (savedTheme) {
            return savedTheme === 'dark'
        }
        // Если нет сохраненной темы, проверяем системные настройки
        return window.matchMedia('(prefers-color-scheme: dark)').matches
    })

    useEffect(() => {
        // Сохраняем тему в localStorage
        localStorage.setItem('theme', isDark ? 'dark' : 'light')

        // Применяем класс к body для темной темы
        if (isDark) {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
    }, [isDark])

    const toggleTheme = () => {
        document.documentElement.classList.add('theme-transition')
        setIsDark(!isDark)
        setTimeout(() => {
            document.documentElement.classList.remove('theme-transition')
        }, 300)
    }

    return (
        <ThemeContext.Provider value={{ isDark, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}
