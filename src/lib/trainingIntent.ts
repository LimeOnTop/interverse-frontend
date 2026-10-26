import { reachGoal } from './analytics'
import { api } from '../services/api'
const KEY = 'iv:training-intent'
export function pendingTrainingIntent(): string | null { return localStorage.getItem(KEY) }
export function rememberReminderReturn(){const id=new URLSearchParams(window.location.search).get('reminder');if(id&&/^[a-f0-9-]{36}$/i.test(id))sessionStorage.setItem('iv:reminder-return',JSON.stringify({id,at:Date.now()}))}
export function rememberSystemDesignReturn() {
 sessionStorage.setItem('iv:system-design-return', String(Date.now()))
}
export function authDestination(fallback = '/dashboard'): string {
 let target:string|null=null;try{const raw=sessionStorage.getItem('iv:reminder-return');sessionStorage.removeItem('iv:reminder-return');if(raw){const p=JSON.parse(raw);if(/^[a-f0-9-]{36}$/i.test(p.id)&&Date.now()-p.at<1800000)target='/dashboard?reminder='+encodeURIComponent(p.id)}}catch{}
 let systemDesign = false
 try { const at = Number(sessionStorage.getItem('iv:system-design-return')); sessionStorage.removeItem('iv:system-design-return'); systemDesign = at > 0 && Date.now() - at >= 0 && Date.now() - at < 86400000 } catch {}
 return target || (systemDesign ? '/system-design/traffic' : null) || (pendingTrainingIntent() ? '/training/resume' : fallback)
}
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
