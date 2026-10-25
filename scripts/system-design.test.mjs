import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
const source = readFileSync(new URL('../src/features/system-design/model.ts', import.meta.url), 'utf8')
const js = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText
const {
    EXERCISES,
    ADDABLE_BLOCKS,
    evaluate,
    cloneDesign,
    restoreDesign,
    wouldCycle,
    arrange,
    insertBlockOnWire,
    removeDesignBlock,
} = await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'))
const block = (id, kind) => ({ id, kind, x: 300, y: 300 })
const connect = (d, ...pairs) =>
    (d.wires = pairs.map(([source, target], i) => ({ id: 'w' + i, source, target })))
function solution(ex) {
    const d = cloneDesign(ex.initial)
    if (ex.id === 'traffic') {
        d.blocks.push(block('lb', 'balancer'), block('api2', 'api'))
        connect(d, ['client', 'lb'], ['lb', 'api'], ['lb', 'api2'], ['api', 'sink'], ['api2', 'sink'])
    }
    if (ex.id === 'catalog') {
        d.blocks.push(block('cache', 'cache'))
        connect(d, ['client', 'api'], ['api', 'cache'], ['cache', 'sink'])
    }
    if (ex.id === 'jobs') {
        d.blocks.push(block('queue', 'queue'))
        connect(d, ['client', 'api'], ['api', 'queue'], ['queue', 'worker'], ['worker', 'sink'])
    }
    if (ex.id === 'media') {
        d.blocks.push(block('cdn', 'cdn'))
        connect(d, ['client', 'cdn'], ['cdn', 'api'], ['api', 'sink'])
    }
    if (ex.id === 'shards') {
        d.blocks.push(block('router', 'shard'), block('db2', 'database'))
        connect(d, ['client', 'api'], ['api', 'router'], ['router', 'sink'], ['router', 'db2'])
    }
    if (ex.scenario) {
        const nodes = ['client']
        ex.scenario.route.forEach((kind, i) => {
            const id = d.blocks.find((n) => n.kind === kind)?.id || `part${i}`
            if (!d.blocks.some((n) => n.id === id)) d.blocks.push(block(id, kind))
            nodes.push(id)
        })
        connect(d, ...nodes.slice(1).map((id, i) => [nodes[i], id]))
    }
    return d
}
for (const ex of EXERCISES) {
    test(`${ex.id}: original architecture fails`, () => assert.equal(evaluate(ex, ex.initial).passed, false))
    test(`${ex.id}: complete repair passes`, () => {
        const r = evaluate(ex, solution(ex))
        assert.equal(r.passed, true, JSON.stringify(r.checks))
        assert.equal(r.overloaded.length, 0)
    })
    test(`${ex.id}: disconnected required solution does not pass`, () => {
        const d = solution(ex)
        d.wires = d.wires.filter((w) => w.source !== 'client')
        assert.equal(evaluate(ex, d).passed, false)
    })
    test(`${ex.id}: a dangling branch does not pass`, () => {
        const d = solution(ex)
        d.blocks.push(block('unused', 'api'))
        d.wires.push({ id: 'bad', source: 'client', target: 'unused' })
        assert.equal(evaluate(ex, d).passed, false)
    })
    test(`${ex.id}: cached design round-trips`, () => {
        const d = solution(ex)
        assert.deepEqual(restoreDesign(JSON.parse(JSON.stringify(d)), ex), d)
    })
}
test('load combines both API branches before hitting database', () => {
    const ex = EXERCISES[0]
    const r = evaluate(ex, solution(ex))
    assert.equal(r.loads.sink, 1600)
    assert.equal(r.loads.api, 800)
    assert.equal(r.loads.api2, 800)
})
test('cache miss fraction is 10%, not zero', () =>
    assert.equal(evaluate(EXERCISES[1], solution(EXERCISES[1])).loads.sink, 80))
test('queue keeps every job and finishes within deadline', () => {
    const r = evaluate(EXERCISES[2], solution(EXERCISES[2]))
    assert.equal(r.loads.worker, 200)
    assert.equal(r.drain, 12)
    assert.equal(r.latency, 35)
})
test('CDN forwards misses to origin', () =>
    assert.equal(evaluate(EXERCISES[3], solution(EXERCISES[3])).loads.sink, 300))
test('sharding splits writes equally', () => {
    const r = evaluate(EXERCISES[4], solution(EXERCISES[4]))
    assert.equal(r.loads.sink, 800)
    assert.equal(r.loads.db2, 800)
})
test('cache cannot hide writes in sharding task', () => {
    const ex = EXERCISES[4],
        d = solution(ex)
    d.blocks.push(block('cache', 'cache'))
    d.wires = d.wires.filter((w) => w.source !== 'api')
    d.wires.push(
        { id: 'c1', source: 'api', target: 'cache' },
        { id: 'c2', source: 'cache', target: 'router' },
    )
    assert.equal(evaluate(ex, d).passed, false)
    assert.equal(evaluate(ex, d).loads.cache, 1600)
})
test('a bypass around the cache still overloads the database', () => {
    const ex = EXERCISES[1],
        d = solution(ex)
    d.wires.push({ id: 'bypass', source: 'api', target: 'sink' })
    const r = evaluate(ex, d)
    assert.equal(r.passed, false)
    assert.equal(r.loads.sink, 880)
})
test('a synchronous path around a queue fails', () => {
    const ex = EXERCISES[2],
        d = solution(ex)
    d.wires.push({ id: 'bypass', source: 'api', target: 'worker' })
    assert.equal(evaluate(ex, d).passed, false)
})
test('cycles are rejected without recursion failure', () => {
    const ex = EXERCISES[0],
        d = solution(ex)
    assert.equal(wouldCycle(d, 'sink', 'lb'), true)
    d.wires.push({ id: 'cycle', source: 'sink', target: 'lb' })
    assert.equal(evaluate(ex, d).passed, false)
})
test('invalid cache cannot replace core nodes or inject unknown kinds', () => {
    const ex = EXERCISES[0],
        d = solution(ex)
    d.blocks[0].kind = 'cache'
    assert.equal(restoreDesign(d, ex), null)
    assert.equal(restoreDesign({ blocks: [null], wires: [] }, ex), null)
    assert.equal(restoreDesign(null, ex), null)
})
test('a cache cannot silently discard email jobs', () => {
    const ex = EXERCISES[2],
        d = solution(ex)
    d.blocks.push(block('cache', 'cache'))
    d.wires = d.wires.filter((w) => w.source !== 'client')
    d.wires.push(
        { id: 'mail1', source: 'client', target: 'cache' },
        { id: 'mail2', source: 'cache', target: 'api' },
    )
    const r = evaluate(ex, d)
    assert.equal(r.loads.api, 1200)
    assert.equal(r.loads.worker, 200)
})
test('explanation follows the actual request order', () => {
    const trace = evaluate(EXERCISES[2], solution(EXERCISES[2])).trace
    assert.ok(
        trace.findIndex((t) => t.startsWith('Очередь')) < trace.findIndex((t) => t.startsWith('Воркер')),
    )
})
test('automatic layout changes positions without changing evaluation', () => {
    for (const ex of EXERCISES) {
        const d = solution(ex)
        const arranged = arrange(d)
        assert.deepEqual(arranged.wires, d.wires)
        assert.equal(evaluate(ex, arranged).passed, true)
        assert.equal(new Set(arranged.blocks.map((n) => `${n.x}:${n.y}`)).size, d.blocks.length)
        assert.deepEqual(arrange(arranged), arranged)
    }
})
test('duplicate edge identifiers and invalid coordinates do not restore', () => {
    const ex = EXERCISES[0]
    const d = solution(ex)
    d.wires[1].id = d.wires[0].id
    assert.equal(restoreDesign(d, ex), null)
    const badPosition = solution(ex)
    badPosition.blocks[1].x = NaN
    assert.equal(restoreDesign(badPosition, ex), null)
})
test('ordinary fan-out cannot duplicate email jobs and still pass', () => {
    const ex = EXERCISES[2],
        d = solution(ex)
    d.blocks.push(block('extraQueue', 'queue'))
    d.wires.push(
        { id: 'dup1', source: 'worker', target: 'extraQueue' },
        { id: 'dup2', source: 'extraQueue', target: 'sink' },
    )
    assert.equal(evaluate(ex, d).passed, false)
})
test('insertion replaces exactly one connection with a complete inline route', () => {
    const d = cloneDesign(EXERCISES[1].initial),
        old = d.wires.find((w) => w.source === 'api'),
        n = block('cache', 'cache')
    const next = insertBlockOnWire(d, n, old.id)
    assert.equal(next.blocks.length, d.blocks.length + 1)
    assert.equal(
        next.wires.some((w) => w.id === old.id),
        false,
    )
    assert.equal(
        next.wires.some((w) => w.source === 'api' && w.target === 'cache'),
        true,
    )
    assert.equal(
        next.wires.some((w) => w.source === 'cache' && w.target === 'sink'),
        true,
    )
    assert.equal(evaluate(EXERCISES[1], next).passed, true)
    assert.deepEqual(d, EXERCISES[1].initial)
})
test('moving an inline node restores its original route and does not duplicate the node', () => {
    const d = {
        blocks: [
            block('a', 'api'),
            block('b', 'cache'),
            block('c', 'database'),
            block('x', 'api'),
            block('y', 'database'),
        ],
        wires: [],
    }
    connect(d, ['a', 'b'], ['b', 'c'], ['x', 'y'])
    const next = insertBlockOnWire(d, d.blocks[1], d.wires[2].id)
    assert.equal(next.blocks.length, 5)
    for (const [source, target] of [
        ['a', 'c'],
        ['x', 'b'],
        ['b', 'y'],
    ])
        assert.equal(
            next.wires.some((w) => w.source === source && w.target === target),
            true,
        )
})
test('insertion of an existing branching component is rejected without losing its connections', () => {
    const d = solution(EXERCISES[0]),
        lb = d.blocks.find((n) => n.id === 'lb'),
        before = cloneDesign(d)
    assert.equal(insertBlockOnWire(d, lb, d.wires.find((w) => w.source === 'api').id), null)
    assert.deepEqual(d, before)
})
test('insertion into an incident edge or a missing edge is rejected', () => {
    const d = solution(EXERCISES[1])
    assert.equal(
        insertBlockOnWire(
            d,
            d.blocks.find((n) => n.id === 'cache'),
            d.wires.find((w) => w.target === 'cache').id,
        ),
        null,
    )
    assert.equal(insertBlockOnWire(d, block('fresh', 'cache'), 'missing'), null)
})
test('removing an inline component restores its route; a branching node does not guess a route', () => {
    const ex = EXERCISES[1],
        d = solution(ex),
        removed = removeDesignBlock(d, 'cache')
    assert.equal(
        removed.blocks.some((n) => n.id === 'cache'),
        false,
    )
    assert.equal(
        removed.wires.some((w) => w.source === 'api' && w.target === 'sink'),
        true,
    )
    assert.equal(evaluate(ex, removed).passed, false)
    const traffic = removeDesignBlock(solution(EXERCISES[0]), 'lb')
    assert.equal(
        traffic.wires.some((w) => w.source === 'client'),
        false,
    )
})
test('insertion makes enough space and preserves unrelated branch positions', () => {
    const d = cloneDesign(EXERCISES[1].initial),
        wire = d.wires.find((w) => w.source === 'api')
    const next = insertBlockOnWire(d, { ...block('cache', 'cache'), x: 400, y: 140 }, wire.id)
    const api = next.blocks.find((n) => n.id === 'api'),
        cache = next.blocks.find((n) => n.id === 'cache'),
        sink = next.blocks.find((n) => n.id === 'sink')
    assert.ok(cache.x >= api.x + 265)
    assert.ok(sink.x >= cache.x + 265)
    assert.deepEqual(
        next.blocks.find((n) => n.id === 'client'),
        d.blocks.find((n) => n.id === 'client'),
    )
})

test('25 unique levels form five complete trajectories', () => {
    assert.equal(EXERCISES.length, 25)
    assert.equal(new Set(EXERCISES.map((e) => e.id)).size, 25)
    const groups = new Map()
    for (const e of EXERCISES) {
        const key = e.track || 'Основы нагрузки'
        groups.set(key, [...(groups.get(key) || []), e])
    }
    assert.equal(groups.size, 5)
    for (const values of groups.values()) assert.equal(values.length, 5)
})
for (const ex of EXERCISES.filter((e) => e.scenario)) {
    for (const kind of ex.scenario.route.filter((k) => !['api', 'database'].includes(k))) {
        test(`${ex.id}: bypassing ${kind} breaks the invariant`, () => {
            const d = solution(ex)
            const node = d.blocks.find((n) => n.kind === kind)
            assert.equal(evaluate(ex, removeDesignBlock(d, node.id)).passed, false)
        })
    }
    test(`${ex.id}: extra direct route cannot bypass protection`, () => {
        const d = solution(ex)
        d.wires.push({ id: 'bypass', source: 'api', target: 'sink' })
        assert.equal(evaluate(ex, d).passed, false)
    })
    test(`${ex.id}: protection placed after the sink is not accepted`, () => {
        const d = solution(ex)
        const ids = [
            'client',
            'api',
            'sink',
            ...d.blocks.filter((n) => !['client', 'api', 'sink'].includes(n.id)).map((n) => n.id),
        ]
        connect(d, ...ids.slice(1).map((id, i) => [ids[i], id]))
        assert.equal(evaluate(ex, d).passed, false)
    })
}
test('admission explicitly rejects excess before the API', () => {
    const ex = EXERCISES.find((e) => e.id === 'edge-admission')
    assert.equal(evaluate(ex, solution(ex)).loads.api, 500)
})
test('single-flight coalesces one hot key without pretending a warm cache', () => {
    const ex = EXERCISES.find((e) => e.id === 'cache-stampede')
    assert.equal(evaluate(ex, solution(ex)).loads.sink, 1)
})
for (const ex of EXERCISES.filter((e) => e.scenario)) {
    const route = ex.scenario.route
    for (let index = 0; index < route.length - 1; index++) {
        if (['api', 'database'].includes(route[index]) || ['api', 'database'].includes(route[index + 1]))
            continue
        test(`${ex.id}: order of ${route[index]} and ${route[index + 1]} matters`, () => {
            const d = solution(ex)
            const order = ['client', ...route.map((kind) => d.blocks.find((n) => n.kind === kind).id)]
            ;[order[index + 1], order[index + 2]] = [order[index + 2], order[index + 1]]
            connect(d, ...order.slice(1).map((id, i) => [order[i], id]))
            assert.equal(evaluate(ex, d).passed, false)
        })
    }
}
test('a protected branch does not excuse an unprotected parallel branch', () => {
    const ex = EXERCISES.find((e) => e.id === 'rpc-dedup')
    const d = solution(ex)
    const guard = d.blocks.find((n) => n.kind === 'dedup').id
    d.blocks.push(block('lb', 'balancer'))
    connect(d, ['client', 'api'], ['api', 'lb'], ['lb', guard], ['lb', 'sink'], [guard, 'sink'])
    const result = evaluate(ex, d)
    assert.equal(result.checks.find((c) => c.label === 'Маршруты без потерь и дублей').ok, true)
    assert.equal(result.checks.find((c) => c.label === 'Исправлена причина сбоя').ok, false)
})


test('all 25 exercises offer exactly the same 20 addable block kinds', () => {
    assert.equal(EXERCISES.length, 25)
    assert.equal(ADDABLE_BLOCKS.length, 20)
    assert.equal(new Set(ADDABLE_BLOCKS).size, 20)
    assert.equal(ADDABLE_BLOCKS.includes('client'), false)
    assert.equal(ADDABLE_BLOCKS.includes('storage'), false)
    for (const ex of EXERCISES) assert.deepEqual(ex.allowed, ADDABLE_BLOCKS, ex.id)
})
for (const ex of EXERCISES) {
    test(`${ex.id}: all 20 block kinds survive saved-design restoration`, () => {
        const design = cloneDesign(ex.initial)
        for (const [i, kind] of ADDABLE_BLOCKS.entries()) {
            design.blocks.push({ id: `library-${i}`, kind, x: 200 + i * 10, y: 400 })
        }
        assert.deepEqual(restoreDesign(design, ex), design)
        assert.equal(evaluate(ex, design).passed, false, 'Adding unrelated blocks alone must not solve the task')
    })
}
