import { useAuthStore } from '../../store/authStore'
import { api } from '../../services/api'
import { EXERCISES, evaluate, restoreDesign, type Design, type Exercise } from './model'

export const storageKey = (owner: string, id: string) => `iv:form:system-design:${owner}:${id}`
type Record = { exercise_id: string; design: Design; completed: boolean; revision: number }
type Draft = { version: number; design: Design; pending?: boolean; revision?: number }
const records = new Map<string, Record>()
const queues = new Map<string, Promise<unknown>>()
export function accountRecord(owner: string, ex: Exercise) { return records.get(storageKey(owner, ex.id)) }
export function localDraft(owner: string, id: string): Draft | null {
    try { const value = JSON.parse(localStorage.getItem(storageKey(owner, id)) || 'null'); return value?.version === 1 ? value : null } catch { return null }
}
export function cacheDraft(owner: string, ex: Exercise, design: Design) {
    localStorage.setItem(storageKey(owner, ex.id), JSON.stringify({ version: 1, design, pending: true, revision: accountRecord(owner, ex)?.revision || 0 }))
}
export async function saveProgress(owner: string, ex: Exercise, design: Design) {
    const key = storageKey(owner, ex.id)
    const previous = queues.get(key) || Promise.resolve()
    const next = previous.catch(() => {}).then(async () => {
        if (String(useAuthStore.getState().user?.id) !== owner) throw new Error('Аккаунт изменён')
        const { data } = await api.put<Record>('/system-design/progress', { exercise_id: ex.id, design, completed: evaluate(ex, design).passed, revision: records.get(key)?.revision || 0 })
        records.set(key, data)
        // A newer edit may have happened while this request was in flight.
        const draft = localDraft(owner, ex.id)
        try {
            if (!draft?.pending || JSON.stringify(draft.design) === JSON.stringify(design)) {
                localStorage.setItem(key, JSON.stringify({ version: 1, design, revision: data.revision, pending: false }))
            } else {
                localStorage.setItem(key, JSON.stringify({ ...draft, revision: data.revision }))
            }
        } catch { /* Cloud saving remains available when local storage is full. */ }
    })
    queues.set(key, next)
    try { await next } finally { if (queues.get(key) === next) queues.delete(key) }
}
async function hydrateProgress(owner: string, preferRemote = false) {
    if (String(useAuthStore.getState().user?.id) !== owner) throw new Error('Аккаунт изменён')
    const { data } = await api.get<Record[]>('/system-design/progress')
    if (String(useAuthStore.getState().user?.id) !== owner) throw new Error('Аккаунт изменён')
    for (const ex of EXERCISES) {
        const key = storageKey(owner, ex.id)
        const remote = data.find(row => row.exercise_id === ex.id)
        const draft = localDraft(owner, ex.id)
        const design = draft && restoreDesign(draft.design, ex)
        if (remote) {
            const restored = restoreDesign(remote.design, ex)
            if (!restored) throw new Error('Не удалось загрузить схему')
            records.set(key, { ...remote, design: restored })
            if (draft && !draft.pending && draft.revision === undefined && design && JSON.stringify(design) !== JSON.stringify(restored)) {
                localStorage.setItem(key + ':backup', JSON.stringify(draft))
            }
            if (draft?.pending && design && JSON.stringify(design) !== JSON.stringify(restored)) {
                if (preferRemote) {
                    // Keep a recoverable copy instead of destroying unsynced work.
                    localStorage.setItem(key + ':backup', JSON.stringify(draft))
                    localStorage.setItem(key, JSON.stringify({ version: 1, design: restored, revision: remote.revision, pending: false }))
                } else if (draft.revision === remote.revision) {
                    await saveProgress(owner, ex, design)
                } else {
                    throw new Error('Схема изменена на другом устройстве. Выберите сохранённую версию аккаунта или повторите загрузку.')
                }
            }
        } else {
            records.delete(key)
            if (design) await saveProgress(owner, ex, design)
        }
    }
}

const loading = new Map<string, Promise<void>>()
export async function loadProgress(owner: string, preferRemote = false) {
    const pending = loading.get(owner)
    if (pending) return pending
    const job = hydrateProgress(owner, preferRemote)
    loading.set(owner, job)
    try { await job } finally { if (loading.get(owner) === job) loading.delete(owner) }
}
