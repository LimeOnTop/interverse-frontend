import { toCanvas } from 'html-to-image'
import { createAsciiReveal, type AsciiRevealController } from 'ascii-reveal/core'
import { announcementAsciiOptions } from '../../components/announcementAscii'

export interface BoardRevealController {
    reveal(): Promise<void>
    hide(): Promise<void>
    destroy(): void
}

// Capture the already-fitted board once. Text, SVG icons, ports and paths share
// the same pixel coordinates, including React Flow's viewport scale.
export function createBoardReveal(root: HTMLElement, board: HTMLElement): BoardRevealController {
    let alive = true
    let run = 0
    let layer: HTMLDivElement | null = null
    let effect: AsciiRevealController | null = null
    const clear = () => {
        effect?.destroy()
        effect = null
        layer?.remove()
        layer = null
    }
    const showLive = () => { delete board.dataset.sdSnapshotHidden }
    const animate = async (direction: 'reveal' | 'hide') => {
        const current = ++run
        clear()
        let timer: ReturnType<typeof setTimeout> | undefined
        try {
            const canvas = await Promise.race([
                toCanvas(board, {
                    pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
                    skipFonts: true, // The board uses the site's system font stack.
                    style: { opacity: '1', visibility: 'visible' },
                    filter: (node) => !(node instanceof Element && node.classList.contains('ar-overlay')),
                }),
                new Promise<never>((_, reject) => {
                    timer = setTimeout(() => reject(new Error('Board snapshot timeout')), 1500)
                }),
            ])
            if (!alive || current !== run) return
            const rect = board.getBoundingClientRect()
            const parent = root.getBoundingClientRect()
            const overlay = document.createElement('div')
            overlay.className = 'sd-board-reveal'
            overlay.setAttribute('aria-hidden', 'true')
            Object.assign(overlay.style, {
                left: `${rect.left - parent.left - root.clientLeft + root.scrollLeft}px`,
                top: `${rect.top - parent.top - root.clientTop + root.scrollTop}px`,
                width: `${rect.width}px`, height: `${rect.height}px`,
            })
            canvas.style.width = `${rect.width}px`
            canvas.style.height = `${rect.height}px`
            canvas.style.display = 'block'
            overlay.append(canvas)
            root.append(overlay)
            layer = overlay
            board.dataset.sdSnapshotHidden = 'true'
            delete root.dataset.sdRevealPreparing
            root.dataset.sdRevealPhase = 'animating'
            const controller = createAsciiReveal(overlay, {
                ...announcementAsciiOptions,
                media: 'canvas', surfaces: '[data-no-surface]', fades: '[data-no-fade]',
            })
            effect = controller
            if (direction === 'reveal') await controller.hide({ instant: true })
            if (!alive || current !== run) return
            await controller[direction]()
        } catch {
            // An unsupported SVG/canvas capture must never leave the board hidden.
        } finally {
            clearTimeout(timer)
            if (alive && current === run) {
                showLive()
                clear()
                delete root.dataset.sdRevealPreparing
                root.dataset.sdRevealPhase = 'ready'
            }
        }
    }
    return {
        reveal: () => animate('reveal'), hide: () => animate('hide'),
        destroy() {
            alive = false
            run++
            clear()
            showLive()
        },
    }
}
