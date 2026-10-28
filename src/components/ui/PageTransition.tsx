import { ReactNode } from 'react'

/** Individual surfaces and content are choreographed by AppMotion. */
export default function PageTransition({ children, className = '' }: { children: ReactNode; className?: string }) {
    return <div data-motion-page className={className}>{children}</div>
}
