export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'accent'

const variants: Record<BadgeVariant, string> = {
    default: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-iv-dark-bg dark:text-gray-300 dark:border-gray-600',
    success: 'bg-green-50 text-inter-verse-green border-green-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-500/30',
    warning: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-500/30',
    danger: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-500/30',
    info: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-500/30',
    accent: 'gradient-bg-adaptive text-white border-transparent',
}

interface BadgeProps {
    children: React.ReactNode
    variant?: BadgeVariant
    className?: string
}

export default function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
    return (
        <span className={`iv-badge ${variants[variant]} ${className}`}>
            {children}
        </span>
    )
}

export const statusBadgeVariant = (status: string): BadgeVariant => {
    const map: Record<string, BadgeVariant> = {
        scheduled: 'info',
        in_progress: 'warning',
        completed: 'success',
        cancelled: 'danger',
        draft: 'default',
    }
    return map[status] || 'default'
}
