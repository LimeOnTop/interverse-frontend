import { useDialogMotion } from '../hooks/useDialogMotion'
import { useCallback, useEffect, useId, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowDown, ArrowUp, Loader2, X } from 'lucide-react'
import { api } from '../services/api'
import { LEVELS, SPECIALIZATIONS, TECH_STACKS } from './InterviewWizard/options'
import type { VacancyCardData } from './VacancyCard'
import { inferLevel } from './VacancyCard'
import type { Preparation, PreparationStep } from '../lib/preparations'
import { reminderChanged } from '../lib/practiceReminders'
import { usePersistedState, clearFormDraft } from '../hooks/usePersistedForm'
import { useModalDialog } from '../hooks/useModalDialog'
import { usePracticeAvailability } from '../hooks/usePracticeAvailability'
import { useTechnologySearch } from '../hooks/useTechnologySearch'
import { formatUserFacingError } from '../lib/interviewSession'
import '../styles/vacancy-path.css'

function direction(technology: string) {
    const value = technology.toLowerCase()
    return /^(docker|kubernetes|k8s|terraform|ansible|jenkins|aws|azure|gcp|prometheus|grafana|gitlab ci|github actions)$/.test(value) ? 'devops' : /^(react|vue|vue.js|angular|javascript|typescript|css|html|next.js)$/.test(value) ? 'frontend' : /^(selenium|cypress|playwright|junit|pytest|postman)$/.test(value) ? 'qa' : /^(pandas|numpy|tensorflow|pytorch|scikit-learn|r)$/.test(value) ? 'data_science' : 'backend'
}
function availabilityKey(step: PreparationStep, level: string) { return `${step.id}:${step.technology}:${step.specialization}:${level}` }
function StepAvailability({ step, level, onStatus }: { step: PreparationStep; level: string; onStatus: (key: string, status: string) => void }) {
    const check = usePracticeAvailability({ technologies: [step.technology], specialization: step.specialization, level, task_mode: 'theory' }, true, true)
    const key = availabilityKey(step, level)
    const status = check.error ? 'error' : check.data ? check.data.available ? 'available' : 'unavailable' : 'pending'
    useEffect(() => { onStatus(key, status) }, [key, status, onStatus])
    return <div className={`vp-step-availability ${status === 'error' || status === 'unavailable' ? 'vp-error' : 'vp-muted'}`} role="status">
        {status === 'pending' ? 'Проверяем вопросы и доступные уровни…' : status === 'error' ? <>{check.error} <button type="button" onClick={check.retry}>Повторить</button></> : <>{check.data?.available ? 'Вопросы есть.' : 'Для этого уровня недостаточно вопросов.'}{check.data?.available_levels.length ? ' Доступно: ' + check.data.available_levels.map(id => LEVELS.find(item => item.id === id)?.name || id).join(', ') + '.' : ' Выберите другую технологию.'}</>}
    </div>
}
export default function PreparationCreateDialog({ vacancy, preparation, onClose: finishClose, onSaved }: { vacancy?: VacancyCardData; preparation?: Preparation; onClose: () => void; onSaved?: () => Promise<void> }) {
    const dialog = useModalDialog()
    const navigate = useNavigate()
    const datalist = useId()
    const manual = !vacancy || vacancy.source === 'manual'
    const key = `vacancy-preparation:${preparation?.id || (manual ? 'manual' : `${vacancy?.source}:${vacancy?.external_id || vacancy?.id}`)}`
    const initial = {
        title: preparation?.title || vacancy?.title || '', url: preparation?.url || vacancy?.url || '', company: preparation?.company || vacancy?.company_name || '', level: preparation?.level || (manual ? 'junior' : inferLevel(vacancy?.experience)),
        steps: preparation?.steps || Array.from(new Set(vacancy?.skills || [])).slice(0, 30).map(technology => ({ id: crypto.randomUUID(), technology, specialization: direction(technology) })), technology: '', manualKey: crypto.randomUUID(), revision: preparation?.revision || 0,
    }
    const [draft, setDraft] = usePersistedState(key, initial)
    const { title, url, level, steps, technology } = draft
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')
    const [checks, setChecks] = useState<Record<string, string>>({})
    const search = useTechnologySearch(technology)
    const options = Array.from(new Set([...Object.values(TECH_STACKS).flat(), ...search.searchResults])).sort()
    const locked = new Set(preparation?.steps.filter((_, index) => preparation.attempts.some(attempt => attempt.step_index === index)).map(step => step.id))
    const hasAttempts = Boolean(preparation?.attempts.length)
    const recordCheck = useCallback((checkKey: string, value: string) => setChecks(previous => previous[checkKey] === value ? previous : { ...previous, [checkKey]: value }), [])
    const validSteps = steps.length > 0 && steps.every(step => locked.has(step.id) || checks[availabilityKey(step, level)] === 'available')
    const update = (patch: Partial<typeof draft>) => setDraft(previous => ({ ...previous, ...patch }))
    function add() {
        const value = technology.trim()
        if (!value) return
        if (steps.some(step => step.technology.toLowerCase() === value.toLowerCase())) { setError('Эта технология уже добавлена'); return }
        update({ steps: [...steps, { id: crypto.randomUUID(), technology: value, specialization: direction(value) }], technology: '' }); setError('')
    }
    function move(index: number, offset: number) { const next = [...steps]; [next[index], next[index + offset]] = [next[index + offset], next[index]]; update({ steps: next }) }
    async function save() {
        if (busy || !validSteps || !title.trim() || technology.trim()) return
        setBusy(true); setError('')
        try {
            const body = { vacancy_key: preparation?.vacancy_key || (manual ? `manual:${url.trim() || draft.manualKey}` : `${vacancy?.source}:${vacancy?.external_id || vacancy?.id}`), title: title.trim(), company: draft.company, url: url.trim(), level, steps, revision: preparation ? draft.revision : undefined }
            const { data } = preparation ? await api.put<Preparation>(`/preparations/${preparation.id}`, body) : await api.post<Preparation>('/preparations', body)
            clearFormDraft(key); reminderChanged()
            if (preparation) { await onSaved?.(); onClose() }
            else navigate(`/dashboard?preparation=${data.id}`)
        } catch (error) { setError(formatUserFacingError(error, 'Не удалось сохранить подготовку. Ввод сохранён в черновике.')) }
        finally { setBusy(false) }
    }
    const onClose = useDialogMotion(dialog, finishClose)
    return <dialog ref={dialog} className="vp-dialog" aria-labelledby="prep-title" onCancel={event => { event.preventDefault(); if (!busy) onClose() }}>
        <div className="vp-dialog-head"><span className="vp-label">Подготовка по вакансии</span><button type="button" aria-label="Закрыть" onClick={onClose} disabled={busy}><X size={18} /></button></div>
        <h2 id="prep-title">{preparation ? 'Изменить подготовку' : manual ? 'Подготовка к своей вакансии' : 'Подготовиться к вакансии'}</h2>
        <p className="vp-muted">{preparation ? 'История и результаты останутся у своих технологий. Новая попытка не списывается.' : 'Черновик сохраняется при закрытии. Проверьте технологии и уровень перед началом.'}</p>
        <div className="vp-manual"><label>Название позиции<input value={title} maxLength={250} onChange={event => update({ title: event.target.value })} placeholder="Например, Python-разработчик" disabled={busy} /></label><label>Ссылка на вакансию (необязательно)<input type="url" value={url} maxLength={2000} onChange={event => update({ url: event.target.value })} placeholder="https://…" disabled={busy} /></label></div>
        <label className="vp-level">Уровень подготовки<select value={level} onChange={event => update({ level: event.target.value })} disabled={busy || hasAttempts}>{LEVELS.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        {hasAttempts && <p className="vp-muted">Начатые технологии и уровень защищены от замены, чтобы сохранить смысл отчётов. Этапы можно переставлять, новые — добавлять.</p>}
        <ol className="vp-edit-steps">{steps.map((step, index) => <li className="vp-edit-step" key={step.id}><b>{index + 1}. {step.technology}</b><select aria-label={`Направление для ${step.technology}`} value={step.specialization} disabled={busy || locked.has(step.id)} onChange={event => update({ steps: steps.map((item, i) => i === index ? { ...item, specialization: event.target.value } : item) })}>{SPECIALIZATIONS.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
            <div className="vp-order"><button type="button" aria-label={`Переместить ${step.technology} выше`} disabled={busy || index === 0} onClick={() => move(index, -1)}><ArrowUp size={16} /></button><button type="button" aria-label={`Переместить ${step.technology} ниже`} disabled={busy || index === steps.length - 1} onClick={() => move(index, 1)}><ArrowDown size={16} /></button><button type="button" aria-label={`Убрать ${step.technology}`} title={locked.has(step.id) ? 'Начатый этап сохраняет свои результаты' : undefined} disabled={busy || locked.has(step.id)} onClick={() => update({ steps: steps.filter((_, i) => i !== index) })}><X size={16} /></button></div>
            {locked.has(step.id) ? <small className="vp-step-availability vp-muted">Начатый этап · результаты сохраняются</small> : <StepAvailability step={step} level={level} onStatus={recordCheck} />}
        </li>)}</ol>
        <form className="vp-add" onSubmit={event => { event.preventDefault(); add() }}><input aria-label="Технология" list={datalist} placeholder="Добавить технологию, например Python" value={technology} maxLength={100} onChange={event => update({ technology: event.target.value })} disabled={busy || steps.length >= 30} /><datalist id={datalist}>{options.map(option => <option key={option} value={option} />)}</datalist><button disabled={busy || !technology.trim() || steps.length >= 30}>Добавить</button></form>
        {technology.trim() && <p className="vp-muted">Нажмите «Добавить», чтобы включить введённую технологию в подготовку.</p>}
        <p className="vp-muted">Вся подготовка — одна попытка, включая все этапы и повторы. Начинайте с любой технологии.</p>
        {error && <p role="alert" className="vp-error">{error}</p>}
        <div className="vp-dialog-footer"><div className="vp-actions"><button className="vp-btn" disabled={busy} onClick={onClose}>Закрыть</button><button className="vp-btn primary" disabled={busy || !validSteps || !title.trim() || Boolean(technology.trim())} onClick={() => void save()}>{busy && <Loader2 size={16} className="animate-spin" />}{preparation ? 'Сохранить изменения' : 'Создать подготовку · 1 попытка'}</button></div><button type="button" className="vp-reset" disabled={busy} onClick={() => { setDraft(initial); clearFormDraft(key); setError('') }}>Сбросить черновик</button></div>
    </dialog>
}
