import { useLayoutEffect } from 'react'
import { instantMotion, motionCurve } from '../lib/motion'

/** Height fallback for browsers without interpolated native disclosure content. */
export function useNativeDetailsMotion() {
    useLayoutEffect(() => {
        if (CSS.supports('interpolate-size', 'allow-keywords')) return
        const active = new Map<HTMLDetailsElement, { animation: Animation; open: boolean; height: string; overflow: string }>()
        const restore = (el: HTMLDetailsElement) => {
            const state = active.get(el)
            if (!state) return
            active.delete(el)
            state.animation.cancel()
            el.open = state.open
            el.style.height = state.height
            el.style.overflow = state.overflow
        }
        const click = (event: MouseEvent) => {
            if (!(event.target instanceof Element) || event.button !== 0 || event.defaultPrevented) return
            const summary = event.target.closest('summary')
            const el = summary?.parentElement
            if (!(el instanceof HTMLDetailsElement) || event.target.closest('a,button,input,select,textarea')) return
            if (event.detail === 0 || instantMotion()) { restore(el); return }
            event.preventDefault()
            const previous = active.get(el)
            const open = !(previous?.open ?? el.open)
            const from = el.getBoundingClientRect().height
            const height = previous?.height ?? el.style.height
            const overflow = previous?.overflow ?? el.style.overflow
            previous?.animation.cancel()
            el.style.height = height
            el.open = open
            const to = el.getBoundingClientRect().height
            el.open = true
            el.style.height = `${to}px`
            el.style.overflow = 'hidden'
            const animation = el.animate([{ height: `${from}px` }, { height: `${to}px` }], { duration: open ? 700 : 500, easing: motionCurve, fill: 'both' })
            active.set(el, { animation, open, height, overflow })
            animation.onfinish = () => { if (active.get(el)?.animation === animation) restore(el) }
        }
        const reduced = matchMedia('(prefers-reduced-motion: reduce)')
        const settle = () => { for (const el of active.keys()) restore(el) }
        document.addEventListener('click', click)
        reduced.addEventListener('change', settle)
        return () => { document.removeEventListener('click', click); reduced.removeEventListener('change', settle); settle() }
    }, [])
}
