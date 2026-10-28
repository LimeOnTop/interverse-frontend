import { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    hover?: boolean
    padding?: 'none' | 'sm' | 'md' | 'lg'
    children: ReactNode
}

const paddingMap = {
    none: '',
    sm: 'p-4',
    md: 'p-4 sm:p-6',
    lg: 'p-5 sm:p-8',
}

export default function Card({ hover = false, padding = 'md', className = '', children, onClick, ...props }: CardProps) {
    const pad = paddingMap[padding]
    const classes = `iv-card ${hover ? 'iv-card-hover cursor-pointer' : ''} ${className}`

    if (hover) {
        return (
            <div data-motion-block
                className={`${classes} flex h-full min-h-0 flex-col`}
                onClick={onClick}
            >
                <div className="iv-card-shine" aria-hidden />
                <div className={`relative z-[2] flex min-h-0 flex-1 flex-col ${pad}`}>{children}</div>
            </div>
        )
    }

    return (
        <div className={`${classes} ${pad}`} onClick={onClick} {...props}>
            {children}
        </div>
    )
}
