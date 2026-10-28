import { ReactNode } from 'react'

interface FormCardProps {
    children: ReactNode
    className?: string
}

export default function FormCard({ children, className = '' }: FormCardProps) {
    return (
        <div data-motion-block
            className={`iv-form-card p-6 sm:p-8 ${className}`}
        >
            <div className="iv-form-card-shine-clip" aria-hidden>
                <div className="iv-form-card-shine" />
            </div>
            {children}
        </div>
    )
}
