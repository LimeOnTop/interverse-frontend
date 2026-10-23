/** Educational, deterministic load model. Values describe these exercises, not vendor benchmarks. */
export type BlockKind =
    | 'client'
    | 'api'
    | 'database'
    | 'balancer'
    | 'cache'
    | 'queue'
    | 'worker'
    | 'cdn'
    | 'storage'
    | 'shard'
export interface Block {
    id: string
    kind: BlockKind
    x: number
    y: number
}
export interface Wire {
    id: string
    source: string
    target: string
}
export interface Design {
    blocks: Block[]
    wires: Wire[]
}
export interface Exercise {
    id: string
    title: string
    topic: string
    description: string
    incident: string
    demand: number
    goal: string
    hint: string
    tradeoff: string
    allowed: BlockKind[]
    initial: Design
    sink: string
}
export const PARTS: Record<
    BlockKind,
    { label: string; detail: string; capacity: number; latency: number; short: string }
> = {
    client: {
        label: 'Клиенты',
        detail: 'Источник запросов. Нагрузка задана условием.',
        capacity: Infinity,
        latency: 0,
        short: 'HTTP',
    },
    api: {
        label: 'API-сервер',
        detail: 'Обрабатывает до 1 000 запросов/с. Несколько серверов помогают только с распределением трафика.',
        capacity: 1000,
        latency: 30,
        short: '1 000 RPS',
    },
    database: {
        label: 'База данных',
        detail: 'До 1 000 запросов/с. Второй шард хранит другую часть ключей.',
        capacity: 1000,
        latency: 40,
        short: '1 000 RPS',
    },
    balancer: {
        label: 'Балансировщик',
        detail: 'Round-robin: делит запросы поровну между API-серверами.',
        capacity: 20000,
        latency: 5,
        short: 'Round-robin',
    },
    cache: {
        label: 'Кеш',
        detail: 'В этой задаче 90% чтений — попадания. Только 10% идут дальше в БД; промахи тоже проверяются.',
        capacity: 10000,
        latency: 2,
        short: '90% hit rate',
    },
    queue: {
        label: 'Очередь',
        detail: 'Быстро подтверждает приём. Сохраняет весь двухсекундный всплеск и передаёт задания воркеру в его темпе без потерь.',
        capacity: 10000,
        latency: 5,
        short: 'Буфер 10 000',
    },
    worker: {
        label: 'Воркер',
        detail: 'Обрабатывает 200 заданий/с. После очереди работает асинхронно.',
        capacity: 200,
        latency: 300,
        short: '200 задач/с',
    },
    cdn: {
        label: 'CDN',
        detail: '95% статики отдаются с edge. 5% промахов проходят к origin.',
        capacity: 20000,
        latency: 10,
        short: '95% hit rate',
    },
    storage: {
        label: 'Хранилище',
        detail: 'Origin для файлов: до 1 000 запросов/с.',
        capacity: 1000,
        latency: 80,
        short: '1 000 RPS',
    },
    shard: {
        label: 'Шард-роутер',
        detail: 'Распределяет ключи поровну по разным БД. Один ключ всегда попадает в один шард.',
        capacity: 20000,
        latency: 5,
        short: 'Hash(key)',
    },
}
const b = (id: string, kind: BlockKind, x: number, y: number): Block => ({ id, kind, x, y })
const wires = (...pairs: [string, string][]): Wire[] =>
    pairs.map(([source, target]) => ({ id: `${source}-${target}`, source, target }))
const standard = (sink: BlockKind = 'database'): Design => ({
    blocks: [b('client', 'client', 30, 140), b('api', 'api', 310, 140), b('sink', sink, 870, 140)],
    wires: wires(['client', 'api'], ['api', 'sink']),
})
export const EXERCISES: Exercise[] = [
    {
        id: 'traffic',
        title: 'Сервис не выдержал запуск',
        topic: 'Горизонтальное масштабирование',
        description:
            'После запуска продукта пришло 1 600 запросов/с. Один API справляется только с 1 000. БД пока достаточно: в этом упражнении её лимит 5 000 запросов/с.',
        incident: 'API перегружен, часть запросов теряется.',
        demand: 1600,
        goal: 'Распределите трафик между минимум двумя API. Каждый запрос должен доходить до БД.',
        hint: 'Поставьте балансировщик перед API. Уберите старую прямую связь клиентов с API и подключите ещё один сервер к общей БД.',
        tradeoff:
            'Реплики API снимают нагрузку с приложения, но не масштабируют общую БД. В реальной системе ещё нужны health checks и отсутствие локального состояния.',
        allowed: ['balancer', 'api', 'cache'],
        initial: standard(),
        sink: 'sink',
    },
    {
        id: 'catalog',
        title: 'Каталог тормозит',
        topic: 'Кеширование чтений',
        description:
            'Каталог получает 800 чтений/с. БД держит 100 чтений/с в этой задаче. Запросы часто повторяются; допустима задержка обновления данных до минуты.',
        incident: 'База перегружена повторяющимися чтениями.',
        demand: 800,
        goal: 'Доведите нагрузку на БД до 100 запросов/с или ниже. Промахи кеша должны доходить до БД.',
        hint: 'Кеш поставьте между API и БД. Удалите прямую связь API → БД, иначе база продолжит получать все запросы.',
        tradeoff:
            '90% попаданий оставляют 80 чтений/с для БД. Холодный кеш и инвалидация требуют отдельного плана; эти условия не входят в нагрузочный сценарий.',
        allowed: ['cache', 'api', 'balancer'],
        initial: standard(),
        sink: 'sink',
    },
    {
        id: 'jobs',
        title: 'Письма блокируют API',
        topic: 'Асинхронная обработка',
        description:
            'За 2 секунды приходит 2 400 запросов на отправку письма. API принимает до 5 000 запросов/с, воркер отправляет 200 писем/с. Можно принять задания сразу и завершить отправку в течение 20 секунд.',
        incident: 'Синхронный путь перегружает воркер.',
        demand: 1200,
        goal: 'Сохраните все 2 400 заданий, отделите отправку от ответа API и уложитесь в 20 секунд.',
        hint: 'Добавьте очередь перед воркером и уберите синхронный обход. Очередь должна вести к воркеру, а воркер — к журналу отправки.',
        tradeoff:
            'Очередь сглаживает всплеск: 2 400 / 200 = 12 секунд обработки. В production нужны повторные доставки, идемпотентность и обработка неисправимых заданий.',
        allowed: ['queue', 'cache', 'balancer'],
        initial: {
            blocks: [
                b('client', 'client', 30, 140),
                b('api', 'api', 250, 140),
                b('worker', 'worker', 650, 140),
                b('sink', 'database', 900, 140),
            ],
            wires: wires(['client', 'api'], ['api', 'worker'], ['worker', 'sink']),
        },
        sink: 'sink',
    },
    {
        id: 'media',
        title: 'Изображения перегружают origin',
        topic: 'Доставка статики',
        description:
            '6 000 запросов/с приходят за одинаковыми публичными изображениями. Origin выдерживает 1 000. Для этой задачи edge-кеш прогрет и даёт 95% попаданий.',
        incident: 'API и файловое хранилище не выдерживают трафик.',
        demand: 6000,
        goal: 'Отдавайте статику с edge, оставив origin не больше 1 000 запросов/с. Промахи должны доходить до файлов.',
        hint: 'Поставьте CDN перед API. Удалите прямой путь клиентов к origin. Соедините CDN с API для промахов.',
        tradeoff:
            'На origin останется 300 запросов/с. CDN подходит публичной статике; приватные файлы требуют правил доступа, а обновления — версионирования или инвалидации.',
        allowed: ['cdn', 'cache', 'api'],
        initial: standard('storage'),
        sink: 'sink',
    },
    {
        id: 'shards',
        title: 'Записи упёрлись в одну БД',
        topic: 'Шардирование',
        description:
            '1 600 записей/с равномерно распределены по ключам пользователей. БД держит 1 000 записей/с. API в этой задаче рассчитан на 5 000. Кеш не уменьшает поток записей.',
        incident: 'Единственная база не успевает сохранять записи.',
        demand: 1600,
        goal: 'Разделите пространство ключей минимум между двумя БД. Все записи должны сохраняться.',
        hint: 'Подключите шард-роутер после API и две базы после него. Удалите прямой путь API → БД.',
        tradeoff:
            'Каждому из двух шардов достанется 800 записей/с. Цена решения — ребалансировка ключей и сложные запросы между шардами. Это не репликация.',
        allowed: ['shard', 'database', 'cache'],
        initial: standard(),
        sink: 'sink',
    },
]
export function cloneDesign(design: Design): Design {
    return JSON.parse(JSON.stringify(design))
}
export function capacity(ex: Exercise, block: Block): number {
    if (ex.id === 'traffic' && block.kind === 'database') return 5000
    if (ex.id === 'catalog' && block.kind === 'database') return 100
    if ((ex.id === 'shards' || ex.id === 'jobs') && block.kind === 'api') return 5000
    return PARTS[block.kind].capacity
}
export function wouldCycle(design: Design, source: string, target: string): boolean {
    const seen = new Set<string>()
    const visit = (id: string): boolean => {
        if (id === source) return true
        if (seen.has(id)) return false
        seen.add(id)
        return design.wires.some((w) => w.source === id && visit(w.target))
    }
    return visit(target)
}
export interface Check {
    label: string
    ok: boolean
    detail: string
}
export interface Evaluation {
    passed: boolean
    checks: Check[]
    loads: Record<string, number>
    overloaded: string[]
    trace: string[]
    latency: number
    drain?: number
}
export function evaluate(ex: Exercise, design: Design): Evaluation {
    const map = new Map(design.blocks.map((n) => [n.id, n]))
    const out = (id: string) =>
        design.wires
            .filter((e) => e.source === id)
            .map((e) => map.get(e.target)!)
            .filter(Boolean)
    const checks: Check[] = []
    const add = (label: string, ok: boolean, detail: string) => checks.push({ label, ok, detail })
    const intact = ex.initial.blocks.every((n) => map.get(n.id)?.kind === n.kind)
    const validEdges =
        design.wires.every((w) => map.has(w.source) && map.has(w.target) && w.source !== w.target) &&
        new Set(design.wires.map((w) => `${w.source}>${w.target}`)).size === design.wires.length
    const acyclic =
        validEdges &&
        design.wires.every(
            (w) =>
                !wouldCycle(
                    { ...design, wires: design.wires.filter((e) => e.id !== w.id) },
                    w.source,
                    w.target,
                ),
        )
    add(
        'Целостность схемы',
        intact && acyclic,
        'Обязательные компоненты сохранены; нет циклов, дубликатов и оборванных связей.',
    )
    const reachable = new Set<string>()
    const visit = (id: string) => {
        if (reachable.has(id)) return
        reachable.add(id)
        out(id).forEach((n) => visit(n.id))
    }
    visit('client')
    const terminals = [...reachable].filter((id) => out(id).length === 0)
    const sinkKinds =
        ex.id === 'shards' ? design.blocks.filter((n) => n.kind === 'database').map((n) => n.id) : [ex.sink]
    const reachesEnd =
        terminals.length > 0 && terminals.every((id) => sinkKinds.includes(id)) && reachable.has(ex.sink)
    const safeFanout = [...reachable].every((id) => {
        const kind = map.get(id)?.kind
        return out(id).length <= 1 || kind === 'balancer' || kind === 'shard'
    })
    add(
        'Маршруты без потерь и дублей',
        reachesEnd && safeFanout,
        'Каждая ветка ведёт к хранилищу. Делить поток могут балансировщик и шард-роутер; обычная развилка дублирует запросы.',
    )
    const active = design.blocks.filter((n) => reachable.has(n.id))
    const byKind = (kind: BlockKind) => active.filter((n) => n.kind === kind)
    let architecture = false
    if (ex.id === 'traffic')
        architecture =
            out('client').length === 1 &&
            out('client')[0].kind === 'balancer' &&
            byKind('balancer').some(
                (n) =>
                    out(n.id).filter((n) => n.kind === 'api').length >= 2 &&
                    out(n.id).every((n) => n.kind === 'api'),
            )
    if (ex.id === 'catalog')
        architecture =
            out('api').length === 1 &&
            out('api')[0].kind === 'cache' &&
            out(out('api')[0].id).some((n) => n.id === ex.sink)
    if (ex.id === 'jobs')
        architecture =
            out('api').length === 1 &&
            out('api')[0].kind === 'queue' &&
            out(out('api')[0].id).length === 1 &&
            out(out('api')[0].id)[0].id === 'worker'
    if (ex.id === 'media')
        architecture =
            out('client').length === 1 &&
            out('client')[0].kind === 'cdn' &&
            out(out('client')[0].id).some((n) => n.id === 'api')
    if (ex.id === 'shards')
        architecture =
            out('api').length === 1 &&
            out('api')[0].kind === 'shard' &&
            out(out('api')[0].id).filter((n) => n.kind === 'database').length >= 2 &&
            out(out('api')[0].id).every((n) => n.kind === 'database') &&
            byKind('cache').length === 0
    add('Исправлена причина сбоя', architecture, ex.goal)
    // A topological pass accumulates every incoming branch before calculating outgoing load.
    const loads: Record<string, number> = { client: ex.demand }
    const latency: Record<string, number> = { client: 0 }
    const indegrees = Object.fromEntries(
        active.map((n) => [
            n.id,
            design.wires.filter((w) => w.target === n.id && reachable.has(w.source)).length,
        ]),
    )
    const queue = active.filter((n) => indegrees[n.id] === 0)
    const ordered: Block[] = []
    if (acyclic)
        while (queue.length) {
            const node = queue.shift()!
            ordered.push(node)
            const children = out(node.id)
            const rate = loads[node.id] || 0
            let factor =
                node.kind === 'cache' && ex.id === 'catalog'
                    ? 0.1
                    : node.kind === 'cdn' && ex.id === 'media'
                      ? 0.05
                      : node.kind === 'queue'
                        ? rate > 0
                            ? Math.min(1, PARTS.worker.capacity / rate)
                            : 0
                        : 1
            if (node.kind === 'balancer' || node.kind === 'shard') factor /= Math.max(1, children.length)
            for (const child of children) {
                loads[child.id] = (loads[child.id] || 0) + rate * factor
                latency[child.id] = Math.max(
                    latency[child.id] || 0,
                    node.kind === 'queue' ? 0 : (latency[node.id] || 0) + PARTS[node.kind].latency,
                )
                if (--indegrees[child.id] === 0) queue.push(child)
            }
        }
    const overloaded = active.filter((n) => (loads[n.id] || 0) > capacity(ex, n)).map((n) => n.id)
    const drain =
        ex.id === 'jobs' && byKind('queue').length ? (ex.demand * 2) / PARTS.worker.capacity : undefined
    const withinCapacity = acyclic && overloaded.length === 0 && (drain === undefined || drain <= 20)
    add(
        'Нагрузка в пределах лимитов',
        withinCapacity,
        drain !== undefined
            ? `Всплеск: ${ex.demand * 2} заданий. Обработка: ${drain} с из допустимых 20 с.`
            : overloaded.length
              ? overloaded
                    .map(
                        (id) =>
                            `${PARTS[map.get(id)!.kind].label}: ${Math.round(loads[id])} > ${capacity(ex, map.get(id)!)}`,
                    )
                    .join('; ')
              : 'Все достижимые компоненты выдерживают заданный поток.',
    )
    add(
        'Нет неиспользуемых блоков',
        active.length === design.blocks.length,
        'Каждый добавленный блок должен участвовать в пути запроса.',
    )
    const trace = (acyclic ? ordered : active).map((n) => {
        const peers = active.filter((b) => b.kind === n.kind)
        const suffix = peers.length > 1 ? ` ${peers.findIndex((b) => b.id === n.id) + 1}` : ''
        return `${PARTS[n.kind].label}${suffix}: ${Math.round(loads[n.id] || 0).toLocaleString('ru-RU')} запросов/с${overloaded.includes(n.id) ? ' — перегрузка' : ''}`
    })
    return {
        passed: checks.every((c) => c.ok),
        checks,
        loads,
        overloaded,
        trace,
        latency:
            ex.id === 'jobs' && byKind('queue').length
                ? PARTS.api.latency + PARTS.queue.latency
                : Math.max(0, ...active.map((n) => (latency[n.id] || 0) + PARTS[n.kind].latency)),
        drain,
    }
}
export function restoreDesign(value: unknown, ex: Exercise): Design | null {
    if (!value || typeof value !== 'object') return null
    const d = value as Design
    if (!Array.isArray(d.blocks) || !Array.isArray(d.wires) || d.blocks.length > 30 || d.wires.length > 80)
        return null
    if (
        !d.blocks.every(
            (n) =>
                n &&
                typeof n.id === 'string' &&
                n.id.length < 100 &&
                Object.prototype.hasOwnProperty.call(PARTS, n.kind) &&
                Number.isFinite(n.x) &&
                Number.isFinite(n.y) &&
                Math.abs(n.x) < 10000 &&
                Math.abs(n.y) < 10000,
        )
    )
        return null
    if (new Set(d.blocks.map((n) => n.id)).size !== d.blocks.length) return null
    if (!ex.initial.blocks.every((n) => d.blocks.some((b) => b.id === n.id && b.kind === n.kind))) return null
    if (d.blocks.some((n) => !ex.initial.blocks.some((b) => b.id === n.id) && !ex.allowed.includes(n.kind)))
        return null
    if (new Set(d.wires.map((w) => w?.id)).size !== d.wires.length) return null
    if (
        !d.wires.every(
            (w) =>
                w &&
                typeof w.id === 'string' &&
                typeof w.source === 'string' &&
                typeof w.target === 'string' &&
                d.blocks.some((n) => n.id === w.source) &&
                d.blocks.some((n) => n.id === w.target),
        )
    )
        return null
    return cloneDesign(d)
}
/** Lay out a DAG without changing its topology or scoring. Unconnected blocks go in their own column. */
export function arrange(design: Design): Design {
    const depth = new Map<string, number>([['client', 0]])
    for (let pass = 0; pass < design.blocks.length; pass++)
        for (const wire of design.wires) {
            const sourceDepth = depth.get(wire.source)
            if (sourceDepth !== undefined)
                depth.set(
                    wire.target,
                    Math.min(design.blocks.length, Math.max(depth.get(wire.target) || 0, sourceDepth + 1)),
                )
        }
    const last = Math.max(0, ...depth.values()) + 1
    const columns = new Map<number, string[]>()
    for (const node of design.blocks) {
        const col = depth.get(node.id) ?? last
        columns.set(col, [...(columns.get(col) || []), node.id])
    }
    return {
        ...cloneDesign(design),
        blocks: design.blocks.map((n) => {
            const col = depth.get(n.id) ?? last
            const ids = columns.get(col)!
            return { ...n, x: 30 + col * 265, y: 210 + (ids.indexOf(n.id) - (ids.length - 1) / 2) * 145 }
        }),
    }
}
