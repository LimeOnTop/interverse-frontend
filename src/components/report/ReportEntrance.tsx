import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { animate } from 'framer-motion'

const BLOCK = '[data-report-block]'
const CONTENT = 'h1,h2,h3,h4,p,li,pre,time,small,strong,b,[data-report-detail],button,a,.iv-pill,svg.lucide,[data-report-marker],[data-report-bar],[data-report-ring]'
const EASE = 'cubic-bezier(0.23, 1, 0.32, 1)'
const RESULT_DURATION = 1350

/** Viewport-triggered report choreography. Content stays usable before and during motion. */
export default function ReportEntrance({ children, className = '' }: { children: ReactNode; className?: string }) {
    const root = useRef<HTMLDivElement>(null)
    useLayoutEffect(() => {
        const container = root.current
        if (!container) return
        const reduced = matchMedia('(prefers-reduced-motion: reduce)')
        const registered = new WeakSet<Element>()
        const played = new WeakSet<Element>()
        const running = new Map<Element, Animation>()
        const pending = new Map<Element, Animation>()
        const counted = new WeakSet<Element>()
        const counts = new Map<Element, { stop: () => void }>()
        const writeCount = (element: Element, value: number) => {
            const node = element.firstChild
            if (node?.nodeType === Node.TEXT_NODE) node.nodeValue = String(value)
        }
        const finishCount = (element: Element) => {
            counts.get(element)?.stop()
            counts.delete(element)
            writeCount(element, Number(element.getAttribute('data-report-count')))
        }
        const count = (element: Element, delay: number) => {
            if (counted.has(element)) return
            counted.add(element)
            const target = Number(element.getAttribute('data-report-count'))
            if (!Number.isFinite(target) || target === 0 || reduced.matches || performance.now() < keyboardUntil) return
            const precision = Number.isInteger(target) ? 0 : Math.min(2, String(target).split('.')[1]?.length || 1)
            writeCount(element, 0)
            const controls = animate(0, target, {
                duration: RESULT_DURATION / 1000,
                delay: delay / 1000,
                ease: [0.23, 1, 0.32, 1],
                onUpdate: value => {
                    if (Number(element.getAttribute('data-report-count')) !== target) { finishCount(element); return }
                    writeCount(element, Number(value.toFixed(precision)))
                },
                onComplete: () => { writeCount(element, Number(element.getAttribute('data-report-count'))); counts.delete(element) },
            })
            counts.set(element, controls)
        }
        let keyboardUntil = 0
        const play = (element: Element, keyframes: Keyframe[], delay = 0, duration = 820) => {
            if (played.has(element) || !element.isConnected) return
            played.add(element)
            if (performance.now() < keyboardUntil || typeof element.animate !== 'function') return
            const frames = reduced.matches ? [{ opacity: 0.8 }, { opacity: 1 }] : keyframes
            const animation = element.animate(frames, {
                duration: reduced.matches ? 100 : duration,
                delay: reduced.matches ? 0 : delay,
                easing: EASE,
                fill: 'backwards',
            })
            running.set(element, animation)
            const clean = () => { if (running.get(element) === animation) running.delete(element) }
            animation.onfinish = clean
            animation.oncancel = clean
        }
        const enter = (block: Element, startDelay = 0) => {
            for (const value of block.querySelectorAll('[data-report-count]')) {
                if (value.closest(BLOCK) === block) count(value, startDelay + 60)
            }
            const nested = Boolean(block.querySelector(BLOCK))
            play(block, [{ opacity: 0, transform: nested ? 'none' : 'translateY(8px)' }, { opacity: 1, transform: 'none' }], startDelay, 900)
            let order = 0
            for (const element of block.querySelectorAll(CONTENT)) {
                if (element.closest(BLOCK) !== block) continue
                if (!element.getClientRects().length) continue
                // Animate a semantic unit once: a list item includes its paragraphs and links.
                const unit = element.parentElement?.closest('li,p,button,a,[data-report-detail]')
                const independent = element.hasAttribute('data-report-detail') || element.hasAttribute('data-report-marker') || element.matches('svg.lucide')
                if (unit && block.contains(unit) && !independent) continue
                const delay = startDelay + 30 + Math.min(order++, 3) * 35
                if (element.hasAttribute('data-report-bar')) {
                    play(element, [{ transform: 'scaleX(0)', transformOrigin: 'left center' }, { transform: 'scaleX(1)', transformOrigin: 'left center' }], startDelay + 90, 1250)
                } else if (element.hasAttribute('data-report-ring')) {
                    const amount = Number(element.getAttribute('data-report-ring'))
                    if (amount > 0) play(element, [{ strokeDasharray: `0 ${amount}` }, { strokeDasharray: element.getAttribute('stroke-dasharray') || '' }], startDelay + 60, RESULT_DURATION)
                } else if (element.hasAttribute('data-report-marker')) {
                    play(element, [{ opacity: 0, transform: 'scaleX(0.3)', transformOrigin: 'left center' }, { opacity: 1, transform: 'scaleX(1)', transformOrigin: 'left center' }], delay + 40, 720)
                } else if (element.matches('svg.lucide')) {
                    // Preserve CSS rotation on disclosure chevrons; never replace their transform.
                    play(element, [{ opacity: 0 }, { opacity: 1 }], delay + 40, 650)
                } else if (element.matches('.iv-pill,[data-report-detail="badge"]')) {
                    play(element, [{ opacity: 0, transform: 'scale(0.96)' }, { opacity: 1, transform: 'scale(1)' }], delay, 680)
                } else if (element.matches('pre,[data-report-detail="code"]')) {
                    play(element, [{ opacity: 0, clipPath: 'inset(0 0 10% 0)' }, { opacity: 1, clipPath: 'inset(0 0 0% 0)' }], delay, 900)
                } else if (element.matches('[data-report-detail="value"],strong,b')) {
                    // The value reveal shares the result counter’s gentle settling motion.
                    play(element, [{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], delay + 20, 900)
                } else if (element.matches('button,a,[data-report-detail="meta"],time,small')) {
                    play(element, [{ opacity: 0, transform: 'translateY(3px)' }, { opacity: 1, transform: 'none' }], delay, 600)
                } else {
                    play(element, [{ opacity: 0, transform: `translateY(${element.matches('h1,h2,h3') ? 5 : 3}px)` }, { opacity: 1, transform: 'none' }], delay, 820)
                }
            }
        }
        const observer = new IntersectionObserver(entries => {
            let index = 0
            for (const entry of entries) if (entry.isIntersecting) {
                observer.unobserve(entry.target)
                pending.get(entry.target)?.cancel()
                pending.delete(entry.target)
                enter(entry.target, Math.min(index++, 3) * 35)
            }
        }, { threshold: 0, rootMargin: '0px 0px -16px 0px' })
        const register = () => {
            let index = 0
            for (const block of container.querySelectorAll(BLOCK)) {
                if (registered.has(block)) continue
                registered.add(block)
                const rect = block.getBoundingClientRect()
                if (rect.bottom > 0 && rect.top < innerHeight - 16 && rect.right > 0 && rect.left < innerWidth) {
                    // useLayoutEffect / mutation delivery runs before paint: do not
                    // wait for the asynchronous IntersectionObserver on visible content.
                    enter(block, Math.min(index++, 3) * 35)
                } else {
                    // Hold offscreen blocks at their initial opacity so scrolling
                    // cannot paint the completed state before the observer fires.
                    if (typeof block.animate === 'function') {
                        const hold = block.animate([{ opacity: 0 }, { opacity: 0 }], { duration: 1, fill: 'both' })
                        hold.pause()
                        pending.set(block, hold)
                    }
                    observer.observe(block)
                }
            }
            for (const [element, animation] of running) if (!element.isConnected) {
                animation.cancel()
                running.delete(element)
            }
            for (const [element, controls] of counts) if (!element.isConnected) {
                controls.stop()
                counts.delete(element)
            }
            for (const [element, animation] of pending) if (!element.isConnected) {
                observer.unobserve(element)
                animation.cancel()
                pending.delete(element)
            }
        }
        const focus = (event: FocusEvent) => {
            if (!(event.target instanceof Element)) return
            for (const element of counts.keys()) if (element.contains(event.target) || event.target.contains(element)) finishCount(element)
            // Never leave keyboard focus on an invisible, staggered control.
            for (const [element, animation] of pending) if (element.contains(event.target)) {
                animation.cancel()
                pending.delete(element)
                observer.unobserve(element)
                keyboardUntil = performance.now() + 400
                enter(element)
            }
            for (const [element, animation] of running) if (element.contains(event.target) || event.target.contains(element)) animation.finish()
        }
        const key = () => { keyboardUntil = performance.now() + 400 }
        const preference = () => {
            for (const animation of running.values()) animation.finish()
            for (const element of counts.keys()) finishCount(element)
        }
        const mutations = new MutationObserver(register)
        mutations.observe(container, { childList: true, subtree: true })
        container.addEventListener('focusin', focus)
        container.addEventListener('keydown', key, true)
        reduced.addEventListener('change', preference)
        register()
        return () => {
            observer.disconnect()
            mutations.disconnect()
            container.removeEventListener('focusin', focus)
            container.removeEventListener('keydown', key, true)
            reduced.removeEventListener('change', preference)
            for (const animation of running.values()) animation.cancel()
            for (const animation of pending.values()) animation.cancel()
            for (const controls of counts.values()) controls.stop()
            counts.clear()
            running.clear()
            pending.clear()
        }
    }, [])
    return <div ref={root} data-report-entrance className={className}>{children}</div>
}
