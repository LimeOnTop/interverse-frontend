/** Production-only Metrika events. Never send names, emails, tokens or form contents. */
export const METRIKA_ID = 105896035
export const PAYMENT_PLANS = ['paid_1m', 'paid_3m', 'paid_6m', 'paid_1y', 'trial_3d'] as const
export type PaymentPlan = typeof PAYMENT_PLANS[number]
type Ym = (id: number, method: string, ...args: unknown[]) => void
const sent = new Set<string>()
function storageGet(key: string) { try { return localStorage.getItem(key) } catch { return null } }
function storageSet(key: string, value: string) { try { localStorage.setItem(key, value) } catch { /* unavailable storage */ } }
// Explicit account IDs, never names: renaming an account must not enable tracking.
export const TEST_ACCOUNT_IDS = new Set(['3', '47'])
const excludedDeviceKey = 'iv:analytics:excluded-device'
let identity: string | null | undefined
let initialized = false
let boundIdentity: string | null = null
// A bookmark can exclude a fresh test browser before its first anonymous visit.
if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('analytics') === 'off') storageSet(excludedDeviceKey, '1')
let excluded = storageGet(excludedDeviceKey) === '1'
const deferred: Array<() => void> = []
function production() { return typeof window !== 'undefined' && ['inter-verse.ru', 'www.inter-verse.ru'].includes(window.location.hostname) }
function metrika() { return (window as Window & { ym?: Ym }).ym }
export function analyticsExcluded(id?: string | null) { return excluded || storageGet(excludedDeviceKey) === '1' || TEST_ACCOUNT_IDS.has(String(id)) }
/** Remember test browsers after logout, too. Clearing browser storage resets this flag. */
export function setAnalyticsIdentity(id: string | null) {
    const next = id && /^\d+$/.test(String(id)) ? String(id) : null
    if (TEST_ACCOUNT_IDS.has(String(id))) { excluded = true; storageSet(excludedDeviceKey, '1') }
    if (production() && initialized && (analyticsExcluded(id) || boundIdentity !== next)) {
        try { metrika()?.(METRIKA_ID, 'destruct') } catch { /* Analytics is optional. */ }
        initialized = false
    }
    identity = next
    if (analyticsExcluded(id)) { deferred.length = 0; return }
    for (const send of deferred.splice(0)) send()
}
function context() { return { account_id: identity ? `iv_user_${identity}` : 'anonymous', audience: identity ? 'customer' : 'guest' } }
function ready() {
    try {
    if (!production() || identity === undefined || analyticsExcluded(identity)) return false
    if (!metrika()) {
        const w = window as Window & { ym?: Ym }
        const queue: unknown[][] = []
        const stub = ((...args: unknown[]) => { queue.push(args) }) as Ym & { a: unknown[][]; l: number }
        stub.a = queue; stub.l = Date.now(); w.ym = stub
        const script = document.createElement('script')
        script.async = true; script.src = `https://mc.yandex.ru/metrika/tag.js?id=${METRIKA_ID}`
        document.head.appendChild(script)
    }
    if (!initialized) {
        // Manual pageviews only: no initial hit before resolving the account.
        metrika()!(METRIKA_ID, 'init', { defer: true, trackLinks: true, accurateTrackBounce: true, webvisor: false, clickmap: false })
        initialized = true; boundIdentity = identity
        if (identity) metrika()!(METRIKA_ID, 'setUserID', `iv_user_${identity}`)
    }
    return true
    } catch { return false }
}
export function trackPage(pathname: string) {
    if (!ready() || pathname.startsWith('/admin') || ['/grafana', '/metrics-login', '/oauth/callback', '/verify-email'].includes(pathname)) return
    try { metrika()!(METRIKA_ID, 'hit', window.location.origin + pathname, { params: context() }) } catch { /* Never interrupt navigation. */ }
}
/** Called by the rendered tariff page, not by background /offers requests. */
export function trackPricingView(page: 'pricing' | 'subscription' | 'pro_trial') {
    return reachGoal('pricing_view', { page })
}
export function reachGoal(goal: string, params: Record<string, string | number> = {}, dedupKey?: string) {
    if (!production() || analyticsExcluded(identity)) return false
    if (identity === undefined) { if (deferred.length < 50) deferred.push(() => { reachGoal(goal, params, dedupKey) }); return false }
    if (!ready()) return false
    const ym = metrika()!
    const key = dedupKey ? `iv:analytics:sent:${goal}:${dedupKey}` : ''
    if (key && (sent.has(key) || storageGet(key))) return true
    try {
        const event = { ...params, ...context() }
        // Parameters remain usable even before a new JS goal is created in Metrika.
        ym(METRIKA_ID, 'params', { product_funnel: { [goal]: event } })
        ym(METRIKA_ID, 'reachGoal', goal, event)
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
    setAnalyticsIdentity(id)
    reachGoal('registration_complete', { method }, `registration:${id}`)
}
export interface PendingPurchase { id: number; plan: PaymentPlan; owner: string; createdAt: number }
const pendingKey = 'iv:analytics:pending-purchases'
export function pendingPurchases(): PendingPurchase[] {
    try { return JSON.parse(storageGet(pendingKey) || '[]').filter((p: PendingPurchase) => PAYMENT_PLANS.includes(p.plan) && Number.isSafeInteger(p.id) && p.id > 0 && Date.now() - p.createdAt < 7 * 86400000) } catch { return [] }
}
export function checkoutStarted(id: number, plan: string, owner: string) {
    if (!PAYMENT_PLANS.includes(plan as PaymentPlan) || !Number.isSafeInteger(id) || id <= 0 || analyticsExcluded(owner)) return
    if (identity !== String(owner)) return
    storageSet(pendingKey, JSON.stringify([...pendingPurchases().filter(p => p.id !== id), { id, plan, owner, createdAt: Date.now() }]))
    reachGoal(plan === 'trial_3d' ? 'pro_trial_checkout' : 'subscription_checkout', { plan, invoice_id: id }, `checkout:${id}`)
    reachGoal('payment_redirect', { plan, invoice_id: id }, `redirect:${id}`)
}
export interface PaidReceipt { id: number; plan: string; amount: string; duration_days: number }
export function confirmPurchases(receipts: PaidReceipt[], owner: string) {
    if (analyticsExcluded(owner) || identity !== String(owner)) return
    const pending = pendingPurchases()
    const remaining = pending.filter(p => {
        if (p.owner !== owner) return true
        const receipt = receipts.find(r => Number(r.id) === p.id)
        if (!receipt) return true
        // Paid history is server-authoritative; don't trust the success URL or checkout amount.
        const actualPlan = receipt.plan === 'paid' ? ({30:'paid_1m',90:'paid_3m',180:'paid_6m',365:'paid_1y'} as Record<number,string>)[receipt.duration_days] : receipt.plan
        const amount = Number(receipt.amount)
        if (actualPlan !== p.plan || !Number.isFinite(amount) || amount <= 0) return true
        const general = reachGoal(p.plan === 'trial_3d' ? 'pro_trial_paid' : 'subscription_paid', { plan: p.plan, invoice_id: p.id, order_price: amount, currency: 'RUB' }, `purchase:${p.id}`)
        const specific = reachGoal(`subscription_${p.plan}`, { invoice_id: p.id, order_price: amount, currency: 'RUB' }, `purchase:${p.id}`)
        return !(general && specific)
    })
    storageSet(pendingKey, JSON.stringify(remaining))
}

if (typeof window !== 'undefined') {
    window.addEventListener?.('storage', event => {
        if (event.key === excludedDeviceKey && event.newValue === '1') setAnalyticsIdentity(identity || null)
    })
}
