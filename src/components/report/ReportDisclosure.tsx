import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import './ReportDisclosure.css'

/** Keep content mounted through exit; retarget from the current height on interruption. */
export default function ReportDisclosure({ open, instant = false, children }: { open: boolean; instant?: boolean; children: ReactNode }) {
    const [present, setPresent] = useState(open)
    const root = useRef<HTMLDivElement>(null)
    const content = useRef<HTMLDivElement>(null)
    const active = useRef<Animation | null>(null)
    useLayoutEffect(() => { if (open) setPresent(true) }, [open])
    useLayoutEffect(() => {
        const element = root.current
        const inner = content.current
        if (!element || !inner || !present) return
        const from = element.getBoundingClientRect().height
        const opacity = getComputedStyle(element).opacity
        active.current?.cancel()
        element.toggleAttribute('inert', !open)
        const finish = () => {
            element.style.height = open ? 'auto' : '0px'
            element.style.opacity = open ? '1' : '0'
            if (!open) setPresent(false)
        }
        if (instant || matchMedia('(prefers-reduced-motion: reduce)').matches || typeof element.animate !== 'function') {
            active.current = null
            finish()
            return
        }
        const target = open ? inner.getBoundingClientRect().height : 0
        element.style.height = `${target}px`
        element.style.opacity = open ? '1' : '0'
        const animation = element.animate([
            { height: `${from}px`, opacity },
            { height: `${target}px`, opacity: open ? 1 : 0 },
        ], { duration: open ? 1000 : 700, easing: 'cubic-bezier(0.23, 1, 0.32, 1)', fill: 'both' })
        active.current = animation
        animation.onfinish = () => {
            if (active.current !== animation) return
            active.current = null
            finish()
            animation.cancel()
        }
    }, [open, present, instant])
    useLayoutEffect(() => {
        const reduced = matchMedia('(prefers-reduced-motion: reduce)')
        const change = () => { if (reduced.matches) active.current?.finish() }
        reduced.addEventListener('change', change)
        return () => { reduced.removeEventListener('change', change); active.current?.cancel() }
    }, [])
    return (
        <div ref={root} data-report-disclosure hidden={!present} aria-hidden={!open} style={{ height: 0, opacity: 0, overflow: 'hidden' }}>
            {present && <div ref={content} className="report-disclosure-content">{children}</div>}
        </div>
    )
}
