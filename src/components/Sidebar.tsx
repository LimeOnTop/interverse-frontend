import { NavLink, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    LayoutDashboard,
    FileText,
    Plus,
    BarChart3,
    PlayCircle,
    Briefcase,
    UserCircle,
    X,
} from 'lucide-react'

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Активность', href: '/activity', icon: BarChart3 },
    { name: 'Интервью', href: '/interview-service', icon: PlayCircle },
    { name: 'Вакансии', href: '/vacancies', icon: Briefcase },
    { name: 'Отчёты', href: '/reports', icon: FileText },
    { name: 'Профиль', href: '/profile', icon: UserCircle },
]

interface SidebarProps {
    mobileOpen?: boolean
    onClose?: () => void
}

function NavContent({ onNavigate }: { onNavigate?: () => void }) {
    return (
        <>
            <div className="px-3 pt-4 pb-3 border-b border-gray-200 dark:border-gray-600">
                <Link
                    to="/interviews/create"
                    onClick={onNavigate}
                    className="iv-sidebar-cta"
                >
                    <Plus className="w-5 h-5 shrink-0" strokeWidth={1.75} />
                    <span>Начать тренировку</span>
                </Link>
            </div>

            <nav className="px-3 py-4 space-y-1">
                {navigation.map((item) => {
                    const Icon = item.icon
                    return (
                        <NavLink
                            key={item.name}
                            to={item.href}
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
            </nav>
        </>
    )
}

export default function Sidebar({ mobileOpen = false, onClose }: SidebarProps) {
    return (
        <>
            {/* Desktop sidebar */}
            <aside className="iv-sidebar hidden lg:flex flex-col shrink-0 h-full overflow-y-auto custom-scrollbar">
                <NavContent />
            </aside>

            {/* Mobile drawer */}
            <AnimatePresence>
                {mobileOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 bg-black/50 z-50 lg:hidden"
                            onClick={onClose}
                        />
                        <motion.aside
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                            className="fixed inset-y-0 left-0 z-50 w-60 iv-sidebar flex flex-col lg:hidden"
                        >
                            <div className="flex items-center justify-end p-3">
                                <button onClick={onClose} className="btn-icon" aria-label="Закрыть меню">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <NavContent onNavigate={onClose} />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </>
    )
}
