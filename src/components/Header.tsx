import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { LogOut, User, Menu, ChevronDown } from 'lucide-react'
import ThemeToggle from './ThemeToggle'
import { motion, AnimatePresence } from 'framer-motion'

const routeTitles: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/activity': 'Активность',
    '/calendar': 'Активность',
    '/interview-service': 'Интервью',
    '/vacancies': 'Вакансии',
    '/reports': 'Отчёты',
    '/profile': 'Профиль',
    '/contribute': 'Предложить вопрос',
    '/subscription': 'Подписка',
    '/interviews/create': 'Новая тренировка',
}

interface HeaderProps {
    onMenuClick?: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
    const { user, logout, avatarUrl } = useAuthStore()
    const navigate = useNavigate()
    const location = useLocation()
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const [avatarError, setAvatarError] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    const pageTitle = Object.entries(routeTitles).find(([path]) =>
        location.pathname.startsWith(path)
    )?.[1]

    useEffect(() => {
        setAvatarError(false)
    }, [avatarUrl])

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleLogout = () => {
        logout()
        navigate('/')
    }

    const showAvatar = Boolean(avatarUrl) && !avatarError

    return (
        <header className="iv-header px-4 lg:px-6">
            <div className="h-full flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onMenuClick}
                        className="btn-icon lg:hidden"
                        aria-label="Открыть меню"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                    <Link
                        to="/dashboard"
                        className="text-xl font-bold gradient-text-adaptive tracking-tight hover:opacity-80 transition-iv"
                    >
                        InterVerse
                    </Link>
                    {pageTitle && (
                        <>
                            <span className="hidden sm:inline text-gray-300 dark:text-gray-600">/</span>
                            <span className="hidden sm:inline text-sm font-medium text-secondary">{pageTitle}</span>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <ThemeToggle />

                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-iv-dark-bg transition-iv min-h-[44px]"
                        >
                            <div className="w-8 h-8 bg-gray-100 dark:bg-iv-dark-bg border border-gray-200 dark:border-gray-600 flex items-center justify-center overflow-hidden shrink-0">
                                {showAvatar ? (
                                    <img
                                        src={avatarUrl!}
                                        alt={user?.name || 'Аватар'}
                                        className="w-full h-full object-cover"
                                        onError={() => setAvatarError(true)}
                                    />
                                ) : (
                                    <User className="w-4 h-4 text-gray-600 dark:text-gray-400" strokeWidth={1.75} />
                                )}
                            </div>
                            <span className="hidden sm:inline text-sm font-medium text-gray-700 dark:text-gray-300 max-w-[120px] truncate">
                                {user?.name}
                            </span>
                            <ChevronDown className={`w-4 h-4 text-gray-400 transition-iv ${dropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {dropdownOpen && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                    transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
                                    className="absolute right-0 mt-1 w-48 iv-dropdown py-1"
                                    style={{ position: 'absolute' }}
                                >
                                    <Link
                                        to="/profile"
                                        onClick={() => setDropdownOpen(false)}
                                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-iv-dark-bg transition-iv"
                                    >
                                        <User className="w-4 h-4" strokeWidth={1.75} />
                                        Профиль
                                    </Link>
                                    <div className="iv-divider my-1" />
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-iv-dark-bg transition-iv"
                                    >
                                        <LogOut className="w-4 h-4" strokeWidth={1.75} />
                                        Выйти
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </header>
    )
}
