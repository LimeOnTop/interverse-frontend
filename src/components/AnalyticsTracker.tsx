import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { api } from '../services/api'
import { confirmPurchases, pendingPurchases, METRIKA_ID } from '../lib/analytics'

export default function AnalyticsTracker() {
    const firstPage = useRef(true)
    const { pathname } = useLocation()
    const userId = useAuthStore(s => s.user?.id)
    useEffect(() => {
        if (!['inter-verse.ru', 'www.inter-verse.ru'].includes(window.location.hostname)) return
        if (firstPage.current) { firstPage.current = false; return }
        // Pageviews contain the route only; OAuth and verification URL parameters stay private.
        const ym = (window as Window & { ym?: (...args: unknown[]) => void }).ym
        ym?.(METRIKA_ID, 'hit', window.location.origin + pathname)
    }, [pathname])
    useEffect(() => {
        if (!userId || !pendingPurchases().some(p => p.owner === String(userId))) return
        let cancelled = false
        let timer: ReturnType<typeof setTimeout>
        let attempts = 0
        const check = async () => {
            try {
                const { data } = await api.get('/payments/history')
                if (!cancelled) confirmPurchases(data.payments || [], String(userId))
            } catch { /* Retry pending confirmations; never count an unconfirmed payment. */ }
            if (!cancelled && ++attempts < 20 && pendingPurchases().some(p => p.owner === String(userId))) timer = setTimeout(check, 15000)
        }
        void check()
        return () => { cancelled = true; clearTimeout(timer) }
    }, [userId, pathname])
    return null
}
