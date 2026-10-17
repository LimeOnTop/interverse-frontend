/** Production-only Metrika events. Never send names, emails, tokens or form contents. */
export const METRIKA_ID = 105896035
export const PAYMENT_PLANS = ['paid_1m', 'paid_3m', 'paid_6m', 'paid_1y', 'trial_3d'] as const
export type PaymentPlan = typeof PAYMENT_PLANS[number]
type Ym = (id: number, method: string, ...args: unknown[]) => void
const sent = new Set<string>()
function storageGet(key: string) { try { return localStorage.getItem(key) } catch { return null } }
function storageSet(key: string, value: string) { try { localStorage.setItem(key, value) } catch { /* unavailable storage */ } }
export function reachGoal(goal: string, params: Record<string, string | number> = {}, dedupKey?: string) {
    if (typeof window === 'undefined' || !['inter-verse.ru', 'www.inter-verse.ru'].includes(window.location.hostname)) return false
    const ym = (window as Window & { ym?: Ym }).ym
    if (!ym) return false
    const key = dedupKey ? `iv:analytics:sent:${goal}:${dedupKey}` : ''
    if (key && (sent.has(key) || storageGet(key))) return true
    try {
        ym(METRIKA_ID, 'reachGoal', goal, params)
        if (key) { sent.add(key); storageSet(key, '1') }
        return true
    } catch { return false /* Analytics must never interrupt registration or payment. */ }
}
type RegistrationStage = 'form_view' | 'form_start' | 'validation_error' | 'submit' | 'error' | 'google_click' | 'verification_required'
/** Only controlled labels go here; never pass field values or raw error messages. */
export function registrationFunnel(stage: RegistrationStage, params: Record<string, string | number> = {}) {
    reachGoal(`registration_${stage}`, params)
}
export function registrationComplete(id: string, method = 'email') {
    reachGoal('registration_complete', { method }, `registration:${id}`)
}
export interface PendingPurchase { id: number; plan: PaymentPlan; owner: string; createdAt: number }
const pendingKey = 'iv:analytics:pending-purchases'
export function pendingPurchases(): PendingPurchase[] {
    try { return JSON.parse(storageGet(pendingKey) || '[]').filter((p: PendingPurchase) => PAYMENT_PLANS.includes(p.plan) && Number.isSafeInteger(p.id) && p.id > 0 && Date.now() - p.createdAt < 7 * 86400000) } catch { return [] }
}
export function checkoutStarted(id: number, plan: string, owner: string) {
    if (!PAYMENT_PLANS.includes(plan as PaymentPlan) || !Number.isSafeInteger(id)) return
    storageSet(pendingKey, JSON.stringify([...pendingPurchases().filter(p => p.id !== id), { id, plan, owner, createdAt: Date.now() }]))
    reachGoal(plan === 'trial_3d' ? 'pro_trial_checkout' : 'subscription_checkout', { plan }, `checkout:${id}`)
}
export interface PaidReceipt { id: number; plan: string; amount: string; duration_days: number }
export function confirmPurchases(receipts: PaidReceipt[], owner: string) {
    const pending = pendingPurchases()
    const remaining = pending.filter(p => {
        if (p.owner !== owner) return true
        const receipt = receipts.find(r => Number(r.id) === p.id)
        if (!receipt) return true
        // Paid history is server-authoritative; don't trust the success URL or checkout amount.
        const actualPlan = receipt.plan === 'paid' ? ({30:'paid_1m',90:'paid_3m',180:'paid_6m',365:'paid_1y'} as Record<number,string>)[receipt.duration_days] : receipt.plan
        const amount = Number(receipt.amount)
        if (actualPlan !== p.plan || !Number.isFinite(amount) || amount <= 0) return true
        const general = reachGoal(p.plan === 'trial_3d' ? 'pro_trial_paid' : 'subscription_paid', { plan: p.plan, order_price: amount, currency: 'RUB' }, `purchase:${p.id}`)
        const specific = reachGoal(`subscription_${p.plan}`, { order_price: amount, currency: 'RUB' }, `purchase:${p.id}`)
        return !(general && specific)
    })
    storageSet(pendingKey, JSON.stringify(remaining))
}
