import { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface PageHeaderProps {
    title: string
    description?: string
    action?: ReactNode
    breadcrumbs?: { label: string; href?: string }[]
}

export default function PageHeader({ title, description, action, breadcrumbs }: PageHeaderProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8"
        >
            <div>
                {breadcrumbs && breadcrumbs.length > 0 && (
                    <nav className="flex items-center gap-2 text-xs text-secondary mb-2">
                        {breadcrumbs.map((crumb, i) => (
                            <span key={i} className="flex items-center gap-2">
                                {i > 0 && <span>/</span>}
                                {crumb.href ? (
                                    <a href={crumb.href} className="hover:text-inter-verse-green dark:hover:text-purple-400 transition-iv">
                                        {crumb.label}
                                    </a>
                                ) : (
                                    <span>{crumb.label}</span>
                                )}
                            </span>
                        ))}
                    </nav>
                )}
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">{title}</h1>
                {description && <p className="text-secondary mt-1 text-sm leading-relaxed">{description}</p>}
            </div>
            {action && <div className="shrink-0">{action}</div>}
        </motion.div>
    )
}
