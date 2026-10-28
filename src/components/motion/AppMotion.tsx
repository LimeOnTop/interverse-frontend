import { useNativeDetailsMotion } from '../../hooks/useNativeDetailsMotion'
import { useLayoutEffect } from 'react'
import { motionCurve, motionTiming, setKeyboardMotion, instantMotion } from '../../lib/motion'
import '../../styles/motion.css'

// Existing specialist motion owns its entire subtree: never animate the canvas,
// ASCII capture, charts or report twice. New surfaces opt out with the same attribute.
const OWNED = '[data-motion-owned],[data-report-entrance],.react-flow,.sd-board,.sd-fullscreen-stage,.sd-announcement,.recharts-wrapper,.will-reveal,video,canvas,[hidden],[inert]'
const SURFACE = '.report-entry,section,article,fieldset,.iv-card,.iv-panel,.iv-form-card,.session-summary,.library-stat,.library-head,.collection-heading,.list-controls,.session-toolbar,.report-next,.vp-step,.pr-card,.collection-empty,.sd-exercise,.sd-panel,.sd-intro,.sd-editor-heading,[role="alert"],[role="status"],[data-motion-block],.prep-quiz,.prep-task,.sd-topics>div,.sd-task-samples>a,.public-catalog-grid>a,.iv-start-form,.iv-hero-visual,.sd-home-feature'
const DETAIL = 'h1,h2,h3,h4,p,label,legend,pre,li,dt,dd,button,a,strong,small,time,.lib-eyebrow,.iv-eyebrow,.lib-chip,.iv-pill,.iv-status-completed,[data-motion-detail],.lib-bar>span,.iv-hero-label,.iv-hero-note,.iv-video-topline,.iv-video-caption,.iv-form-heading,.iv-form-summary,.prep-panel-label,summary'
const CANDIDATE = `${SURFACE},${DETAIL}`

/** Animate real mounted content, including asynchronous results and portal content.
 * Never poll, intercept navigation, mutate React text, or replay a whole page on input. */
export default function AppMotion() {
    useNativeDetailsMotion()
    useLayoutEffect(() => {
        const root = document.getElementById('root')
        if (!root || typeof Element.prototype.animate !== 'function') return
        const seen = new WeakSet<Element>()
        const queued = new Set<Element>()
        const active = new Map<Element, Animation>()
        const reduced = matchMedia('(prefers-reduced-motion: reduce)')
        const eligible = (el: Element) => !el.closest(OWNED) && !el.closest('nav,.iv-sidebar,.iv-header,.iv-mobile-tabbar,[role="listbox"],[role="menu"],dialog')
        const play = (el: Element, delay = 0) => {
            if (!el.isConnected || !eligible(el) || !el.getClientRects().length) return
            if (instantMotion()) return
            // A container must not move fixed/sticky descendants or multiply their opacity.
            const surface = el.matches('.report-entry') || (el.matches(SURFACE) && !el.querySelector(SURFACE) && !el.closest('.report-entry'))
            if (surface && el.querySelector('.react-flow,.sd-board,.sd-announcement,[data-report-entrance]')) return
            const leaf = !el.querySelector(CANDIDATE)
            if (!leaf && !surface && !el.matches('button,a,li,h1,h2,h3,h4,p,label,legend,pre,.lib-bar>span,.iv-hero-label,.iv-hero-note,.iv-video-topline,.iv-video-caption,.iv-form-heading,.iv-form-summary,.prep-panel-label,summary')) return
            const isBar = el.matches('.lib-bar>span')
            const isBadge = el.matches('.lib-chip,.iv-pill,.iv-status-completed')
            const frames: Keyframe[] = surface ? [{ opacity: 0 }, { opacity: 1 }] : isBar
                ? [{ scale: '0 1', transformOrigin: 'left' }, { scale: '1 1', transformOrigin: 'left' }]
                : [{ opacity: 0, translate: el.matches('h1,h2,h3') ? '0 5px' : '0 3px', ...(isBadge ? { scale: '.96' } : {}) }, { opacity: 1, translate: '0 0', ...(isBadge ? { scale: '1' } : {}) }]
            const animation = el.animate(frames, { duration: isBar ? motionTiming.value : surface ? motionTiming.surface : el.matches('button,a,small,time') ? motionTiming.control : motionTiming.content, delay, easing: motionCurve, fill: 'backwards' })
            active.set(el, animation)
            const clean = () => { if (active.get(el) === animation) active.delete(el) }
            animation.onfinish = clean
            animation.oncancel = clean
        }
        const observer = new IntersectionObserver(entries => {
            const groups = new Map<Element, number>()
            for (const entry of entries) if (entry.isIntersecting) {
                observer.unobserve(entry.target)
                queued.delete(entry.target)
                const group = entry.target.closest('.report-entry') || entry.target.closest(SURFACE) || entry.target.parentElement || entry.target
                if (!groups.has(group)) groups.set(group, Math.min(groups.size, 5) * 120)
                play(entry.target, groups.get(group)! + (entry.target === group ? 0 : 40))
            }
        }, { threshold: 0, rootMargin: '0px 0px -12px 0px' })
        const register = (host: Element) => {
            if (host.closest(OWNED)) return
            const groups = new Map<Element, number>()
            const detailOrder = new Map<Element, number>()
            const candidates = [...(host.matches(CANDIDATE) ? [host] : []), ...host.querySelectorAll(CANDIDATE)]
            for (const el of candidates) {
                if (seen.has(el) || !eligible(el) || !el.getClientRects().length) continue
                seen.add(el)
                // Paragraphs/list items animate as one unit; don't stagger nested links.
                const parent = el.parentElement?.closest('button,a,p,label,li,pre')
                if (parent && !parent.querySelector(SURFACE)) continue
                const rect = el.getBoundingClientRect()
                if (rect.bottom > 0 && rect.top < innerHeight - 12 && rect.right > 0 && rect.left < innerWidth) {
                    const group = el.closest('.report-entry') || el.closest(SURFACE) || el.closest('header,form,[data-motion-page],main') || host
                    if (!groups.has(group)) groups.set(group, Math.min(groups.size, 5) * 120)
                    const order = detailOrder.get(group) || 0
                    detailOrder.set(group, order + 1)
                    play(el, groups.get(group)! + (el === group ? 0 : 30 + Math.min(order, 3) * 35))
                }
                else { queued.add(el); observer.observe(el) }
            }
        }
        const key = (e: KeyboardEvent) => { if (!e.metaKey && !e.ctrlKey && !e.altKey) { setKeyboardMotion(true); document.documentElement.dataset.motionInput = 'keyboard' } }
        const pointer = () => { setKeyboardMotion(false); document.documentElement.dataset.motionInput = 'pointer' }
        const focus = (e: FocusEvent) => {
            if (!(e.target instanceof Element)) return
            for (const [el, animation] of active) if (el.contains(e.target) || e.target.contains(el)) animation.finish()
        }
        const finish = () => { for (const animation of active.values()) animation.finish() }
        const mutations = new MutationObserver(records => {
            for (const record of records) {
                for (const node of record.addedNodes) if (node instanceof Element) register(node)
                // A previously hidden tab/conditional section can become visible in place.
                if (record.type === 'attributes' && record.target instanceof Element) register(record.target)
            }
            for (const [el, animation] of active) if (!el.isConnected) animation.cancel()
            for (const el of queued) if (!el.isConnected) { observer.unobserve(el); queued.delete(el) }
        })
        mutations.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'open'] })
        document.addEventListener('keydown', key, true)
        document.addEventListener('pointerdown', pointer, true)
        document.addEventListener('focusin', focus)
        reduced.addEventListener('change', finish)
        register(root)
        return () => {
            mutations.disconnect(); observer.disconnect()
            document.removeEventListener('keydown', key, true)
            document.removeEventListener('pointerdown', pointer, true)
            document.removeEventListener('focusin', focus)
            reduced.removeEventListener('change', finish)
            for (const animation of active.values()) animation.cancel()
            active.clear(); queued.clear()
        }
    }, [])
    return null
}
