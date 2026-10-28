import { useLayoutEffect, useRef } from 'react'
import { animate } from 'framer-motion'
import { instantMotion, motionEase, motionTiming } from '../../lib/motion'

/** Animate only presentation; assistive technology always reads the actual value. */
export default function AnimatedNumber({ value, pad = 0 }: { value: number; pad?: number }) {
    const ref = useRef<HTMLSpanElement>(null)
    const previous = useRef(0)
    useLayoutEffect(() => {
        const el = ref.current
        if (!el) return
        let controls: ReturnType<typeof animate> | undefined
        const reduced = matchMedia('(prefers-reduced-motion: reduce)')
        const precision = Number.isInteger(value) ? 0 : Math.min(2, String(value).split('.')[1]?.length || 0)
        const write = (n: number) => { if (el.firstChild) el.firstChild.nodeValue = Number(n.toFixed(precision)).toString().padStart(pad, '0') }
        const finish = () => { controls?.stop(); write(value); previous.current = value }
        const start = () => {
            if (instantMotion()) { finish(); return }
            write(previous.current)
            controls = animate(previous.current, value, { duration: motionTiming.value / 1000, ease: motionEase,
                onUpdate: n => { previous.current = n; write(n) }, onComplete: finish })
        }
        const observer = new IntersectionObserver(entries => {
            if (entries.some(e => e.isIntersecting)) { observer.disconnect(); start() }
        })
        const rect = el.getBoundingClientRect()
        if (rect.top < innerHeight && rect.bottom > 0) start()
        else observer.observe(el)
        const change = () => { if (reduced.matches) finish() }
        reduced.addEventListener('change', change)
        return () => { observer.disconnect(); controls?.stop(); reduced.removeEventListener('change', change) }
    }, [value, pad])
    return <span data-motion-owned aria-label={String(value)}><span ref={ref} aria-hidden="true">{String(value).padStart(pad, '0')}</span></span>
}
