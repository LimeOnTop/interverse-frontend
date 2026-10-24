import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check, Database, Network, Server, X } from 'lucide-react'
import './SystemDesignAnnouncement.css'
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
    const [keyboard, setKeyboard] = useState(false)
    const front = useRef<HTMLDivElement>(null)
    const back = useRef<HTMLDivElement>(null)
    const restore = useRef<HTMLButtonElement>(null)
    const close = useRef<HTMLButtonElement>(null)
    const changed = useRef(false)
    useLayoutEffect(() => {
        front.current?.toggleAttribute('inert', flipped)
        back.current?.toggleAttribute('inert', !flipped)
        if (changed.current) (flipped ? restore : close).current?.focus({ preventScroll: true })
    }, [flipped])
    function turn(value: boolean, detail: number) {
        changed.current = true
        setKeyboard(detail === 0)
        setFlipped(value)
        try {
            localStorage.setItem(preferenceKey, value ? 'report' : 'announcement')
        } catch {
            // Optional display preference must never block dashboard navigation.
        }
    }
    return (
        <div className="sd-announcement" data-flipped={flipped} data-keyboard={keyboard}>
            <div className="sd-announcement-rotor">
                <div className="sd-announcement-front" ref={front} aria-hidden={flipped}>
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
                            <span className="sd-announcement-cta">
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
                    <button
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
                <div className="sd-announcement-back" ref={back} aria-hidden={!flipped}>
                    {children}
                    <button
                        ref={restore}
                        type="button"
                        className="sd-announcement-restore"
                        onClick={(e) => turn(false, e.detail)}
                        tabIndex={flipped ? 0 : -1}
                    >
                        К новинке System Design <ArrowRight size={14} />
                    </button>
                </div>
            </div>
        </div>
    )
}
