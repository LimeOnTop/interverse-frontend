import { NavLink, Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { MOBILE_TABS } from './navigation'

/** Bottom navigation for phones: four main sections plus a central start action. */
export default function MobileTabBar() {
    return (
        <nav
            className="lg:hidden fixed inset-x-0 bottom-0 z-40 iv-surface border-t border-gray-200 dark:border-iv-dark-line iv-safe-bottom"
            aria-label="Основная навигация"
        >
            <div className="grid grid-cols-5 h-16">
                {MOBILE_TABS.map((tab) => {
                    if (!tab) {
                        return (
                            <div key="start" className="flex items-center justify-center">
                                <Link
                                    to="/interviews/create"
                                    aria-label="Новая тренировка"
                                    className="w-11 h-11 flex items-center justify-center gradient-bg-adaptive text-white rounded-xl shadow-iv-md active:scale-95 transition-transform"
                                >
                                    <Plus className="w-5 h-5" strokeWidth={2.25} />
                                </Link>
                            </div>
                        )
                    }
                    const Icon = tab.icon
                    return (
                        <NavLink
                            key={tab.href}
                            to={tab.href}
                            className={({ isActive }) =>
                                `flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${
                                    isActive
                                        ? 'text-inter-verse-green dark:text-purple-400'
                                        : 'text-gray-500 dark:text-gray-400'
                                }`
                            }
                        >
                            <Icon className="w-5 h-5" strokeWidth={1.75} />
                            <span>{tab.name}</span>
                        </NavLink>
                    )
                })}
            </div>
        </nav>
    )
}
