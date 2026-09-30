const ACCESS_COOKIE = 'iv_access_token'
const ACCESS_COOKIE_MAX_AGE_SEC = 60 * 60 * 12 // 12h — covers Grafana sessions between refreshes

export function syncAccessCookie(token: string | null) {
    if (typeof document === 'undefined') return

    if (!token) {
        document.cookie = `${ACCESS_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`
        return
    }

    // JWT is cookie-safe (base64url); avoid encodeURIComponent so nginx/Go see the raw token.
    const secure = window.location.protocol === 'https:' ? '; Secure' : ''
    document.cookie =
        `${ACCESS_COOKIE}=${token}; Path=/; Max-Age=${ACCESS_COOKIE_MAX_AGE_SEC}; SameSite=Lax${secure}`
}
