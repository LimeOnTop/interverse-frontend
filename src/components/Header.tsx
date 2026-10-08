import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { LogOut, User, Menu, ChevronDown } from 'lucide-react'
import ThemeToggle from './ThemeToggle'
import { motion, AnimatePresence } from 'framer-motion'
import { NAVIGATION } from './navigation'
import BrandWordmark from './BrandWordmark'
import UserAvatar from './UserAvatar'

const routeTitles: Record<string, string> = {
    ...Object.fromEntries(NAVIGATION.map((item) => [item.href, item.name])),
    '/calendar': 'Прогресс',
    '/subscription': 'Подписка',
    '/interviews/create': 'Новая тренировка',
}

interface HeaderProps {
    onMenuClick?: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
    const { user, logout } = useAuthStore()
    const navigate = useNavigate()
    const location = useLocation()
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    const pageTitle = Object.entries(routeTitles)
        .sort(([a], [b]) => b.length - a.length)
        .find(([path]) => location.pathname.startsWith(path))?.[1]

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

    return (
        <header className="iv-header px-2 sm:px-4 lg:px-6">
            <div className="h-full flex items-center justify-between gap-2 sm:gap-4">
                <div className="flex items-center gap-1 sm:gap-4 min-w-0">
                    <button
                        onClick={onMenuClick}
                        className="btn-icon lg:hidden"
                        aria-label="Открыть меню"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                    <Link
                        to="/dashboard"
                        className="inline-flex items-center min-h-[44px] shrink-0 hover:opacity-80 transition-iv"
                    >
                        <BrandWordmark />
                    </Link>
                    {pageTitle && (
                        <>
                            <span className="hidden sm:inline text-gray-300 dark:text-gray-600">/</span>
                            <span className="hidden sm:inline text-sm font-medium text-secondary">{pageTitle}</span>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-1 sm:gap-3">
                    <ThemeToggle className="hidden sm:inline-flex" />

                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            aria-label="Меню профиля"
                            className="flex items-center gap-2 px-2 sm:px-3 py-2 hover:bg-gray-50 dark:hover:bg-iv-dark-bg transition-iv min-h-[44px]"
                        >
                            <UserAvatar size="sm" />
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
