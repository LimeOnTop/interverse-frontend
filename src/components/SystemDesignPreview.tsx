import { useState } from 'react'
import { Database, Network, Server, Users, Check, RotateCcw } from 'lucide-react'
import { EXERCISES, evaluate, type Design } from '../features/system-design/model'
import { reachGoal } from '../lib/analytics'
import '../styles/system-design-landing.css'

const exercise = EXERCISES[0]
const solution: Design = {
    blocks: [{ id: 'client', kind: 'client', x: 0, y: 0 }, { id: 'lb', kind: 'balancer', x: 0, y: 0 }, { id: 'api', kind: 'api', x: 0, y: 0 }, { id: 'api2', kind: 'api', x: 0, y: 0 }, { id: 'sink', kind: 'database', x: 0, y: 0 }],
    wires: [['client', 'lb'], ['lb', 'api'], ['lb', 'api2'], ['api', 'sink'], ['api2', 'sink']].map(([source, target], i) => ({ id: String(i), source, target })),
}

export default function SystemDesignPreview({ compact = false }: { compact?: boolean }) {
    const [fixed, setFixed] = useState(compact)
    const [checked, setChecked] = useState(false)
    const passed = evaluate(exercise, fixed ? solution : exercise.initial).passed
    const nodes = fixed
        ? [{ x: 12, y: 50, label: 'Клиент', Icon: Users }, { x: 34, y: 50, label: 'Балансировщик', Icon: Network }, { x: 58, y: 28, label: 'API · 1', Icon: Server }, { x: 58, y: 73, label: 'API · 2', Icon: Server }, { x: 82, y: 50, label: 'База данных', Icon: Database }]
        : [{ x: 12, y: 50, label: 'Клиент', Icon: Users }, { x: 47, y: 50, label: 'API · 1', Icon: Server }, { x: 82, y: 50, label: 'База данных', Icon: Database }]
    return <div className={`sd-preview ${compact ? 'sd-preview-compact' : ''}`}>
        <div className="sd-preview-toolbar"><span>01 / НАГРУЗКА</span>{!compact && <button type="button" aria-label="Сбросить пример схемы" onClick={() => { setFixed(false); setChecked(false) }}><RotateCcw size={15} /></button>}</div>
        <div className="sd-preview-board" role="img" aria-label={fixed ? 'Клиент подключён через балансировщик к двум API и общей базе данных' : 'Клиент подключён к одному перегруженному API и базе данных'}>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                {(fixed ? ['M12 50 H34', 'M34 50 H45 V28 H58', 'M34 50 H45 V73 H58', 'M58 28 H70 V50 H82', 'M58 73 H70 V50 H82'] : ['M12 50 H47', 'M47 50 H82']).map(d => <path key={d} d={d} />)}
            </svg>
            {nodes.map(({ x, y, label, Icon }) => <div key={label} className="sd-preview-node" style={{ left: x + '%', top: y + '%' }}><Icon size={20} strokeWidth={1.5} /><span>{label}</span></div>)}
        </div>
        {!compact && <><div className="sd-preview-demand"><span>Пришло <strong>1 600 запросов/с</strong></span><span>Один API: 1 000/с</span></div>
            <div className="sd-preview-actions"><button type="button" className="sd-preview-repair" disabled={fixed} onClick={() => { setFixed(true); setChecked(false); reachGoal('system_design_demo_repair') }}>{fixed ? <><Check size={16} /> Нагрузка распределена</> : 'Добавить балансировщик и API'}</button><button type="button" className="iv-landing-button" onClick={() => { setChecked(true); reachGoal('system_design_demo_check', { passed: passed ? 1 : 0 }) }}>Проверить решение</button></div>
            <p className="sd-preview-feedback" aria-live="polite">{checked ? passed ? 'Верно. Два API принимают нагрузку, запросы доходят до БД.' : 'Один API перегружен. Распредели запросы между двумя серверами.' : 'Как помочь сервису справиться с нагрузкой?'}</p></>}
    </div>
}
