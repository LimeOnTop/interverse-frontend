/** Delete only this app's private caches, preserving appearance preferences. */
export function clearPrivateStorage() {
    for (const name of ['localStorage', 'sessionStorage'] as const) {
        try {
            const storage = globalThis[name]
            const keys: string[] = []
            for (let i = 0; i < storage.length; i++) {
                const key = storage.key(i)
                if (key && (key.startsWith('iv:form:') || key.startsWith('interview-session-') || key.startsWith('interview-answers-') || key === 'iv-design-training')) keys.push(key)
            }
            for (const key of keys) storage.removeItem(key)
        } catch { /* Unavailable storage must not prevent logout. */ }
    }
}

export const PRIVATE_CACHE_TTL = 24 * 60 * 60 * 1000
export function tokenUser(token: string | null): string | null {
    try {
        const id = JSON.parse(atob((token || '').split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).user_id
        return typeof id === 'number' || typeof id === 'string' ? String(id) : null
    } catch { return null }
}
export function privateStorageOwner(): string {
    try { return tokenUser(JSON.parse(localStorage.getItem('auth-storage') || '{}').state?.accessToken) || 'anonymous' } catch { return 'anonymous' }
}
export function writePrivateCache(storage: Storage, key: string, value: unknown) {
    if (key.startsWith('interview-') && privateStorageOwner() === 'anonymous') return
    try { storage.setItem(key, JSON.stringify({ expiresAt: Date.now() + PRIVATE_CACHE_TTL, value })) } catch { /* Storage can be unavailable. */ }
}
export function readPrivateCache<T>(storage: Storage, key: string): T | null {
    try {
        const raw = storage.getItem(key)
        if (!raw) return null
        const record = JSON.parse(raw)
        if (!Number.isFinite(record.expiresAt) || record.expiresAt <= Date.now()) {
            storage.removeItem(key)
            return null
        }
        return record.value as T
    } catch { return null }
}
