import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { Link, useParams } from 'react-router-dom'
import {
    Background,
    Controls,
    Handle,
    MarkerType,
    Position,
    ReactFlow,
    ReactFlowProvider,
    useReactFlow,
    type Node,
    type NodeProps,
    type NodeChange,
    type Connection,
} from '@xyflow/react'
import {
    ArrowLeft,
    ArrowRight,
    Check,
    CheckCircle2,
    XCircle,
    GripVertical,
    Copy,
    AlertCircle,
    Network,
    Database,
    Server,
    Users,
    Layers3,
    Mail,
    Globe,
    HardDrive,
    GitBranch,
    Plus,
    Trash2,
    Undo2,
    Redo2,
    RotateCcw,
    Lightbulb,
    Play,
    Maximize2,
    Minimize2,
    X,
    type LucideIcon,
} from 'lucide-react'
import '@xyflow/react/dist/style.css'
import './system-design.css'
import BoardSelect from './BoardSelect'
import { usePromoStore } from '../../store/promoStore'
import { resolveSubscriptionPlan } from '../../utils/subscription'
import { usePaletteDrag, edgeAtPoint } from './paletteDrag'
import { useModalDialog } from '../../hooks/useModalDialog'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuthStore } from '../../store/authStore'
import {
    EXERCISES,
    TRACKS,
    PARTS,
    arrange,
    insertBlockOnWire,
    removeDesignBlock,
    capacity,
    cloneDesign,
    evaluate,
    restoreDesign,
    wouldCycle,
    type BlockKind,
    type Design,
    type Evaluation,
    type Exercise,
} from './model'

const icons: Record<BlockKind, LucideIcon> = {
    dedup: Layers3,
    retry: Network,
    timeout: Network,
    breaker: Network,
    limiter: Network,
    outbox: Network,
    dlq: Network,
    replication: GitBranch,
    quorum: GitBranch,
    transaction: GitBranch,
    coalescer: Layers3,
    versioning: Layers3,
    client: Users,
    api: Server,
    database: Database,
    balancer: Network,
    cache: Layers3,
    queue: Mail,
    worker: Server,
    cdn: Globe,
    storage: HardDrive,
    shard: GitBranch,
}
const storageKey = (owner: string, id: string) => `iv:form:system-design:${owner}:${id}`
function load(owner: string, ex: Exercise): Design {
    try {
        const saved = JSON.parse(localStorage.getItem(storageKey(owner, ex.id)) || 'null')
        if (saved?.version === 1) return restoreDesign(saved.design, ex) || cloneDesign(ex.initial)
    } catch {
        /* A corrupt or unavailable cache starts a fresh exercise. */
    }
    return cloneDesign(ex.initial)
}
type BoardNode = Node<
    {
        kind: BlockKind
        label: string
        detail: string
        load?: number
        limit: number
        overloaded: boolean
        required: boolean
    },
    'architecture'
>
function ArchitectureNode({ data, selected }: NodeProps<BoardNode>) {
    const Icon = icons[data.kind]
    return (
        <div className={`sd-node ${selected ? 'is-selected' : ''} ${data.overloaded ? 'is-overloaded' : ''}`}>
            {data.kind !== 'client' && (
                <Handle type="target" position={Position.Left} aria-label={`Вход: ${data.label}`} />
            )}
            <span className={`sd-node-icon sd-kind-${data.kind}`}>
                <Icon size={19} />
            </span>
            <span className="sd-node-copy">
                <strong>{data.label}</strong>
                <small>
                    {data.load === undefined
                        ? data.detail
                        : `${Math.round(data.load).toLocaleString('ru-RU')} / ${Number.isFinite(data.limit) ? data.limit.toLocaleString('ru-RU') : '∞'} RPS`}
                </small>
            </span>
            {data.overloaded && <XCircle size={16} aria-label="Перегрузка" />}
            {data.kind !== 'storage' && (
                <Handle type="source" position={Position.Right} aria-label={`Выход: ${data.label}`} />
            )}
        </div>
    )
}
const nodeTypes = { architecture: ArchitectureNode }
type Panel = 'task' | 'parts' | 'wires' | 'result'
const panelLabels: Record<Panel, string> = {
    task: 'Задание',
    parts: 'Блоки',
    wires: 'Связи',
    result: 'Проверка',
}

export default function SystemDesignPage() {
    const { id } = useParams()
    const user = useAuthStore(s => s.user)
    const owner = user?.id || 'local'
    const isPro = resolveSubscriptionPlan(user) === 'paid'
    const openPromo = usePromoStore(s => s.openLimitPromo)
    const ex = EXERCISES.find((e) => e.id === id)
    const locked = !!ex && ex.id !== EXERCISES[0].id && !isPro
    useEffect(() => { if (locked) openPromo() }, [locked, openPromo])
    const completed = EXERCISES.filter((e) => evaluate(e, load(String(owner), e)).passed).length
    if (id && !ex)
        return (
            <div className="sd-page">
                <h1>Задача не найдена</h1>
                <Link to="/system-design">К задачам System Design</Link>
            </div>
        )
    if (locked) return <div className="sd-page">
        <Link to="/system-design">← Все задачи</Link>
        <h1 className="mt-6 text-2xl font-semibold">{ex!.title}</h1>
        <p className="mt-3">Эта тренировка доступна в Pro. Первая тренировка — бесплатно.</p>
        <button className="sd-primary mt-5" onClick={openPromo}>Открыть Pro</button>
    </div>
    if (ex)
        return (
            <ReactFlowProvider key={`${owner}:${ex.id}`}>
                <Editor exercise={ex} owner={String(owner)} />
            </ReactFlowProvider>
        )
    return (
        <div className="sd-page">
            <div className="sd-intro">
                <span className="sd-eyebrow">Архитектура на практике</span>
                <h1>System Design</h1>
                <p>Найдите узкое место. Измените схему. Проверьте решение. Первая тренировка — бесплатно, остальные 24 — в Pro.</p>
                <div className="sd-intro-meta">
                    <span>
                        <Network size={16} />
                        {EXERCISES.length} задач · {TRACKS.length} траекторий
                    </span>
                    <span>
                        <CheckCircle2 size={16} />
                        {completed} из {EXERCISES.length} решено
                    </span>
                </div>
            </div>
            <nav className="sd-track-nav" aria-label="Траектории System Design">
                {TRACKS.map((track, i) => (
                    <a key={track} href={`#trajectory-${i}`}>
                        {track}
                    </a>
                ))}
            </nav>
            {TRACKS.map((track, trackIndex) => (
                <section className="sd-track" id={`trajectory-${trackIndex}`} key={track}>
                    <div className="sd-track-heading">
                        <h2>
                            {trackIndex + 1}. {track}
                        </h2>
                        <span>
                            {
                                EXERCISES.filter(
                                    (t) =>
                                        (t.track || TRACKS[0]) === track &&
                                        evaluate(t, load(String(owner), t)).passed,
                                ).length
                            }{' '}
                            / 5 решено
                        </span>
                    </div>
                    <div className="sd-exercises">
                        {EXERCISES.filter((t) => (t.track || TRACKS[0]) === track).map((task) => {
                            const i = EXERCISES.indexOf(task)
                            const solved = evaluate(task, load(String(owner), task)).passed
                            return (
                                <Link className="sd-exercise" to={`/system-design/${task.id}`} key={task.id}
                                    onClick={event => { if (i > 0 && !isPro) { event.preventDefault(); openPromo() } }}>
                                    <span className={`sd-exercise-number ${solved ? 'is-complete' : ''}`}>
                                        {solved ? <Check size={22} /> : String(i + 1).padStart(2, '0')}
                                    </span>
                                    <div>
                                        <span className={`sd-access-badge ${i === 0 ? 'is-free' : ''}`}>{i === 0 ? 'Бесплатно' : 'Pro'}</span>
                                        <span className="sd-eyebrow">{task.topic}</span>
                                        <h2>{task.title}</h2>
                                        <p>{task.incident}</p>
                                        <span className="sd-exercise-foot">
                                            {task.demand.toLocaleString('ru-RU')} запросов/с ·{' '}
                                            {solved ? 'Решено · открыть' : '10–15 минут'}
                                        </span>
                                    </div>
                                    <ArrowRight className="sd-card-arrow" size={22} />
                                </Link>
                            )
                        })}
                    </div>
                </section>
            ))}
            <p className="sd-local-note">
                Учебная модель с заданными лимитами. Прогресс сохраняется в этом браузере. Обычные попытки
                тренировок не расходуются.
            </p>
        </div>
    )
}

function Editor({ exercise: ex, owner }: { exercise: Exercise; owner: string }) {
    const [design, setDesign] = useState<Design>(() => load(owner, ex))
    const [past, setPast] = useState<Design[]>([])
    const [future, setFuture] = useState<Design[]>([])
    const [selected, setSelected] = useState<string | null>(null)
    const [measurements, setMeasurements] = useState<Record<string, { width: number; height: number }>>({})
    const [panel, setPanel] = useState<Panel>('task')
    const [result, setResult] = useState<Evaluation | null>(null)
    const [running, setRunning] = useState(false)
    const [hint, setHint] = useState(false)
    const [resetOpen, setResetOpen] = useState(false)
    const [selectedWireId, setSelectedWireId] = useState<string | null>(null)
    const [insertionEdge, setInsertionEdge] = useState<string | null>(null)
    const edgeActionsRef = useRef<HTMLDivElement>(null)
    const boardRef = useRef<HTMLDivElement>(null)
    const [source, setSource] = useState('')
    const [target, setTarget] = useState('')
    const [notice, setNotice] = useState('')
    const [expanded, setExpanded] = useState(false)
    const panelRef = useRef<HTMLDivElement>(null)
    const sideRef = useRef<HTMLElement>(null)
    const expandButton = useRef<HTMLButtonElement>(null)
    const [saving, setSaving] = useState(false)
    const [saveError, setSaveError] = useState(false)
    const { isDark } = useTheme()
    const reducedMotion = useReducedMotion()
    const flow = useReactFlow<BoardNode>()
    const runTimer = useRef<ReturnType<typeof setTimeout>>()
    const designRef = useRef(design)
    designRef.current = design
    useEffect(
        () => () => {
            clearTimeout(runTimer.current)
        },
        [],
    )
    useEffect(() => {
        setSaving(true)
        const timer = setTimeout(() => {
            try {
                localStorage.setItem(storageKey(owner, ex.id), JSON.stringify({ version: 1, design }))
                setSaveError(false)
            } catch {
                setSaveError(true)
            }
            setSaving(false)
        }, 180)
        return () => clearTimeout(timer)
    }, [design, owner, ex.id])
    useEffect(() => {
        const flush = () => {
            try {
                localStorage.setItem(
                    storageKey(owner, ex.id),
                    JSON.stringify({ version: 1, design: designRef.current }),
                )
            } catch {
                /* Session-only work remains usable without storage. */
            }
        }
        window.addEventListener('pagehide', flush)
        return () => {
            window.removeEventListener('pagehide', flush)
            flush()
        }
    }, [owner, ex.id])
    useEffect(() => {
        panelRef.current?.scrollTo({ top: 0 })
    }, [panel, result])
    useEffect(() => {
        if (!expanded) return
        const close = (event: KeyboardEvent) => {
            if (
                event.key === 'Escape' &&
                !event.defaultPrevented &&
                !resetOpen &&
                !document.body.classList.contains('sd-grabbing') &&
                !document.querySelector('.sd-select-content')
            ) {
                setExpanded(false)
                expandButton.current?.focus()
            }
        }
        document.addEventListener('keydown', close)
        return () => document.removeEventListener('keydown', close)
    }, [expanded, resetOpen])
    useEffect(() => {
        const board = boardRef.current
        if (!board) return
        let width = board.clientWidth,
            frame = 0
        const observer = new ResizeObserver(() => {
            const next = board.clientWidth
            if (Math.abs(next - width) > 20) {
                width = next
                cancelAnimationFrame(frame)
                frame = requestAnimationFrame(
                    () => void flow.fitView({ padding: 0.2, maxZoom: 1, duration: 0 }),
                )
            }
        })
        observer.observe(board)
        return () => {
            observer.disconnect()
            cancelAnimationFrame(frame)
        }
    }, [flow])
    const selectEdge = (id: string) => {
        setSelectedWireId(id)
        setSelected(null)
        if (window.matchMedia('(max-width:800px)').matches)
            requestAnimationFrame(() => edgeActionsRef.current?.scrollIntoView({ block: 'nearest' }))
    }
    const invalidate = useCallback(() => {
        setResult(null)
        setRunning(false)
        clearTimeout(runTimer.current)
        setNotice('')
    }, [])
    const checkpoint = useCallback(() => {
        setPast((p) => [...p.slice(-39), cloneDesign(designRef.current)])
        setFuture([])
    }, [])
    const commit = useCallback(
        (next: Design, topologyChanged = true) => {
            checkpoint()
            setDesign(next)
            if (topologyChanged) invalidate()
        },
        [checkpoint, invalidate],
    )
    const undo = () => {
        if (!past.length) return
        setFuture((f) => [cloneDesign(design), ...f])
        setDesign(past[past.length - 1])
        setPast((p) => p.slice(0, -1))
        setSelected(null)
        invalidate()
    }
    const redo = () => {
        if (!future.length) return
        setPast((p) => [...p, cloneDesign(design)])
        setDesign(future[0])
        setFuture((f) => f.slice(1))
        setSelected(null)
        invalidate()
    }
    const addPart = (
        kind: BlockKind,
        at?: { x: number; y: number },
        wireId: string | null = selectedWireId,
        animate = true,
    ) => {
        const current = designRef.current
        if (current.blocks.length >= 15) {
            setNotice('На доске уже 15 блоков. Удалите лишний блок.')
            return
        }
        const edge = current.wires.find((w) => w.id === wireId),
            from = current.blocks.find((n) => n.id === edge?.source),
            to = current.blocks.find((n) => n.id === edge?.target)
        const point = flow.screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
        const pos =
            at ||
            (from && to
                ? { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 }
                : {
                      x: Math.max(50, Math.min(900, point.x)),
                      y: Math.max(280, ...current.blocks.map((n) => n.y + 100)),
                  })
        const id = `${kind}-${crypto.randomUUID()}`,
            block = { id, kind, ...pos }
        const next = wireId
            ? insertBlockOnWire(current, block, wireId)
            : { ...current, blocks: [...current.blocks, block] }
        if (!next) {
            setNotice('Не удалось встроить блок в эту связь. Выберите другую связь.')
            return
        }
        commit(next)
        setSelected(id)
        setSelectedWireId(null)
        setNotice(
            wireId
                ? `${PARTS[kind].label} встроен в связь. Обе стрелки созданы автоматически.`
                : `Добавлен: ${PARTS[kind].label}. Соедините его с другими блоками.`,
        )
        if (!at || wireId)
            requestAnimationFrame(
                () =>
                    void flow.fitView({
                        padding: 0.2,
                        duration: reducedMotion || !animate ? 0 : 180,
                        maxZoom: 1,
                    }),
            )
    }
    const palette = usePaletteDrag({
        icons,
        hitTest: (x, y) => {
            const board = boardRef.current,
                rect = board?.getBoundingClientRect(),
                element = document.elementFromPoint(x, y)
            const over = Boolean(
                rect &&
                    x >= rect.left &&
                    x <= rect.right &&
                    y >= rect.top &&
                    y <= rect.bottom &&
                    !element?.closest('.react-flow__controls,.sd-fit,.sd-edge-actions,.sd-inspector'),
            )
            return {
                over,
                edgeId: over ? edgeAtPoint(board, x, y) : null,
                blocked: over && Boolean(element?.closest('.react-flow__node')),
                zoom: flow.getZoom(),
            }
        },
        onDrop: (kind, x, y, edgeId) => {
            const point = flow.screenToFlowPosition({ x, y })
            addPart(kind, { x: point.x - 102, y: point.y - 38 }, edgeId)
        },
    })
    const canConnect = useCallback((c: Pick<Connection, 'source' | 'target'>) => {
        const current = designRef.current
        return Boolean(
            c.source &&
                c.target &&
                c.source !== c.target &&
                current.blocks.some((n) => n.id === c.source) &&
                current.blocks.some((n) => n.id === c.target && n.kind !== 'client') &&
                !current.wires.some((w) => w.source === c.source && w.target === c.target) &&
                !wouldCycle(current, c.source, c.target),
        )
    }, [])
    const connect = useCallback(
        (c: Pick<Connection, 'source' | 'target'>) => {
            if (!canConnect(c)) {
                setNotice('Связь не добавлена: выберите разные блоки без дубликатов и циклов.')
                return
            }
            const current = designRef.current
            commit({
                ...current,
                wires: [...current.wires, { id: crypto.randomUUID(), source: c.source!, target: c.target! }],
            })
            setNotice('Связь добавлена. Стрелка показывает направление запроса.')
        },
        [canConnect, commit],
    )
    const onNodesChange = useCallback(
        (changes: NodeChange<BoardNode>[]) => {
            const dimensions = changes.filter((c) => c.type === 'dimensions')
            if (dimensions.length)
                setMeasurements((previous) => {
                    const next = { ...previous }
                    let changed = false
                    for (const change of dimensions)
                        if (change.type === 'dimensions' && change.dimensions) {
                            if (
                                previous[change.id]?.width !== change.dimensions.width ||
                                previous[change.id]?.height !== change.dimensions.height
                            ) {
                                next[change.id] = change.dimensions
                                changed = true
                            }
                        }
                    return changed ? next : previous
                })
            const selection = changes.find((c) => c.type === 'select' && c.selected)
            if (selection?.type === 'select') {
                setSelected(selection.id)
                setSelectedWireId(null)
            }

            const positions = changes.filter((c) => c.type === 'position')
            if (!positions.length) return
            if (positions.some((c) => c.type === 'position' && c.dragging === undefined && c.position))
                checkpoint()
            setDesign((d) => ({
                ...d,
                blocks: d.blocks.map((n) => {
                    const change = positions.find((c) => c.id === n.id)
                    return change?.type === 'position' && change.position
                        ? { ...n, x: change.position.x, y: change.position.y }
                        : n
                }),
            }))
        },
        [checkpoint],
    )
    const label = useCallback(
        (id: string) => {
            const n = design.blocks.find((n) => n.id === id)
            if (!n) return id
            const peers = design.blocks.filter((b) => b.kind === n.kind)
            const index = peers.findIndex((b) => b.id === id)
            return PARTS[n.kind].label + (peers.length > 1 ? ` ${index + 1}` : '')
        },
        [design.blocks],
    )
    const nodes: BoardNode[] = useMemo(
        () =>
            design.blocks.map((n) => ({
                id: n.id,
                type: 'architecture',
                position: { x: n.x, y: n.y },
                measured: measurements[n.id],
                selected: selected === n.id,
                deletable: false,
                data: {
                    kind: n.kind,
                    label: label(n.id),
                    detail: ['api', 'database', 'worker', 'storage'].includes(n.kind)
                        ? `${capacity(ex, n).toLocaleString('ru-RU')} RPS`
                        : PARTS[n.kind].short,
                    limit: capacity(ex, n),
                    load: result?.loads[n.id],
                    overloaded: result?.overloaded.includes(n.id) || false,
                    required: ex.initial.blocks.some((b) => b.id === n.id),
                },
            })),
        [design.blocks, ex, label, result, selected, measurements],
    )
    const edges = useMemo(
        () =>
            design.wires.map((w) => ({
                ...w,
                type: 'smoothstep',
                animated: running,
                markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 },
                style: {
                    stroke: result?.overloaded.includes(w.target) ? 'var(--sd-danger)' : 'var(--sd-edge)',
                    strokeWidth: 2,
                },
                className:
                    (palette.target.edgeId || insertionEdge) === w.id
                        ? 'is-drop-target'
                        : selectedWireId === w.id
                          ? 'is-selected-wire'
                          : '',
                interactionWidth: 36,
                ariaLabel: `${label(w.source)} → ${label(w.target)}`,
            })),
        [design.wires, label, result, running, palette.target.edgeId, insertionEdge, selectedWireId],
    )
    useEffect(() => {
        if (source && !design.blocks.some((node) => node.id === source)) setSource('')
        if (target && !design.blocks.some((node) => node.id === target)) setTarget('')
    }, [design.blocks, source, target])
    useEffect(() => {
        if (selectedWireId && !design.wires.some((w) => w.id === selectedWireId)) setSelectedWireId(null)
    }, [design.wires, selectedWireId])
    const selectedBlock = design.blocks.find((n) => n.id === selected)
    const removeSelected = () => {
        if (!selected) return
        if (ex.initial.blocks.some((n) => n.id === selected)) {
            setNotice('Исходные блоки остаются на доске. Их связи можно изменить.')
            return
        }
        commit(removeDesignBlock(design, selected))
        setNotice('Блок удалён. Для линейного участка связь восстановлена автоматически.')
        setSelected(null)
    }
    const selectedWire = design.wires.find((w) => w.id === selectedWireId)
    const removeWire = () => {
        if (!selectedWireId) return
        commit({
            ...designRef.current,
            wires: designRef.current.wires.filter((w) => w.id !== selectedWireId),
        })
        setSelectedWireId(null)
    }
    const shortcuts = useRef({ undo, redo, removeSelected, removeWire, selected, selectedWireId })
    shortcuts.current = { undo, redo, removeSelected, removeWire, selected, selectedWireId }
    useEffect(() => {
        const keydown = (event: KeyboardEvent) => {
            if (
                event.defaultPrevented ||
                resetOpen ||
                document.body.classList.contains('sd-grabbing') ||
                document.querySelector('.sd-select-content')
            )
                return
            const element = event.target as HTMLElement
            if (
                element.closest(
                    'input,textarea,select,[role="combobox"],[role="option"],[contenteditable="true"]',
                )
            )
                return
            const current = shortcuts.current
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
                event.preventDefault()
                if (event.shiftKey) current.redo()
                else current.undo()
            } else if (event.ctrlKey && event.key.toLowerCase() === 'y') {
                event.preventDefault()
                current.redo()
            } else if (
                event.key === 'Delete' ||
                (event.key === 'Backspace' && element.closest('.react-flow'))
            ) {
                event.preventDefault()
                if (current.selectedWireId) current.removeWire()
                else current.removeSelected()
            }
        }
        document.addEventListener('keydown', keydown)
        return () => document.removeEventListener('keydown', keydown)
    }, [resetOpen])
    const nodeInsertionTarget = (id: string, event: MouseEvent | TouchEvent) => {
        const point = 'touches' in event ? event.touches[0] || event.changedTouches[0] : event
        if (!point) return null
        const x = point.clientX,
            y = point.clientY
        if (document.elementFromPoint(x, y)?.closest('.sd-edge-actions,.sd-inspector')) return null
        const current = designRef.current,
            block = current.blocks.find((n) => n.id === id)
        const edgeId = edgeAtPoint(
            boardRef.current,
            x,
            y,
            current.wires.filter((w) => w.source === id || w.target === id).map((w) => w.id),
        )
        return block && edgeId && insertBlockOnWire(current, block, edgeId) ? edgeId : null
    }
    const check = () => {
        setResult(evaluate(ex, design))
        setPanel('result')
        if (window.matchMedia('(max-width:800px)').matches)
            requestAnimationFrame(() => sideRef.current?.scrollIntoView({ block: 'start' }))
        setRunning(true)
        clearTimeout(runTimer.current)
        runTimer.current = setTimeout(() => setRunning(false), 2200)
    }
    const number = EXERCISES.findIndex((t) => t.id === ex.id)
    const next = EXERCISES[number + 1]
    return (
        <div className="sd-page sd-editor">
            <div className="sd-editor-heading">
                <Link to="/system-design" className="sd-back">
                    <ArrowLeft size={16} />
                    Все задачи
                </Link>
                <span className="sd-eyebrow">
                    Задача {number + 1} / {EXERCISES.length} · {ex.topic}
                </span>
            </div>
            <div className="sd-title-row">
                <h1>{ex.title}</h1>
                <span className="sd-save">
                    {saveError ? 'Не удалось сохранить' : saving ? 'Сохранение…' : 'Сохранено в браузере'}
                </span>
            </div>
            <div
                className={`sd-workspace ${expanded ? 'is-expanded' : ''}`}
                role={expanded ? 'dialog' : undefined}
                aria-modal={expanded ? true : undefined}
                aria-label={expanded ? 'Доска System Design' : undefined}
                onKeyDown={(event) => {
                    if (!expanded || event.key !== 'Tab') return
                    const focusable = Array.from(
                        event.currentTarget.querySelectorAll<HTMLElement>(
                            'button:not(:disabled), a[href], select, [tabindex="0"]',
                        ),
                    )
                    if (event.shiftKey && document.activeElement === focusable[0]) {
                        event.preventDefault()
                        focusable[focusable.length - 1]?.focus()
                    } else if (
                        !event.shiftKey &&
                        document.activeElement === focusable[focusable.length - 1]
                    ) {
                        event.preventDefault()
                        focusable[0]?.focus()
                    }
                }}
            >
                <section className="sd-board-section" aria-label="Редактор архитектуры">
                    <div className="sd-toolbar">
                        <div className="sd-toolbar-group">
                            <button
                                onClick={undo}
                                disabled={!past.length}
                                title="Отменить"
                                aria-label="Отменить"
                            >
                                <Undo2 size={18} />
                            </button>
                            <button
                                onClick={redo}
                                disabled={!future.length}
                                title="Повторить"
                                aria-label="Повторить"
                            >
                                <Redo2 size={18} />
                            </button>
                            <span className="sd-toolbar-divider" />
                            <button
                                onClick={() => {
                                    commit(arrange(design), false)
                                    requestAnimationFrame(
                                        () => void flow.fitView({ padding: 0.15, maxZoom: 1 }),
                                    )
                                }}
                                aria-label="Упорядочить блоки"
                                title="Упорядочить блоки"
                            >
                                <GitBranch size={17} />
                            </button>
                            <button
                                ref={expandButton}
                                onClick={() => {
                                    setExpanded(!expanded)
                                    requestAnimationFrame(
                                        () => void flow.fitView({ padding: 0.15, maxZoom: 1 }),
                                    )
                                }}
                                aria-label={expanded ? 'Свернуть доску' : 'Развернуть доску'}
                                title={expanded ? 'Свернуть доску' : 'Развернуть доску'}
                            >
                                {expanded ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
                            </button>
                            <button
                                onClick={() => setResetOpen(true)}
                                title="Начать заново"
                                aria-label="Начать заново"
                            >
                                <RotateCcw size={17} />
                            </button>
                        </div>
                        <button className="sd-check" onClick={check}>
                            <Play size={16} />
                            {result ? 'Проверить ещё раз' : 'Проверить решение'}
                        </button>
                    </div>
                    <div ref={boardRef} className={`sd-board ${palette.target.over ? 'is-drop-zone' : ''}`}>
                        <ReactFlow<BoardNode>
                            nodes={nodes}
                            edges={edges}
                            nodeTypes={nodeTypes}
                            onNodesChange={onNodesChange}
                            onNodeDragStart={() => {
                                checkpoint()
                                setSelectedWireId(null)
                            }}
                            onNodeDrag={(event, node) =>
                                setInsertionEdge(nodeInsertionTarget(node.id, event))
                            }
                            onNodeDragStop={(event, node) => {
                                const edgeId = nodeInsertionTarget(node.id, event)
                                if (edgeId) {
                                    const block = designRef.current.blocks.find((n) => n.id === node.id)!,
                                        next = insertBlockOnWire(
                                            designRef.current,
                                            { ...block, x: node.position.x, y: node.position.y },
                                            edgeId,
                                        )
                                    if (next) {
                                        setDesign(next)
                                        invalidate()
                                        setNotice(
                                            'Блок встроен в связь. Предыдущий линейный маршрут восстановлен.',
                                        )
                                    }
                                }
                                setInsertionEdge(null)
                            }}
                            onNodeClick={(_, node) => {
                                setSelected(node.id)
                                setSelectedWireId(null)
                            }}
                            onEdgeClick={(_, edge) => selectEdge(edge.id)}
                            onPaneClick={(event) => {
                                const edgeId = edgeAtPoint(boardRef.current, event.clientX, event.clientY)
                                if (edgeId) selectEdge(edgeId)
                                else {
                                    setSelected(null)
                                    setSelectedWireId(null)
                                }
                            }}
                            onConnect={connect}
                            isValidConnection={canConnect}
                            onEdgesDelete={(deleted) =>
                                commit({
                                    ...designRef.current,
                                    wires: designRef.current.wires.filter(
                                        (w) => !deleted.some((e) => e.id === w.id),
                                    ),
                                })
                            }
                            deleteKeyCode={null}
                            edgesReconnectable={false}
                            colorMode={isDark ? 'dark' : 'light'}
                            fitView
                            fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
                            minZoom={0.2}
                            maxZoom={1.6}
                            connectionRadius={32}
                            connectOnClick
                            nodesFocusable
                            edgesFocusable
                            panOnScroll={false}
                            zoomOnScroll={false}
                            zoomOnDoubleClick={false}
                            preventScrolling={false}
                            ariaLabelConfig={{
                                'node.a11yDescription.default':
                                    'Выберите блок. Стрелки перемещают его. Для соединения используйте вкладку Связи.',
                                'controls.zoomIn.ariaLabel': 'Приблизить',
                                'controls.zoomOut.ariaLabel': 'Отдалить',
                                'controls.fitView.ariaLabel': 'Показать всю схему',
                                'controls.interactive.ariaLabel': 'Переключить перемещение',
                            }}
                        >
                            <Background gap={22} size={1} color="var(--sd-dot)" />
                            <Controls showInteractive={false} showFitView={false} />
                        </ReactFlow>
                        <button
                            className="sd-fit"
                            onClick={() => void flow.fitView({ padding: 0.2, maxZoom: 1 })}
                            aria-label="Показать всю схему"
                            title="Показать всю схему"
                        >
                            <Maximize2 size={18} />
                        </button>
                    </div>
                    <div className="sd-board-bottom">
                        <span>
                            {design.blocks.length} блоков · {design.wires.length} связей
                        </span>
                        <span>Перетащите блок · Соедините точки или откройте «Связи»</span>
                    </div>
                    {selectedWire && (
                        <div ref={edgeActionsRef} className="sd-edge-actions">
                            <div className="sd-edge-actions-title">
                                <strong>
                                    {label(selectedWire.source)} <ArrowRight size={14} />{' '}
                                    {label(selectedWire.target)}
                                </strong>
                                <button
                                    className="sd-icon-button"
                                    onClick={() => setSelectedWireId(null)}
                                    aria-label="Закрыть действия со связью"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            <p>Встроить блок в эту связь</p>
                            <div className="sd-insert-options">
                                {ex.allowed.map((kind) => (
                                    <button
                                        key={kind}
                                        onClick={(event) =>
                                            addPart(kind, undefined, selectedWireId, event.detail !== 0)
                                        }
                                    >
                                        <Plus size={14} />
                                        {PARTS[kind].label}
                                    </button>
                                ))}
                            </div>
                            <button className="sd-secondary" onClick={removeWire}>
                                <Trash2 size={15} />
                                Удалить связь
                            </button>
                        </div>
                    )}
                    {selectedBlock && (
                        <div className="sd-inspector" aria-live="polite">
                            <div>
                                <strong>{label(selectedBlock.id)}</strong>
                                <div className="sd-node-actions">
                                    {selectedBlock.kind !== 'storage' && (
                                        <button
                                            onClick={() => {
                                                setSource(selectedBlock.id)
                                                setTarget('')
                                                setPanel('wires')
                                                sideRef.current?.scrollIntoView({ block: 'nearest' })
                                            }}
                                        >
                                            <GitBranch size={14} />
                                            Соединить отсюда
                                        </button>
                                    )}
                                    {ex.allowed.includes(selectedBlock.kind) && (
                                        <button
                                            onClick={() =>
                                                addPart(
                                                    selectedBlock.kind,
                                                    { x: selectedBlock.x + 40, y: selectedBlock.y + 120 },
                                                    null,
                                                )
                                            }
                                        >
                                            <Copy size={14} />
                                            Дублировать
                                        </button>
                                    )}
                                </div>
                                <p>
                                    {PARTS[selectedBlock.kind].detail.replace(
                                        '1 000',
                                        capacity(ex, selectedBlock).toLocaleString('ru-RU'),
                                    )}
                                </p>
                            </div>
                            {!ex.initial.blocks.some((n) => n.id === selected) && (
                                <button
                                    className="sd-icon-button"
                                    aria-label={`Удалить ${label(selectedBlock.id)}`}
                                    onClick={removeSelected}
                                >
                                    <Trash2 size={17} />
                                </button>
                            )}
                            <button
                                className="sd-icon-button"
                                aria-label="Закрыть сведения о блоке"
                                onClick={() => setSelected(null)}
                            >
                                <X size={17} />
                            </button>
                        </div>
                    )}
                </section>
                <aside ref={sideRef} className="sd-side">
                    <div className="sd-tabs" role="tablist" aria-label="Панели тренировки">
                        {(Object.keys(panelLabels) as Panel[]).map((p) => (
                            <button
                                key={p}
                                role="tab"
                                id={`tab-${p}`}
                                aria-controls={`panel-${p}`}
                                aria-selected={panel === p}
                                tabIndex={panel === p ? 0 : -1}
                                onClick={() => setPanel(p)}
                                onKeyDown={(event) => {
                                    const tabs = Object.keys(panelLabels) as Panel[]
                                    const direction =
                                        event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
                                    if (direction) {
                                        event.preventDefault()
                                        const newTab =
                                            tabs[(tabs.indexOf(p) + direction + tabs.length) % tabs.length]
                                        setPanel(newTab)
                                        document.getElementById(`tab-${newTab}`)?.focus()
                                    }
                                }}
                            >
                                {panelLabels[p]}
                                {p === 'result' && result && (
                                    <span className={result.passed ? 'sd-tab-dot is-pass' : 'sd-tab-dot'} />
                                )}
                            </button>
                        ))}
                    </div>
                    <div
                        ref={panelRef}
                        className="sd-panel"
                        role="tabpanel"
                        id={`panel-${panel}`}
                        aria-labelledby={`tab-${panel}`}
                    >
                        {panel === 'task' && (
                            <>
                                <span className="sd-eyebrow">Ситуация</span>
                                <p className="sd-description">{ex.description}</p>
                                <div className="sd-incident">
                                    <AlertCircle size={18} />
                                    <p>{ex.incident}</p>
                                </div>
                                <h2>Что нужно исправить</h2>
                                <p>{ex.goal}</p>
                                <div className="sd-task-actions">
                                    <button className="sd-primary" onClick={() => setPanel('parts')}>
                                        <Plus size={17} />
                                        Добавить блок
                                    </button>
                                    <button
                                        className="sd-secondary"
                                        onClick={() => setHint(!hint)}
                                        aria-expanded={hint}
                                    >
                                        <Lightbulb size={17} />
                                        {hint ? 'Скрыть подсказку' : 'Подсказка'}
                                    </button>
                                </div>
                                {hint && <p className="sd-hint">{ex.hint}</p>}
                                <details className="sd-help">
                                    <summary>Как пользоваться доской</summary>
                                    <p>
                                        Нажмите на блок в библиотеке, чтобы добавить его. Перемещайте за
                                        середину. Соедините правую точку с левой точкой следующего блока. На
                                        телефоне можно коснуться точек по очереди или выбрать блоки во вкладке
                                        «Связи».
                                    </p>
                                    <p>
                                        ⌘/Ctrl+Z — отменить, Shift+⌘/Ctrl+Z — повторить. Delete — удалить
                                        выбранный блок или связь. Выберите добавленный блок, чтобы удалить
                                        его. Исходные блоки остаются; их связи можно менять. Масштаб —
                                        кнопками +/− или жестом двух пальцев.
                                    </p>
                                </details>
                            </>
                        )}
                        {panel === 'parts' && (
                            <>
                                <h2>Добавить компонент</h2>
                                <p className="sd-muted">
                                    Нажмите или перетащите блок на доску. Бросьте его на стрелку, чтобы
                                    встроить в связь.
                                </p>
                                <div className="sd-parts">
                                    {ex.allowed.map((kind) => {
                                        const Icon = icons[kind]
                                        return (
                                            <div
                                                className={`sd-part-card ${palette.activeKind === kind ? 'is-being-dragged' : ''}`}
                                                key={kind}
                                            >
                                                <button
                                                    className="sd-part-main"
                                                    {...palette.handlers(kind)}
                                                    onClick={(event) => {
                                                        if (!palette.consumeClick())
                                                            addPart(
                                                                kind,
                                                                undefined,
                                                                selectedWireId,
                                                                event.detail !== 0,
                                                            )
                                                    }}
                                                    aria-label={`Добавить: ${PARTS[kind].label}`}
                                                >
                                                    <span className="sd-node-icon">
                                                        <Icon size={20} />
                                                    </span>
                                                    <span>
                                                        <strong>{PARTS[kind].label}</strong>
                                                        <small>{PARTS[kind].detail}</small>
                                                    </span>
                                                    <Plus size={18} />
                                                </button>
                                                <button
                                                    className="sd-part-grip"
                                                    {...palette.handlers(kind, true)}
                                                    onClick={(event) => {
                                                        if (event.detail === 0 && !palette.consumeClick())
                                                            addPart(kind, undefined, selectedWireId, false)
                                                    }}
                                                    aria-label={`Перетащить: ${PARTS[kind].label}`}
                                                    title="Перетащить на доску"
                                                >
                                                    <GripVertical size={18} />
                                                </button>
                                            </div>
                                        )
                                    })}
                                </div>
                                <button className="sd-secondary sd-wide" onClick={() => setPanel('wires')}>
                                    <GitBranch size={17} />
                                    Настроить связи
                                </button>
                                <h3>На доске</h3>
                                <div className="sd-block-list">
                                    {design.blocks.map((n) => (
                                        <button
                                            key={n.id}
                                            aria-pressed={selected === n.id}
                                            onClick={() => {
                                                setSelected(n.id)
                                                setSelectedWireId(null)
                                                void flow.setCenter(n.x + 102, n.y + 38, {
                                                    zoom: 1,
                                                    duration: 0,
                                                })
                                            }}
                                        >
                                            <span>{label(n.id)}</span>
                                            <small>
                                                {result?.loads[n.id] !== undefined
                                                    ? `${Math.round(result.loads[n.id])} RPS`
                                                    : ['api', 'database', 'worker', 'storage'].includes(
                                                            n.kind,
                                                        )
                                                      ? `${capacity(ex, n).toLocaleString('ru-RU')} RPS`
                                                      : PARTS[n.kind].short}
                                            </small>
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                        {panel === 'wires' && (
                            <>
                                <h2>Направление запросов</h2>
                                <p className="sd-muted">
                                    Связь всегда односторонняя. Удалите старый маршрут, если он обходит новый
                                    блок.
                                </p>
                                <div className="sd-wire-form">
                                    <label htmlFor="sd-source">Откуда</label>
                                    <BoardSelect
                                        id="sd-source"
                                        label="Откуда"
                                        value={source}
                                        onChange={(value) => {
                                            setSource(value)
                                            setTarget('')
                                        }}
                                        options={design.blocks
                                            .filter((n) => n.kind !== 'storage')
                                            .map((n) => ({ value: n.id, label: label(n.id) }))}
                                    />
                                    <label htmlFor="sd-target">Куда</label>
                                    <BoardSelect
                                        id="sd-target"
                                        label="Куда"
                                        value={target}
                                        onChange={setTarget}
                                        options={design.blocks
                                            .filter((n) => n.kind !== 'client')
                                            .map((n) => ({
                                                value: n.id,
                                                label: label(n.id),
                                                disabled: !!source && !canConnect({ source, target: n.id }),
                                                hint: !source
                                                    ? undefined
                                                    : source === n.id
                                                      ? 'Тот же блок'
                                                      : design.wires.some(
                                                              (w) => w.source === source && w.target === n.id,
                                                          )
                                                        ? 'Уже соединено'
                                                        : wouldCycle(design, source, n.id)
                                                          ? 'Создаст цикл'
                                                          : undefined,
                                            }))}
                                    />
                                    <button
                                        className="sd-primary"
                                        disabled={!source || !target}
                                        onClick={() => connect({ source, target })}
                                    >
                                        <Plus size={16} />
                                        Соединить
                                    </button>
                                </div>
                                <h3>Связи ({design.wires.length})</h3>
                                <div className="sd-wires">
                                    {design.wires.map((w) => (
                                        <div key={w.id}>
                                            <span>
                                                {label(w.source)} <ArrowRight size={13} /> {label(w.target)}
                                            </span>
                                            <button
                                                className="sd-icon-button"
                                                aria-label={`Удалить связь ${label(w.source)} → ${label(w.target)}`}
                                                onClick={() =>
                                                    commit({
                                                        ...design,
                                                        wires: design.wires.filter((e) => e.id !== w.id),
                                                    })
                                                }
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                        {panel === 'result' &&
                            (!result ? (
                                <div className="sd-empty">
                                    <Play size={26} />
                                    <h2>Проверьте архитектуру</h2>
                                    <p>
                                        Отправим заданный поток по вашей схеме и покажем, что выдержало
                                        нагрузку.
                                    </p>
                                    <button className="sd-primary" onClick={check}>
                                        Запустить проверку
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className={`sd-result-heading ${result.passed ? 'is-pass' : ''}`}>
                                        {result.passed ? <CheckCircle2 size={27} /> : <XCircle size={27} />}
                                        <div>
                                            <h2>
                                                {result.passed
                                                    ? 'Архитектура выдержала'
                                                    : 'Нужно доработать схему'}
                                            </h2>
                                            <p>
                                                {result.checks.filter((c) => c.ok).length} из{' '}
                                                {result.checks.length} проверок пройдено
                                            </p>
                                        </div>
                                    </div>
                                    <div className="sd-checks">
                                        {result.checks.map((c) => (
                                            <div key={c.label} className={c.ok ? 'is-pass' : 'is-fail'}>
                                                {c.ok ? <Check size={17} /> : <X size={17} />}
                                                <div>
                                                    <strong>{c.label}</strong>
                                                    <p>{c.detail}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <details className="sd-trace">
                                        <summary>Маршрут и расчёт нагрузки</summary>
                                        <p>
                                            {ex.scenario ? (
                                                <>
                                                    Сценарий: {ex.scenario.event} Нагрузка считается по всем
                                                    входящим веткам; блоки защиты не уменьшают поток записей.
                                                    Лимитер явно отклоняет избыток, single-flight объединяет
                                                    только чтения одного ключа.
                                                </>
                                            ) : (
                                                <>
                                                    Вход: {ex.demand.toLocaleString('ru-RU')} RPS.
                                                    Балансировщик и шард-роутер делят поток поровну; обычная
                                                    развилка дублирует его. В задаче каталога кеш пропускает
                                                    10% чтений, в задаче статики CDN — 5%. Для записей кеш
                                                    поток не уменьшает. Очередь отдаёт задания воркеру со
                                                    скоростью до 200/с; допустимый срок — 20 секунд.
                                                </>
                                            )}
                                        </p>
                                        <ol>
                                            {result.trace.map((line, i) => (
                                                <li key={i}>{line}</li>
                                            ))}
                                        </ol>
                                        <p>
                                            Модельная задержка{' '}
                                            {ex.id === 'jobs' ? 'приёма задания' : 'самого медленного пути'}:{' '}
                                            {result.latency} мс.
                                            {result.drain !== undefined &&
                                                ` Обработка всей очереди: ${result.drain} с.`}{' '}
                                            При перегрузке реальные задержки не оцениваются.
                                        </p>
                                    </details>
                                    {result.passed && (
                                        <div className="sd-tradeoff">
                                            <h3>Что обсудить на собеседовании</h3>
                                            <p>{ex.tradeoff}</p>
                                            {next ? (
                                                <Link className="sd-primary" to={`/system-design/${next.id}`}>
                                                    Следующая задача
                                                    <ArrowRight size={16} />
                                                </Link>
                                            ) : (
                                                <Link className="sd-primary" to="/system-design">
                                                    Ко всем траекториям
                                                    <Check size={16} />
                                                </Link>
                                            )}
                                        </div>
                                    )}
                                </>
                            ))}
                    </div>
                </aside>
            </div>
            <div className="sd-notice" role="status" aria-live="polite">
                {notice}
            </div>
            {palette.ghost}
            {resetOpen && (
                <ResetDialog
                    onClose={() => setResetOpen(false)}
                    onReset={() => {
                        commit(cloneDesign(ex.initial))
                        setSelected(null)
                        setResetOpen(false)
                        requestAnimationFrame(() => void flow.fitView({ padding: 0.2, maxZoom: 1 }))
                    }}
                />
            )}
        </div>
    )
}

function ResetDialog({ onClose, onReset }: { onClose: () => void; onReset: () => void }) {
    const dialog = useModalDialog()
    return (
        <dialog
            ref={dialog}
            className="sd-modal"
            aria-labelledby="sd-reset-title"
            onCancel={(event) => {
                event.preventDefault()
                onClose()
            }}
            onClick={(event) => {
                if (event.target === event.currentTarget) onClose()
            }}
        >
            <h2 id="sd-reset-title">Начать задачу заново?</h2>
            <p>Вернём исходную схему. Это действие можно отменить кнопкой «Отменить».</p>
            <div>
                <button className="sd-secondary" onClick={onClose}>
                    Продолжить решение
                </button>
                <button className="sd-primary" onClick={onReset}>
                    Начать заново
                </button>
            </div>
        </dialog>
    )
}
