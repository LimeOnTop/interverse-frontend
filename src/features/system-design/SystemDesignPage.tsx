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
import { useModalDialog } from '../../hooks/useModalDialog'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuthStore } from '../../store/authStore'
import {
    EXERCISES,
    PARTS,
    arrange,
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
            {data.overloaded && <AlertCircle size={16} aria-label="Перегрузка" />}
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
    const owner = useAuthStore((s) => s.user?.id || 'local')
    const ex = EXERCISES.find((e) => e.id === id)
    const completed = EXERCISES.filter((e) => evaluate(e, load(String(owner), e)).passed).length
    if (id && !ex)
        return (
            <div className="sd-page">
                <h1>Задача не найдена</h1>
                <Link to="/system-design">К задачам System Design</Link>
            </div>
        )
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
                <p>Найдите узкое место. Измените схему. Проверьте, выдержит ли она нагрузку.</p>
                <div className="sd-intro-meta">
                    <span>
                        <Network size={16} />5 задач с готовой архитектурой
                    </span>
                    <span>
                        <CheckCircle2 size={16} />
                        {completed} из 5 решено
                    </span>
                </div>
            </div>
            <div className="sd-exercises">
                {EXERCISES.map((task, i) => {
                    const solved = evaluate(task, load(String(owner), task)).passed
                    return (
                        <Link className="sd-exercise" to={`/system-design/${task.id}`} key={task.id}>
                            <span className={`sd-exercise-number ${solved ? 'is-complete' : ''}`}>
                                {solved ? <Check size={22} /> : String(i + 1).padStart(2, '0')}
                            </span>
                            <div>
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
            if (event.key === 'Escape' && !resetOpen) {
                setExpanded(false)
                expandButton.current?.focus()
            }
        }
        document.addEventListener('keydown', close)
        return () => document.removeEventListener('keydown', close)
    }, [expanded, resetOpen])
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
    const addPart = (kind: BlockKind) => {
        if (design.blocks.length >= 15) {
            setNotice('На доске уже 15 блоков. Удалите лишний блок.')
            return
        }
        const point = flow.screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
        // Place additions on a free row, rather than hiding them under existing blocks.
        const pos = {
            x: Math.max(50, Math.min(900, point.x)),
            y: Math.max(280, ...design.blocks.map((n) => n.y + 100)),
        }
        const id = `${kind}-${crypto.randomUUID()}`
        commit({ ...design, blocks: [...design.blocks, { id, kind, ...pos }] })
        setSelected(id)
        setNotice(`Добавлен: ${PARTS[kind].label}. Соедините его с другими блоками.`)
        requestAnimationFrame(() => {
            void flow.fitView({ padding: 0.2, duration: reducedMotion ? 0 : 180, maxZoom: 1 })
        })
    }
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
            if (selection?.type === 'select') setSelected(selection.id)

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
                ariaLabel: `${label(w.source)} → ${label(w.target)}`,
            })),
        [design.wires, label, result, running],
    )
    useEffect(() => {
        if (source && !design.blocks.some((node) => node.id === source)) setSource('')
        if (target && !design.blocks.some((node) => node.id === target)) setTarget('')
    }, [design.blocks, source, target])
    const selectedBlock = design.blocks.find((n) => n.id === selected)
    const removeSelected = () => {
        if (!selected || ex.initial.blocks.some((n) => n.id === selected)) return
        commit({
            blocks: design.blocks.filter((n) => n.id !== selected),
            wires: design.wires.filter((w) => w.source !== selected && w.target !== selected),
        })
        setSelected(null)
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
                    Задача {number + 1} / 5 · {ex.topic}
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
                    <div className="sd-board">
                        <ReactFlow<BoardNode>
                            nodes={nodes}
                            edges={edges}
                            nodeTypes={nodeTypes}
                            onNodesChange={onNodesChange}
                            onNodeDragStart={checkpoint}
                            onNodeClick={(_, node) => setSelected(node.id)}
                            onPaneClick={() => setSelected(null)}
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
                    {selectedBlock && (
                        <div className="sd-inspector" aria-live="polite">
                            <div>
                                <strong>{label(selectedBlock.id)}</strong>
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
                                        Выберите добавленный блок, чтобы удалить его. Исходные блоки остаются;
                                        их связи можно менять. Масштаб — кнопками +/− или жестом двух пальцев.
                                    </p>
                                </details>
                                <p className="sd-footnote">
                                    Числа — условия учебной модели, а не замеры реальной инфраструктуры.
                                </p>
                            </>
                        )}
                        {panel === 'parts' && (
                            <>
                                <h2>Добавить компонент</h2>
                                <p className="sd-muted">
                                    Нажмите на блок. Он появится на доске; затем добавьте связи.
                                </p>
                                <div className="sd-parts">
                                    {ex.allowed.map((kind) => {
                                        const Icon = icons[kind]
                                        return (
                                            <button
                                                key={kind}
                                                onClick={() => addPart(kind)}
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
                                    <select
                                        id="sd-source"
                                        value={source}
                                        onChange={(e) => setSource(e.target.value)}
                                    >
                                        <option value="">Выберите блок</option>
                                        {design.blocks
                                            .filter((n) => n.kind !== 'storage')
                                            .map((n) => (
                                                <option key={n.id} value={n.id}>
                                                    {label(n.id)}
                                                </option>
                                            ))}
                                    </select>
                                    <label htmlFor="sd-target">Куда</label>
                                    <select
                                        id="sd-target"
                                        value={target}
                                        onChange={(e) => setTarget(e.target.value)}
                                    >
                                        <option value="">Выберите блок</option>
                                        {design.blocks
                                            .filter((n) => n.kind !== 'client')
                                            .map((n) => (
                                                <option key={n.id} value={n.id}>
                                                    {label(n.id)}
                                                </option>
                                            ))}
                                    </select>
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
                                        {result.passed ? (
                                            <CheckCircle2 size={27} />
                                        ) : (
                                            <AlertCircle size={27} />
                                        )}
                                        <div>
                                            <h2>
                                                {result.passed ? 'Архитектура выдержала' : 'Есть узкие места'}
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
                                                {c.ok ? <Check size={17} /> : <AlertCircle size={17} />}
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
                                            Вход: {ex.demand.toLocaleString('ru-RU')} RPS. Балансировщик и
                                            шард-роутер делят поток поровну; обычная развилка дублирует его. В
                                            задаче каталога кеш пропускает 10% чтений, в задаче статики CDN —
                                            5%. Для записей кеш поток не уменьшает. Очередь отдаёт задания
                                            воркеру со скоростью до 200/с; допустимый срок — 20 секунд.
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
                                                    Все задачи решены
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
