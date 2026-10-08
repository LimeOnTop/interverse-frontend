import {
    LayoutGrid,
    FileText,
    BarChart3,
    PlayCircle,
    Briefcase,
    UserRound,
    Crown,
    Plus,
    Route,
    LifeBuoy,
    type LucideIcon,
} from 'lucide-react'

export interface NavItem {
    name: string
    href: string
    icon: LucideIcon
    /** Section is not available yet. */
    soon?: boolean
}

export const PREPARATION_NAV: NavItem[] = [
    { name: 'Главная', href: '/dashboard', icon: LayoutGrid },
    { name: 'Тренировки', href: '/interview-service', icon: PlayCircle },
    { name: 'Отчёты', href: '/reports', icon: FileText },
    { name: 'Прогресс', href: '/activity', icon: BarChart3 },
    { name: 'Вакансии', href: '/vacancies', icon: Briefcase },
    { name: 'Траектории', href: '/tracks', icon: Route, soon: true },
]

export const ACCOUNT_NAV: NavItem[] = [
    { name: 'Профиль', href: '/profile', icon: UserRound },
    { name: 'Подписка', href: '/subscription', icon: Crown },
    { name: 'Предложить вопрос', href: '/contribute', icon: Plus },
    { name: 'Поддержка', href: '/support', icon: LifeBuoy },
]

/** Single source for sidebar, mobile drawer and header titles. */
export const NAVIGATION: NavItem[] = [...PREPARATION_NAV, ...ACCOUNT_NAV]

/** Bottom bar on phones; null is the central "new training" action. */
export const MOBILE_TABS: (NavItem | null)[] = [
    PREPARATION_NAV[0],
    PREPARATION_NAV[1],
    null,
    PREPARATION_NAV[2],
    ACCOUNT_NAV[0],
]
