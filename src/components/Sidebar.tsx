import { useEffect } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Crown, X, LogOut, User } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { resolveSubscriptionPlan, subscriptionPlanLabel } from '../utils/subscription'
import { NAVIGATION as navigation } from './navigation'
import ThemeToggle from './ThemeToggle'

interface SidebarProps {
    mobileOpen?: boolean
    onClose?: () => void
}

function NavContent({ onNavigate }: { onNavigate?: () => void }) {
    const user = useAuthStore((state) => state.user)
    const planLabel = subscriptionPlanLabel(resolveSubscriptionPlan(user))

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

                <NavLink
                    to="/subscription"
                    onClick={onNavigate}
                    className={({ isActive }) =>
                        `iv-nav-item-subscription ${isActive ? 'iv-nav-item-subscription-active' : ''}`
                    }
                >
                    <Crown className="w-5 h-5 shrink-0" strokeWidth={1.75} />
                    <span>{planLabel === 'Pro' ? 'Подписка Pro' : 'Перейти на Pro'}</span>
                </NavLink>
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
                {mobileOpen && <MobileDrawer onClose={onClose} />}
            </AnimatePresence>
        </>
    )
}

function MobileDrawer({ onClose }: { onClose?: () => void }) {
    const { user, avatarUrl, logout } = useAuthStore()
    const navigate = useNavigate()
    const planLabel = subscriptionPlanLabel(resolveSubscriptionPlan(user))

    useEffect(() => {
        const previous = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose?.()
        }
        window.addEventListener('keydown', onKey)
        return () => {
            document.body.style.overflow = previous
            window.removeEventListener('keydown', onKey)
        }
    }, [onClose])

    const handleLogout = () => {
        onClose?.()
        logout()
        navigate('/')
    }

    return (
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
                className="fixed inset-y-0 left-0 z-50 w-[86vw] max-w-xs iv-sidebar flex flex-col lg:hidden iv-safe-top iv-safe-bottom"
                role="dialog"
                aria-modal="true"
                aria-label="Меню"
            >
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                    <div className="w-10 h-10 bg-gray-100 dark:bg-iv-dark-bg border border-gray-200 dark:border-gray-600 flex items-center justify-center overflow-hidden shrink-0">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <User className="w-5 h-5 text-gray-500" strokeWidth={1.75} />
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate text-gray-900 dark:text-gray-100">{user?.name || 'Профиль'}</p>
                        <p className="text-xs text-secondary">Тариф {planLabel}</p>
                    </div>
                    <button onClick={onClose} className="btn-icon shrink-0" aria-label="Закрыть меню">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <NavContent onNavigate={onClose} />
                </div>

                <div className="border-t border-gray-200 dark:border-gray-600 px-3 py-2 flex items-center justify-between">
                    <button type="button" onClick={handleLogout} className="iv-nav-item flex-1">
                        <LogOut className="w-5 h-5 shrink-0" strokeWidth={1.75} />
                        <span>Выйти</span>
                    </button>
                    <ThemeToggle />
                </div>
            </motion.aside>
        </>
    )
}
