import { createAsciiReveal } from 'ascii-reveal/core'

/** Original Dither preset by Quan Hoang, pinned in package-lock.json (MIT). */
export function playAnnouncementAscii(
    _canvas: HTMLCanvasElement,
    from: HTMLElement,
    to: HTMLElement,
    done: () => void,
    entryOnly = false,
) {
    const options = { preset: 'dither' as const, duration: 'cinematic' as const, speed: 0.7, lazy: false }
    if (from !== to) to.style.setProperty('opacity', '0', 'important')
    const outgoing = createAsciiReveal(from, options)
    const incoming = from === to ? outgoing : createAsciiReveal(to, options)
    let cancelled = false
    const clean = () => {
        cancelled = true
        outgoing.destroy()
        if (incoming !== outgoing) incoming.destroy()
        if (from !== to) from.style.setProperty('opacity', '0', 'important')
        to.style.opacity = '1'
    }
    const run = async () => {
        if (!entryOnly) {
            await outgoing.hide()
            if (cancelled) return
            from.style.setProperty('opacity', '0', 'important')
        }
        // Measure the actual DOM with the target visible, then hide synchronously before painting.
        to.style.setProperty('opacity', '0', 'important')
        await incoming.hide({ instant: true })
        if (cancelled) return
        to.style.opacity = '1'
        await incoming.reveal()
        if (!cancelled) done()
    }
    void run().catch(() => { if (!cancelled) done() })
    return clean
}
