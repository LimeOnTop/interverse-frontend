import { useEffect, useSyncExternalStore } from 'react'
import { api } from '../services/api'
import { useAuthStore } from '../store/authStore'

export interface PracticePayload { technologies: string[]; specialization: string; level: string; task_mode: string }
export interface PracticeTarget { kind: 'interview' | 'preparation' | 'review' | 'draft'; target_id: string; step_index?: number; title: string; payload?: PracticePayload }
export interface PracticeReminder extends PracticeTarget { id: string; scheduled_at: string; timezone: string; email_enabled: boolean; lead_minutes: number; revision: number; email_failed: boolean; email_sent: boolean; email_retry_at?: string; email_error?: string; email_attempts?: number }
export const reminderChanged = (id?: string) => window.dispatchEvent(new CustomEvent('practice-reminders-changed', { detail: { id } }))

type Snapshot = { owner?: string; items: PracticeReminder[]; error: string; loading: boolean }
let snapshot: Snapshot = { items: [], error: '', loading: true }
let inFlight: { owner: string; promise: Promise<void> } | null = null
const listeners = new Set<() => void>()
const publish = (next: Snapshot) => { snapshot = next; listeners.forEach(listener => listener()) }
async function reload() {
    const owner = useAuthStore.getState().user?.id
    if (!owner) return
    if (inFlight?.owner === owner) return inFlight.promise
    if (snapshot.owner !== owner) publish({ owner, items: [], error: '', loading: true })
    const promise = (async () => {
        try {
            const { data } = await api.get<PracticeReminder[]>('/practice-reminders')
            if (useAuthStore.getState().user?.id === owner) publish({ owner, items: data || [], error: '', loading: false })
        } catch {
            if (useAuthStore.getState().user?.id === owner) publish({ ...snapshot, owner, error: 'Не удалось загрузить планы практики.', loading: false })
        } finally { if (inFlight?.owner === owner) inFlight = null }
    })()
    inFlight = { owner, promise }
    return promise
}
function subscribe(listener: () => void) {
    listeners.add(listener)
    return () => { listeners.delete(listener) }
}
function refresh() { void reload() }
window.addEventListener('practice-reminders-changed', refresh)
export function usePracticeReminders() {
    const user = useAuthStore(state => state.user?.id)
    const state = useSyncExternalStore(subscribe, () => snapshot, () => snapshot)
    useEffect(() => { if (snapshot.owner !== user || snapshot.loading) void reload() }, [user])
    return { items: state.owner === user ? state.items : [], error: state.owner === user ? state.error : '', loading: state.owner !== user || state.loading, reload }
}
export function dateTimeLabel(value: string, zone: string) { return new Intl.DateTimeFormat('ru-RU', { timeZone: zone, day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(new Date(value)) }
export function timeZoneLabel(zone: string) {
    const offset = new Intl.DateTimeFormat('ru-RU', { timeZone: zone, timeZoneName: 'shortOffset' }).formatToParts(new Date()).find(part => part.type === 'timeZoneName')?.value?.replace('GMT', 'UTC')
    return `${zone === 'Europe/Moscow' ? 'Москва' : zone.replace(/_/g, ' ')}${offset ? ' · ' + offset : ''}`
}
