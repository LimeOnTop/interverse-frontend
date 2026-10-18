import { useEffect, useState } from 'react'
import { api } from '../services/api'
import type { PracticePayload } from '../lib/practiceReminders'

export interface PracticeAvailability { available: boolean; available_levels: string[] }
const cache = new Map<string, { at: number; data: PracticeAvailability }>()
export function usePracticeAvailability(payload: PracticePayload, enabled = true, includeLevels = false) {
    const key = JSON.stringify({ ...payload, include_levels: includeLevels })
    const [result, setResult] = useState<{ key: string; data?: PracticeAvailability; error?: string }>({ key: '' })
    const [retry, setRetry] = useState(0)
    useEffect(() => {
        if (!enabled || !payload.technologies.length) return
        const cached = cache.get(key)
        if (cached && Date.now() - cached.at < 60000) { setResult({ key, data: cached.data }); return }
        const controller = new AbortController()
        const timeout = window.setTimeout(() => {
            api.post<PracticeAvailability>('/practice-reminders/check', JSON.parse(key), { signal: controller.signal }).then(({ data }) => {
                if (controller.signal.aborted) return
                cache.set(key, { at: Date.now(), data }); setResult({ key, data })
            }).catch(error => {
                if (!controller.signal.aborted) setResult({ key, error: error?.response?.data?.error || 'Не удалось проверить вопросы. Повторите проверку.' })
            })
        }, 250)
        return () => { controller.abort(); window.clearTimeout(timeout) }
    }, [key, enabled, retry])
    return { data: enabled && result.key === key ? result.data : undefined, error: result.key === key ? result.error : undefined, loading: enabled && payload.technologies.length > 0 && result.key !== key, retry: () => { cache.delete(key); setResult({ key: '' }); setRetry(value => value + 1) } }
}
