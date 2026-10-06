import { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronLeft } from 'lucide-react'

interface PageHeaderProps {
    title: string
    description?: string
    action?: ReactNode
    breadcrumbs?: { label: string; href?: string }[]
}

export default function PageHeader({ title, description, action, breadcrumbs }: PageHeaderProps) {
    // Phones get a single back link to the nearest parent instead of a trail.
    const backCrumb = [...(breadcrumbs ?? [])].reverse().find((crumb) => crumb.href)
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 sm:mb-8"
        >
            <div>
                {backCrumb && (
                    <Link
                        to={backCrumb.href!}
                        className="sm:hidden -ml-1 mb-1 inline-flex items-center gap-1 min-h-[44px] text-sm font-medium text-inter-verse-green dark:text-purple-400"
                    >
                        <ChevronLeft className="w-5 h-5" /> {backCrumb.label}
                    </Link>
                )}
                {breadcrumbs && breadcrumbs.length > 0 && (
                    <nav className="hidden sm:flex items-center gap-2 text-xs text-secondary mb-2">
                        {breadcrumbs.map((crumb, i) => (
                            <span key={i} className="flex items-center gap-2">
                                {i > 0 && <span>/</span>}
                                {crumb.href ? (
                                    <Link to={crumb.href} className="hover:text-inter-verse-green dark:hover:text-purple-400 transition-iv">
                                        {crumb.label}
                                    </Link>
                                ) : (
                                    <span>{crumb.label}</span>
                                )}
                            </span>
                        ))}
                    </nav>
                )}
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">{title}</h1>
                {description && <p className="text-secondary mt-1 text-sm leading-relaxed">{description}</p>}
            </div>
            {action && <div className="shrink-0 [&>*]:w-full sm:[&>*]:w-auto [&_button]:w-full sm:[&_button]:w-auto">{action}</div>}
        </motion.div>
    )
}
