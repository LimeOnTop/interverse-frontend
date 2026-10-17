import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

/** Outside page animations and scrolling content; Layout reserves its height. */
export default function MobileActionBar({ children, safeBottom = false }: { children: ReactNode; safeBottom?: boolean }) {
    const [host, setHost] = useState<HTMLElement | null>(null)
    useEffect(() => { setHost(document.getElementById('iv-mobile-actions')) }, [])
    return host ? createPortal(
        <div className={`iv-mobile-action-bar iv-surface${safeBottom ? ' safe-bottom' : ''}`}>{children}</div>,
        host,
    ) : null
}
