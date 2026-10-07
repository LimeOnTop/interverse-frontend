export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'accent'

// Badges are coloured text without a filled background.
const variants: Record<BadgeVariant, string> = {
    default: 'text-gray-600 dark:text-gray-300',
    success: 'text-inter-verse-green dark:text-purple-400',
    warning: 'text-amber-600 dark:text-amber-400',
    danger: 'text-red-600 dark:text-red-400',
    info: 'text-inter-verse-green dark:text-purple-400',
    accent: 'gradient-text-adaptive',
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
