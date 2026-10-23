import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { createPortal } from 'react-dom'
import { useReducedMotion } from 'framer-motion'
import { type LucideIcon } from 'lucide-react'
import { PARTS, type BlockKind } from './model'

export interface DropTarget {
    over: boolean
    edgeId: string | null
    blocked: boolean
    zoom: number
}
const emptyTarget: DropTarget = { over: false, edgeId: null, blocked: false, zoom: 1 }
interface Grab {
    kind: BlockKind
    pointerId: number
    startX: number
    startY: number
    x: number
    y: number
    width: number
    height: number
    offsetX: number
    offsetY: number
    active: boolean
    capture: HTMLElement
}

/** Pointer capture works for mouse and the dedicated touch grip; the row itself remains scrollable. */
export function usePaletteDrag({
    hitTest,
    onDrop,
    icons,
}: {
    hitTest: (x: number, y: number) => DropTarget
    onDrop: (kind: BlockKind, x: number, y: number, edgeId: string | null) => void
    icons: Record<BlockKind, LucideIcon>
}) {
    const grab = useRef<Grab | null>(null),
        preview = useRef<HTMLDivElement | null>(null),
        raf = useRef<number>(0),
        suppress = useRef(0)
    const [view, setView] = useState<Grab | null>(null),
        [target, setTarget] = useState<DropTarget>(emptyTarget)
    const targetRef = useRef(emptyTarget),
        reduce = useReducedMotion()
    const callbacks = useRef({ hitTest, onDrop })
    callbacks.current = { hitTest, onDrop }
    const cancel = () => {
        cancelAnimationFrame(raf.current)
        grab.current = null
        setView(null)
        setTarget(emptyTarget)
        targetRef.current = emptyTarget
    }
    useEffect(() => {
        if (!view) return
        const stop = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault()
                suppress.current = Date.now() + 500
                cancel()
            }
        }
        document.addEventListener('keydown', stop)
        document.body.classList.add('sd-grabbing')
        return () => {
            document.removeEventListener('keydown', stop)
            document.body.classList.remove('sd-grabbing')
        }
    }, [view])
    useEffect(() => () => cancelAnimationFrame(raf.current), [])
    const update = () => {
        const g = grab.current
        if (!g?.active) return
        if (preview.current) preview.current.style.transform = `translate3d(${g.x}px,${g.y}px,0)`
        const next = callbacks.current.hitTest(g.x, g.y),
            old = targetRef.current
        if (
            next.over !== old.over ||
            next.edgeId !== old.edgeId ||
            next.blocked !== old.blocked ||
            next.zoom !== old.zoom
        ) {
            targetRef.current = next
            setTarget(next)
        }
    }
    const handlers = (kind: BlockKind, grip = false) => ({
        onPointerDown: (event: ReactPointerEvent<HTMLElement>) => {
            if (event.isPrimary && event.button === 0) suppress.current = 0
            if (!event.isPrimary || event.button !== 0 || (!grip && event.pointerType !== 'mouse')) return
            const element = event.currentTarget,
                rect = (element.closest('.sd-part-card') || element).getBoundingClientRect()
            grab.current = {
                kind,
                pointerId: event.pointerId,
                startX: event.clientX,
                startY: event.clientY,
                x: event.clientX,
                y: event.clientY,
                width: rect.width,
                height: rect.height,
                offsetX: event.clientX - rect.left,
                offsetY: event.clientY - rect.top,
                active: false,
                capture: element,
            }
            element.setPointerCapture(event.pointerId)
        },
        onPointerMove: (event: ReactPointerEvent<HTMLElement>) => {
            const g = grab.current
            if (!g || g.pointerId !== event.pointerId) return
            g.x = event.clientX
            g.y = event.clientY
            if (!g.active && Math.hypot(g.x - g.startX, g.y - g.startY) > 5) {
                g.active = true
                setView({ ...g })
            }
            if (g.active) {
                event.preventDefault()
                cancelAnimationFrame(raf.current)
                raf.current = requestAnimationFrame(update)
            }
        },
        onPointerUp: (event: ReactPointerEvent<HTMLElement>) => {
            const g = grab.current
            if (!g || g.pointerId !== event.pointerId) return
            if (g.active) {
                suppress.current = Date.now() + 500
                const drop = callbacks.current.hitTest(event.clientX, event.clientY)
                if (drop.over && !drop.blocked)
                    callbacks.current.onDrop(g.kind, event.clientX, event.clientY, drop.edgeId)
            }
            cancel()
        },
        onPointerCancel: () => {
            if (!grab.current) return
            suppress.current = Date.now() + 500
            cancel()
        },
        onLostPointerCapture: () => {
            if (grab.current) {
                suppress.current = Date.now() + 500
                cancel()
            }
        },
    })
    let ghost = null
    if (view) {
        const Icon = icons[view.kind],
            compact = target.over,
            zoom = target.zoom
        ghost = createPortal(
            <div
                className="sd-page sd-drag-preview"
                ref={(element) => {
                    preview.current = element
                    if (element) {
                        const g = grab.current || view
                        element.style.transform = `translate3d(${g.x}px,${g.y}px,0)`
                    }
                }}
                aria-hidden="true"
            >
                <div
                    className="sd-drag-original"
                    style={{
                        width: view.width,
                        minHeight: view.height,
                        opacity: compact ? 0 : 0.94,
                        transform: `translate(${-view.offsetX}px,${-view.offsetY}px) scale(${compact ? 0.82 : 1})`,
                        transitionDuration: reduce ? '0ms' : undefined,
                    }}
                >
                    <span className="sd-node-icon">
                        <Icon size={20} />
                    </span>
                    <div>
                        <strong>{PARTS[view.kind].label}</strong>
                        <small>{PARTS[view.kind].detail}</small>
                    </div>
                </div>
                <div
                    className={`sd-node sd-drag-compact ${target.blocked ? 'is-blocked' : ''}`}
                    style={{
                        opacity: compact ? 1 : 0,
                        transform: `translate(${-102 * zoom}px,${-38 * zoom}px) scale(${compact ? zoom : view.width / 204})`,
                        transitionDuration: reduce ? '0ms' : undefined,
                    }}
                >
                    <span className="sd-node-icon">
                        <Icon size={19} />
                    </span>
                    <span className="sd-node-copy">
                        <strong>{PARTS[view.kind].label}</strong>
                        <small>{PARTS[view.kind].short}</small>
                    </span>
                </div>
                {compact && (
                    <span className="sd-drop-tip" style={{ transform: `translate(-50%,${50 * zoom}px)` }}>
                        {target.blocked
                            ? 'Выберите свободное место'
                            : target.edgeId
                              ? 'Встроить в связь'
                              : 'Добавить на доску'}
                    </span>
                )}
            </div>,
            document.body,
        )
    }
    return {
        handlers,
        ghost,
        target,
        activeKind: view?.kind || null,
        consumeClick: () => Date.now() < suppress.current,
    }
}

const edgeGeometry = new WeakMap<SVGPathElement, { key: string; points: { x: number; y: number }[] }>()

/** Read only rendered SVG geometry, including when a dragged node covers the edge's hit area. */
export function edgeAtPoint(
    board: HTMLElement | null,
    x: number,
    y: number,
    exclude: string[] = [],
): string | null {
    if (!board) return null
    let closest: string | null = null,
        distance = 24
    for (const path of board.querySelectorAll<SVGPathElement>('.react-flow__edge-path')) {
        const edge = path.closest('.react-flow__edge'),
            id = edge?.getAttribute('data-id')
        if (!id || exclude.includes(id)) continue
        const matrix = path.getScreenCTM()
        if (!matrix) continue
        const key = `${path.getAttribute('d')}|${matrix.a},${matrix.b},${matrix.c},${matrix.d},${matrix.e},${matrix.f}`
        let geometry = edgeGeometry.get(path)
        if (!geometry || geometry.key !== key) {
            const length = path.getTotalLength(),
                steps = Math.max(8, Math.min(400, Math.ceil((length * Math.hypot(matrix.a, matrix.b)) / 10)))
            const points = Array.from({ length: steps + 1 }, (_, i) => {
                const point = path.getPointAtLength((length * i) / steps).matrixTransform(matrix)
                return { x: point.x, y: point.y }
            })
            geometry = { key, points }
            edgeGeometry.set(path, geometry)
        }
        for (const point of geometry.points) {
            const d = Math.hypot(point.x - x, point.y - y)
            if (d < distance) {
                distance = d
                closest = id
            }
        }
    }
    return closest
}
