import { NavLink } from 'react-router-dom'
import {
    LayoutDashboard,
    Users,
    FileText,
    Plus,
    Calendar,
    PlayCircle
} from 'lucide-react'

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Календарь', href: '/calendar', icon: Calendar },
    { name: 'Интервью', href: '/interview-service', icon: PlayCircle },
    { name: 'Кандидаты', href: '/candidates', icon: Users },
    { name: 'Отчёты', href: '/reports', icon: FileText },
]

export default function Sidebar() {
    return (
        <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 min-h-screen">
            <div className="p-6">
                <nav className="space-y-2">
                    {navigation.map((item) => {
                        const Icon = item.icon
                        return (
                            <NavLink
                                key={item.name}
                                to={item.href}
                                className={({ isActive }) =>
                                    `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                                        ? 'gradient-bg-adaptive text-white shadow-lg'
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100'
                                    }`
                                }
                            >
                                <Icon className="w-5 h-5" />
                                <span className="font-medium">{item.name}</span>
                            </NavLink>
                        )
                    })}
                </nav>

                <div className="mt-8 pt-6 border-t border-gray-200">
                    <NavLink
                        to="/interviews/create"
                        className="flex items-center space-x-3 px-4 py-3 rounded-xl bg-green-50 text-inter-verse-green hover:bg-green-100 dark:bg-purple-900/20 dark:text-purple-300 dark:hover:bg-purple-900/30 transition-all duration-200"
                    >
                        <Plus className="w-5 h-5" />
                        <span className="font-medium">Создать интервью</span>
                    </NavLink>
                </div>
            </div>
        </aside>
    )
}
