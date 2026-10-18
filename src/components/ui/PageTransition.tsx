import { ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

interface PageTransitionProps {
    children: ReactNode
    className?: string
}

export default function PageTransition({ children, className = '' }: PageTransitionProps) {
    const reduceMotion = useReducedMotion()
    return (
        <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
            transition={{ duration: reduceMotion ? 0 : 0.18, ease: [0.23, 1, 0.32, 1] }}
            className={className}
        >
            {children}
        </motion.div>
    )
}
