import { createAsciiReveal } from 'ascii-reveal/core'
import { announcementAsciiOptions } from '../../components/announcementAscii'

export interface BoardRevealController {
    reveal(): Promise<void>
    hide(): Promise<void>
    destroy(): void
}

// Keep the production DOM-based surface, frame and per-character reveal.
// The vendored engine accounts for ancestor scale when drawing text.
export function createBoardReveal(root: HTMLElement): BoardRevealController {
    const effect = createAsciiReveal(root, {
        ...announcementAsciiOptions,
        surfaces: '.sd-board-section',
        fades: '.sd-toolbar',
    })
    let alive = true
    const animate = async (direction: 'reveal' | 'hide') => {
        delete root.dataset.sdRevealPreparing
        root.dataset.sdRevealPhase = 'animating'
        try {
            await effect[direction]()
        } finally {
            if (alive) root.dataset.sdRevealPhase = 'ready'
        }
    }
    return {
        reveal: () => animate('reveal'),
        hide: () => animate('hide'),
        destroy() {
            alive = false
            effect.destroy()
        },
    }
}
