import { useEffect, type RefObject } from 'react'

/** Repeated viewport reveals; pointer motion writes only compositor transforms. */
export function useLandingMotion(root: RefObject<HTMLElement>) {
    useEffect(() => {
        const host = root.current
        if (!host) return
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
        const pointer = window.matchMedia('(hover: hover) and (pointer: fine)')
        const nodes = host.querySelectorAll<HTMLElement>('[data-reveal],h1,h2,h3,.iv-hero-label,.iv-hero-description,.iv-hero-actions,.iv-hero-note,.iv-section-heading p,.iv-capability p,.iv-start-copy>p,.iv-start-copy li,.iv-faq details')
        let observer: IntersectionObserver | undefined
        const cleanups: (() => void)[] = []
        const setup = () => {
            observer?.disconnect()
            cleanups.splice(0).forEach(fn => fn())
            nodes.forEach(el => { el.classList.remove('will-reveal'); el.classList.add('is-visible') })
            if (reduced.matches) return
            if ('IntersectionObserver' in window) {
                observer = new IntersectionObserver(entries => entries.forEach(entry => {
                    entry.target.classList.toggle('is-visible', entry.isIntersecting)
                }), { threshold: 0, rootMargin: '-24px 0px -24px 0px' })
                nodes.forEach(el => { el.classList.add('will-reveal'); observer?.observe(el) })
            }
            if (!pointer.matches) return
            host.querySelectorAll<HTMLElement>('[data-tilt]').forEach(el => {
                let bounds: DOMRect | undefined
                let raf = 0
                let x = 0, y = 0
                const draw = () => {
                    raf = 0
                    el.style.setProperty('--tilt-x', `${-y * 3}deg`)
                    el.style.setProperty('--tilt-y', `${x * 3}deg`)
                    el.style.setProperty('--lift', '-7px')
                }
                const enter = () => { bounds = el.getBoundingClientRect(); el.classList.add('is-tilting') }
                const move = (event: PointerEvent) => {
                    if (!bounds) { bounds = el.getBoundingClientRect(); el.classList.add('is-tilting') }
                    x = Math.max(-1, Math.min(1, (event.clientX - bounds.left) / bounds.width * 2 - 1))
                    y = Math.max(-1, Math.min(1, (event.clientY - bounds.top) / bounds.height * 2 - 1))
                    if (!raf) raf = requestAnimationFrame(draw)
                }
                const reset = () => {
                    cancelAnimationFrame(raf); raf = 0; bounds = undefined
                    el.classList.remove('is-tilting')
                    el.style.removeProperty('--tilt-x'); el.style.removeProperty('--tilt-y'); el.style.removeProperty('--lift')
                }
                el.addEventListener('pointerenter', enter)
                el.addEventListener('pointermove', move, { passive: true })
                el.addEventListener('pointerleave', reset)
                el.addEventListener('pointercancel', reset)
                // Scrolling invalidates the cached position; never read layout on mousemove.
                window.addEventListener('scroll', reset, { passive: true })
                cleanups.push(() => {
                    reset(); el.removeEventListener('pointerenter', enter); el.removeEventListener('pointermove', move)
                    el.removeEventListener('pointerleave', reset); el.removeEventListener('pointercancel', reset)
                    window.removeEventListener('scroll', reset)
                })
            })
        }
        setup()
        reduced.addEventListener('change', setup); pointer.addEventListener('change', setup)
        return () => { observer?.disconnect(); cleanups.forEach(fn => fn()); reduced.removeEventListener('change', setup); pointer.removeEventListener('change', setup) }
    }, [root])
}
