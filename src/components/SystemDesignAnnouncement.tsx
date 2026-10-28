import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check, Database, Network, Server, X } from 'lucide-react'
import './SystemDesignAnnouncement.css'
import { playAnnouncementAscii } from './announcementAscii'
import { useAuthStore } from '../store/authStore'

/** Both faces stay mounted so the report keeps its state; only the visible face is interactive. */
export default function SystemDesignAnnouncement({ children }: { children: ReactNode }) {
    const owner = useAuthStore((s) => s.user?.id || 'local')
    const preferenceKey = `iv:form:system-design-announcement:${owner}:20261024`
    const [flipped, setFlipped] = useState(() => {
        try {
            return localStorage.getItem(preferenceKey) === 'report'
        } catch {
            return false
        }
    })
    const [busy, setBusy] = useState(() => !window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    const canvas = useRef<HTMLCanvasElement>(null)
    const cancel = useRef<(() => void) | null>(null)
    const active = useRef(false)
    const front = useRef<HTMLDivElement>(null)
    const back = useRef<HTMLDivElement>(null)
    const restore = useRef<HTMLButtonElement>(null)
    const close = useRef<HTMLButtonElement>(null)
    const changed = useRef(false)
    const initialSide = useRef(flipped)
    // Hide the initial face before the browser can paint its static contents.
    // The reveal controller synchronously prepares its hidden state before awaiting.
    useLayoutEffect(() => {
        const face = initialSide.current ? back.current : front.current
        if (!face || !canvas.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            setBusy(false)
            return
        }
        active.current = true
        cancel.current = playAnnouncementAscii(canvas.current, face, face, () => {
            cancel.current?.()
            cancel.current = null
            active.current = false
            setBusy(false)
        }, true)
        return () => {
            cancel.current?.()
            cancel.current = null
            active.current = false
        }
    }, [])
    useLayoutEffect(() => {
        if (!busy) {
            front.current?.style.removeProperty('opacity')
            back.current?.style.removeProperty('opacity')
        }
        front.current?.toggleAttribute('inert', flipped || busy)
        back.current?.toggleAttribute('inert', !flipped || busy)
        if (changed.current && !busy) (flipped ? restore : close).current?.focus({ preventScroll: true })
    }, [flipped, busy])
    function turn(value: boolean, detail: number) {
        if (active.current) return
        const complete = () => {
            cancel.current?.()
            cancel.current = null
            active.current = false
            changed.current = true
            setBusy(false)
            setFlipped(value)
        }
        if (
            detail !== 0 &&
            !window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
            canvas.current &&
            front.current &&
            back.current
        ) {
            active.current = true
            setBusy(true)
            cancel.current = playAnnouncementAscii(
                canvas.current,
                flipped ? back.current : front.current,
                value ? back.current : front.current,
                complete,
            )
        } else complete()
        try {
            localStorage.setItem(preferenceKey, value ? 'report' : 'announcement')
        } catch {
            // Optional display preference must never block dashboard navigation.
        }
    }
    return (
        <div className="sd-announcement" data-flipped={flipped} data-animating={busy} aria-busy={busy}>
            <div className="sd-announcement-rotor">
                <div data-ascii="surface" className="sd-announcement-front" ref={front} aria-hidden={flipped || busy}>
                    <Link to="/system-design" className="sd-announcement-link" tabIndex={flipped ? -1 : 0}>
                        <div className="sd-announcement-copy">
                            <span className="sd-announcement-eyebrow">Новое · архитектура на практике</span>
                            <h2>
                                Тренировки по
                                <br />
                                System Design
                            </h2>
                            <p>
                                25 задач в пяти траекториях. Собери схему, найди причину сбоя и проверь
                                решение.
                            </p>
                            <span data-ascii="fade" className="sd-announcement-cta">
                                Перейти к тренировкам <ArrowRight size={17} />
                            </span>
                        </div>
                        <div className="sd-announcement-diagram" aria-hidden="true">
                            <span>
                                <Server size={23} />
                                <small>API</small>
                            </span>
                            <i />
                            <span className="sd-announcement-hub">
                                <Network size={27} />
                                <small>Распредели</small>
                            </span>
                            <i />
                            <span>
                                <Database size={23} />
                                <small>Данные</small>
                            </span>
                            <b>
                                <Check size={12} /> Решение найдено
                            </b>
                        </div>
                    </Link>
                    <button data-iv-close
                        ref={close}
                        type="button"
                        className="sd-announcement-close"
                        onClick={(e) => turn(true, e.detail)}
                        aria-label="Показать рекомендации по последнему отчёту"
                        tabIndex={flipped ? -1 : 0}
                    >
                        <X size={18} />
                    </button>
                </div>
                <div data-ascii="surface" className="sd-announcement-back" ref={back} aria-hidden={!flipped || busy}>
                    {children}
                    <button
                        ref={restore}
                        type="button"
                        className="sd-announcement-restore"
                        style={{ background: 'transparent', boxShadow: 'none', border: 0, borderRadius: 0, padding: 0 }}
                        onClick={(e) => turn(false, e.detail)}
                        tabIndex={flipped ? 0 : -1}
                    >
                        К новинке System Design <ArrowRight size={14} />
                    </button>
                </div>
            </div>
            <canvas ref={canvas} className="sd-announcement-ascii" aria-hidden="true" />
        </div>
    )
}
