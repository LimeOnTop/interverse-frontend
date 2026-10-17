const ACCESS_COOKIE = 'iv_access_token'
function tokenLifetime(token: string): number {
    try {
        const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
        return Number.isFinite(payload.exp) ? Math.max(0, Math.floor(payload.exp - Date.now() / 1000)) : 0
    } catch { return 0 }
}

export function syncAccessCookie(token: string | null) {
    if (typeof document === 'undefined') return

    if (!token) {
        document.cookie = `${ACCESS_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`
        return
    }

    // JWT is cookie-safe (base64url); avoid encodeURIComponent so nginx/Go see the raw token.
    const secure = window.location.protocol === 'https:' ? '; Secure' : ''
    document.cookie =
        `${ACCESS_COOKIE}=${token}; Path=/; Max-Age=${tokenLifetime(token)}; SameSite=Lax${secure}`
}
