import { flushSync } from 'react-dom'
import React, { createContext, useContext, useState, useEffect, useRef } from 'react'

interface ThemeContextType {
    isDark: boolean
    toggleTheme: (origin?: { x: number; y: number }) => void
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
        if (typeof window === 'undefined') return false
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
        document.querySelector('#theme-color')?.setAttribute('content', isDark ? '#14161b' : '#ffffff')

        // Применяем класс к body для темной темы
        if (isDark) {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
    }, [isDark])

    const transitionRef = useRef<{ skipTransition: () => void } | null>(null)
    const animationRef = useRef<Animation | null>(null)
    const changingRef = useRef(false)

    useEffect(() => () => {
        animationRef.current?.cancel()
        transitionRef.current?.skipTransition()
        document.documentElement.classList.remove('theme-transition', 'theme-wave')
    }, [])

    const toggleTheme = async (origin?: { x: number; y: number }) => {
        if (changingRef.current) return
        const root = document.documentElement
        const apply = () => flushSync(() => setIsDark(value => !value))
        const doc = document as Document & {
            startViewTransition?: (update: () => void) => {
                ready: Promise<void>
                finished: Promise<void>
                skipTransition: () => void
            }
        }
        if (!doc.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            apply()
            return
        }
        changingRef.current = true
        root.classList.add('theme-transition', 'theme-wave')
        let applied = false
        try {
            const transition = doc.startViewTransition(() => {
                apply()
                applied = true
            })
            transitionRef.current = transition
            // A background tab or interrupted snapshot can reject either promise.
            void transition.finished.catch(() => {})
            await transition.ready
            const x = origin?.x ?? window.innerWidth / 2
            const y = origin?.y ?? 32
            const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y)) * 1.16
            const frames = Array.from({ length: 33 }, (_, index) => {
                const progress = index / 32
                const points = Array.from({ length: 96 }, (_, point) => {
                    const angle = point / 96 * Math.PI * 2
                    // Several continuous harmonics form a softly uneven moving edge.
                    const ripple = Math.sin(angle * 5 + progress * 3.1) * .042
                        + Math.sin(angle * 9 - progress * 4.3) * .022
                        + Math.cos(angle * 3 + progress * 2) * .034
                    const distance = radius * progress * (1 + ripple)
                    return `${(x + Math.cos(angle) * distance).toFixed(2)}px ${(y + Math.sin(angle) * distance).toFixed(2)}px`
                }).join(',')
                return { clipPath: `polygon(${points})`, offset: progress }
            })
            const animation = root.animate(frames, {
                duration: 900,
                easing: 'cubic-bezier(.22,.8,.28,1)',
                pseudoElement: '::view-transition-new(root)',
                fill: 'both',
            } as KeyframeAnimationOptions)
            animationRef.current = animation
            await animation.finished
            animation.cancel()
            await transition.finished
        } catch {
            transitionRef.current?.skipTransition()
            if (!applied) apply()
        } finally {
            animationRef.current?.cancel()
            animationRef.current = null
            transitionRef.current = null
            root.classList.remove('theme-transition', 'theme-wave')
            changingRef.current = false
        }
    }

    return (
        <ThemeContext.Provider value={{ isDark, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}
