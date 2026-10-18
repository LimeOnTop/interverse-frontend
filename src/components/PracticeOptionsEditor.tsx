import { useId, useState } from 'react'
import { LEVELS, SPECIALIZATIONS, TECH_STACKS } from './InterviewWizard/options'
import type { PracticePayload } from '../lib/practiceReminders'
import { usePracticeAvailability } from '../hooks/usePracticeAvailability'

export function AvailabilityNotice({ check }: { check: ReturnType<typeof usePracticeAvailability> }) {
    if (check.loading) return <p role="status" className="pr-note">Проверяем наличие вопросов…</p>
    if (check.error) return <p role="alert" className="pr-error">{check.error} <button type="button" className="underline" onClick={check.retry}>Повторить проверку</button></p>
    if (!check.data) return null
    return <p className={check.data.available ? 'pr-note' : 'pr-error'} role="status">{check.data.available ? 'Для этих параметров есть вопросы.' : `Недостаточно вопросов. ${check.data.available_levels.length ? 'Доступные уровни: ' + check.data.available_levels.map(id => LEVELS.find(level => level.id === id)?.name || id).join(', ') + '.' : 'Выберите другую технологию.'}`}</p>
}
export default function PracticeOptionsEditor({ value, onChange, disabled = false }: { value: PracticePayload; onChange: (value: PracticePayload) => void; disabled?: boolean }) {
    const id = useId()
    const [text, setText] = useState(value.technologies.join(', '))
    return <fieldset className="pr-options" disabled={disabled}><legend>Параметры практики</legend>
        <label>Направление<select value={value.specialization} onChange={event => onChange({ ...value, specialization: event.target.value })}>{SPECIALIZATIONS.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label>Технологии через запятую<input list={id} value={text} placeholder="Python, SQL" onChange={event => { setText(event.target.value); onChange({ ...value, technologies: Array.from(new Set(event.target.value.split(',').map(item => item.trim()).filter(Boolean))) }) }} /></label>
        <datalist id={id}>{Array.from(new Set(Object.values(TECH_STACKS).flat())).map(item => <option key={item} value={item} />)}</datalist>
        <label>Уровень<select value={value.level} onChange={event => onChange({ ...value, level: event.target.value })}>{LEVELS.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label>Задачи<select value={value.task_mode} onChange={event => onChange({ ...value, task_mode: event.target.value })}><option value="theory">Только теория</option><option value="few">1–3 задачи</option><option value="many">4–6 задач</option></select></label>
    </fieldset>
}
