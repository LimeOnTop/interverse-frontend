import { LucideIcon } from 'lucide-react'
import { ReactNode } from 'react'
import Card from './Card'

interface EmptyStateProps {
    icon: LucideIcon
    title: string
    description: ReactNode
    action?: ReactNode
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
    return (
        <Card padding="lg" className="text-center">
            <Icon className="w-12 h-12 text-gray-300 dark:text-gray-500 mx-auto mb-4" strokeWidth={1.5} />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
            <p className="text-secondary text-sm max-w-sm mx-auto mb-6">{description}</p>
            {action}
        </Card>
    )
}
