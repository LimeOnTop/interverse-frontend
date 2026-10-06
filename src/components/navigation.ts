import {
    LayoutDashboard,
    FileText,
    BarChart3,
    PlayCircle,
    Briefcase,
    UserCircle,
    Lightbulb,
    Route,
    type LucideIcon,
} from 'lucide-react'

export interface NavItem {
    name: string
    href: string
    icon: LucideIcon
}

/** Single source for sidebar, mobile drawer, tab bar and header titles. */
export const NAVIGATION: NavItem[] = [
    { name: 'Главная', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Активность', href: '/activity', icon: BarChart3 },
    { name: 'Интервью', href: '/interview-service', icon: PlayCircle },
    { name: 'Вакансии', href: '/vacancies', icon: Briefcase },
    { name: 'Траектории', href: '/tracks', icon: Route },
    { name: 'Отчёты', href: '/reports', icon: FileText },
    { name: 'Профиль', href: '/profile', icon: UserCircle },
    { name: 'Предложить вопрос', href: '/contribute', icon: Lightbulb },
]
