import { reachGoal } from './analytics'
import { api } from '../services/api'
const KEY = 'iv:training-intent'
export function pendingTrainingIntent(): string | null { return localStorage.getItem(KEY) }
export function authDestination(fallback = '/dashboard'): string { return pendingTrainingIntent() ? '/training/resume' : fallback }
export async function saveTrainingIntent(specialization: string, technology: string, level: string) {
    reachGoal('training_intent_submit')
    try {
        const { data } = await api.post('/training-intents', { specialization, technologies: [technology], level })
        localStorage.setItem(KEY, data.id)
        reachGoal('training_intent_saved')
    } catch (error) {
        reachGoal('training_intent_error')
        throw error
    }
}
export function clearTrainingIntent() { localStorage.removeItem(KEY) }
