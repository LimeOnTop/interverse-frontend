import { ReactNode, useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { BarChart3, ClipboardCheck, HelpCircle, LineChart, LogOut, Menu, X } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import ThemeToggle from './ThemeToggle'

const navigation = [
    { name: 'Статистика', href: '/admin', icon: BarChart3, end: true },
    { name: 'Модерация', href: '/admin/moderation', icon: ClipboardCheck, end: false },
    { name: 'Вопросы', href: '/admin/questions', icon: HelpCircle, end: false },
]

interface AdminLayoutProps {
    children: ReactNode
}

function NavContent({ onNavigate }: { onNavigate?: () => void }) {
    const { logout, user } = useAuthStore()

    return (
        <>
            <div className="px-4 pt-5 pb-4 border-b border-gray-200 dark:border-iv-dark-line">
                <Link
                    to="/admin"
                    onClick={onNavigate}
                    className="text-lg font-bold gradient-text-adaptive tracking-tight"
                >
                    InterVerse Admin
                </Link>
                <p className="mt-1 text-xs text-secondary truncate">{user?.email}</p>
            </div>

            <nav className="px-3 py-4 space-y-1 flex-1">
                {navigation.map((item) => {
                    const Icon = item.icon
                    return (
                        <NavLink
                            key={item.name}
                            to={item.href}
                            end={item.end}
                            onClick={onNavigate}
                            className={({ isActive }) =>
                                `iv-nav-item ${isActive ? 'iv-nav-item-active' : ''}`
                            }
                        >
                            <Icon className="w-5 h-5 shrink-0" strokeWidth={1.75} />
                            <span>{item.name}</span>
                        </NavLink>
                    )
                })}
                <a
                    href="/metrics-login"
                    onClick={onNavigate}
                    className="iv-nav-item"
                >
                    <LineChart className="w-5 h-5 shrink-0" strokeWidth={1.75} />
                    <span>Grafana</span>
                </a>
            </nav>

            <div className="px-3 py-4 border-t border-gray-200 dark:border-iv-dark-line space-y-2">
                <div className="flex items-center justify-between px-2">
                    <span className="text-xs text-secondary">Тема</span>
                    <ThemeToggle />
                </div>
                <button
                    type="button"
                    onClick={() => {
                        logout()
                        window.location.href = '/login'
                    }}
                    className="iv-nav-item w-full"
                >
                    <LogOut className="w-5 h-5 shrink-0" strokeWidth={1.75} />
                    <span>Выйти</span>
                </button>
            </div>
        </>
    )
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    const [mobileOpen, setMobileOpen] = useState(false)

    return (
        <div className="h-screen iv-page flex overflow-hidden">
            <aside className="iv-sidebar hidden lg:flex flex-col shrink-0 h-full overflow-y-auto custom-scrollbar w-60">
                <NavContent />
            </aside>

            <div className="flex-1 flex flex-col min-w-0 min-h-0">
                <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-iv-dark-line bg-white dark:bg-iv-dark-surface">
                    <button
                        type="button"
                        onClick={() => setMobileOpen(true)}
                        className="btn-icon"
                        aria-label="Меню"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                    <span className="font-semibold gradient-text-adaptive">Admin</span>
                    <ThemeToggle />
                </header>

                <main className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                    <div className="max-w-content mx-auto px-6 py-8 lg:px-8">{children}</div>
                </main>
            </div>

            <AnimatePresence>
                {mobileOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-50 lg:hidden"
                            onClick={() => setMobileOpen(false)}
                        />
                        <motion.aside
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                            className="fixed inset-y-0 left-0 z-50 w-60 iv-sidebar flex flex-col lg:hidden"
                        >
                            <div className="flex justify-end p-3">
                                <button
                                    type="button"
                                    onClick={() => setMobileOpen(false)}
                                    className="btn-icon"
                                    aria-label="Закрыть"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <NavContent onNavigate={() => setMobileOpen(false)} />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}
