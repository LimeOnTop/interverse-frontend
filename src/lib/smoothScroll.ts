const BASE_SMOOTH_SCROLL_MS = 500

function easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

export function smoothScrollToElement(
    element: HTMLElement,
    options?: { duration?: number; block?: 'start' | 'center' | 'end' },
) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        element.scrollIntoView({ block: options?.block ?? 'start' })
        return
    }

    const duration = options?.duration ?? BASE_SMOOTH_SCROLL_MS * 3
    const block = options?.block ?? 'start'

    const startY = window.scrollY
    const rect = element.getBoundingClientRect()
    let targetY = startY + rect.top

    if (block === 'center') {
        targetY = startY + rect.top - (window.innerHeight - rect.height) / 2
    } else if (block === 'end') {
        targetY = startY + rect.top - (window.innerHeight - rect.height)
    }

    const maxScroll = document.documentElement.scrollHeight - window.innerHeight
    targetY = Math.max(0, Math.min(targetY, maxScroll))

    const distance = targetY - startY
    if (distance === 0) return

    const startTime = performance.now()

    const step = (currentTime: number) => {
        const progress = Math.min((currentTime - startTime) / duration, 1)
        window.scrollTo(0, startY + distance * easeInOutCubic(progress))
        if (progress < 1) requestAnimationFrame(step)
    }

    requestAnimationFrame(step)
}
