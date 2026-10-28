import { useCallback, useEffect, useRef, type RefObject } from 'react'
import { instantMotion, motionCurve } from '../lib/motion'

/** Retain the native modal/focus trap through exit; all close paths share one callback. */
export function useDialogMotion(dialog: RefObject<HTMLDialogElement>, onClosed: () => void) {
    const current = useRef<Animation | null>(null)
    const closing = useRef(false)
    const complete = useRef(onClosed)
    complete.current = onClosed
    useEffect(() => {
        const element = dialog.current
        if (!element) return
        closing.current = false
        element.dataset.motionDialog = 'open'
        if (!instantMotion()) current.current = element.animate([
            { opacity: 0, transform: 'translateY(8px) scale(.97)' },
            { opacity: 1, transform: 'none' },
        ], { duration: 300, easing: motionCurve })
        const reduced = matchMedia('(prefers-reduced-motion: reduce)')
        const change = () => { if (reduced.matches) current.current?.finish() }
        reduced.addEventListener('change', change)
        return () => { current.current?.cancel(); reduced.removeEventListener('change', change) }
    }, [dialog])
    return useCallback(() => {
        if (closing.current) return
        closing.current = true
        const element = dialog.current
        if (!element || instantMotion()) { complete.current(); return }
        const from = getComputedStyle(element)
        const opacity = from.opacity, transform = from.transform
        current.current?.cancel()
        element.dataset.motionDialog = 'closing'
        const animation = element.animate([
            { opacity, transform }, { opacity: 0, transform: 'translateY(8px) scale(.97)' },
        ], { duration: 200, easing: motionCurve, fill: 'forwards' })
        current.current = animation
        animation.onfinish = () => complete.current()
    }, [dialog])
}
