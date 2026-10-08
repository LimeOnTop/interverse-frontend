import { useEffect } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, LogOut, ChevronRight } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { resolveSubscriptionPlan, subscriptionPlanLabel } from '../utils/subscription'
import { PREPARATION_NAV, ACCOUNT_NAV, type NavItem } from './navigation'
import ThemeToggle from './ThemeToggle'
import UserAvatar from './UserAvatar'

interface SidebarProps {
    mobileOpen?: boolean
    onClose?: () => void
}

function NavGroup({ title, items, onNavigate }: { title: string; items: NavItem[]; onNavigate?: () => void }) {
    return (
        <div>
            <p className="iv-nav-group">{title}</p>
            <div className="space-y-0.5">
                {items.map((item) => {
                    const Icon = item.icon
                    return (
                        <NavLink
                            key={item.href}
                            to={item.href}
                            onClick={onNavigate}
                            className={({ isActive }) => `iv-nav-item ${isActive ? 'iv-nav-item-active' : ''}`}
                        >
                            <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={1.75} />
                            <span className="flex-1 min-w-0 truncate">{item.name}</span>
                            {item.soon && <span className="text-[10px] font-semibold tracking-wider text-secondary">СКОРО</span>}
                        </NavLink>
                    )
                })}
            </div>
        </div>
    )
}

function NavContent({ onNavigate }: { onNavigate?: () => void }) {
    return (
        <div className="flex flex-col gap-6 px-3 pt-4 pb-4">
            <Link to="/interviews/create" onClick={onNavigate} className="iv-sidebar-cta">
                <Plus className="w-[18px] h-[18px] shrink-0" strokeWidth={2} />
                <span>Новая тренировка</span>
            </Link>
            <NavGroup title="Подготовка" items={PREPARATION_NAV} onNavigate={onNavigate} />
            <NavGroup title="Аккаунт" items={ACCOUNT_NAV} onNavigate={onNavigate} />
        </div>
    )
}

/** Name, avatar and plan at the bottom of the desktop sidebar. */
function AccountCard() {
    const user = useAuthStore((state) => state.user)
    const planLabel = subscriptionPlanLabel(resolveSubscriptionPlan(user))
    const name = user?.name || 'Профиль'

    return (
        <div className="mt-auto px-3 pt-6 pb-4">
            <Link to="/profile" className="sidebar-profile" aria-label={`Открыть профиль ${name}, тариф ${planLabel}`}>
                <UserAvatar />
                <span className="sidebar-profile-info">
                    <span className="sidebar-profile-name">
                        <strong>{name}</strong>
                        <span className="sidebar-profile-plan">{planLabel}</span>
                    </span>
                    {user?.email && <span className="sidebar-profile-role">{user.email}</span>}
                </span>
                <ChevronRight className="sidebar-profile-chevron" strokeWidth={1.6} aria-hidden="true" />
            </Link>
        </div>
    )
}

export default function Sidebar({ mobileOpen = false, onClose }: SidebarProps) {
    return (
        <>
            {/* Desktop sidebar */}
            <aside className="iv-sidebar hidden lg:flex flex-col shrink-0 h-full overflow-y-auto custom-scrollbar">
                <NavContent />
                <AccountCard />
            </aside>

            {/* Mobile drawer */}
            <AnimatePresence>
                {mobileOpen && <MobileDrawer onClose={onClose} />}
            </AnimatePresence>
        </>
    )
}

function MobileDrawer({ onClose }: { onClose?: () => void }) {
    const { user, logout } = useAuthStore()
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
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-iv-dark-line">
                    <Link
                        to="/profile"
                        onClick={onClose}
                        className="flex items-center gap-3 min-w-0 flex-1 min-h-[44px]"
                        aria-label={`Открыть профиль, тариф ${planLabel}`}
                    >
                        <UserAvatar size="lg" />
                        <span className="min-w-0 flex-1">
                            <span className="sidebar-profile-name">
                                <strong className="text-sm text-gray-900 dark:text-gray-100">{user?.name || 'Профиль'}</strong>
                                <span className="sidebar-profile-plan">{planLabel}</span>
                            </span>
                            {user?.email && <span className="sidebar-profile-role text-xs">{user.email}</span>}
                        </span>
                    </Link>
                    <button onClick={onClose} className="btn-icon shrink-0" aria-label="Закрыть меню">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <NavContent onNavigate={onClose} />
                </div>

                <div className="border-t border-gray-200 dark:border-iv-dark-line px-3 py-2 flex items-center justify-between">
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
