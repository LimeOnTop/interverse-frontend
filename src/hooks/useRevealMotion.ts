import { useReducedMotion } from 'framer-motion'
import { isKeyboardMotion, motionEase } from '../lib/motion'

/** Same settling curve as reports; exits stay short so navigation never queues. */
export function useRevealMotion(popover = false) {
    const reduced = useReducedMotion()
    const instant = isKeyboardMotion()
    const calm = reduced || instant
    return {
        initial: { opacity: instant ? 1 : 0, transform: calm ? 'none' : popover ? 'translateY(-4px) scale(.98)' : 'translateY(8px)' },
        animate: { opacity: 1, transform: 'none' },
        exit: { opacity: instant ? 1 : 0, transform: calm ? 'none' : popover ? 'translateY(-4px) scale(.98)' : 'translateY(-4px)', transition: { duration: instant ? 0 : reduced ? .1 : .18, ease: motionEase } },
        transition: { duration: instant ? 0 : reduced ? .1 : popover ? .22 : .65, ease: motionEase },
    }
}
