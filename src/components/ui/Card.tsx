import { HTMLAttributes, ReactNode } from 'react'
import { motion } from 'framer-motion'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    hover?: boolean
    padding?: 'none' | 'sm' | 'md' | 'lg'
    children: ReactNode
}

const paddingMap = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
}

export default function Card({ hover = false, padding = 'md', className = '', children, onClick, ...props }: CardProps) {
    const pad = paddingMap[padding]
    const classes = `iv-card ${hover ? 'iv-card-hover cursor-pointer' : ''} ${className}`

    if (hover) {
        return (
            <motion.div
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className={`${classes} flex h-full min-h-0 flex-col`}
                onClick={onClick}
            >
                <div className="iv-card-shine" aria-hidden />
                <div className={`relative z-[2] flex min-h-0 flex-1 flex-col ${pad}`}>{children}</div>
            </motion.div>
        )
    }

    return (
        <div className={`${classes} ${pad}`} onClick={onClick} {...props}>
            {children}
        </div>
    )
}
