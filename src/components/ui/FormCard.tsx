import { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface FormCardProps {
    children: ReactNode
    className?: string
}

export default function FormCard({ children, className = '' }: FormCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className={`iv-form-card p-8 ${className}`}
        >
            <div className="iv-form-card-shine-clip" aria-hidden>
                <div className="iv-form-card-shine" />
            </div>
            {children}
        </motion.div>
    )
}
