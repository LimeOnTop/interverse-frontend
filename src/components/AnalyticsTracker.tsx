import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { api } from '../services/api'
import { confirmPurchases, pendingPurchases, trackPage, setAnalyticsIdentity } from '../lib/analytics'

export default function AnalyticsTracker() {
    const lastPage = useRef('')
    const { pathname } = useLocation()
    const userId = useAuthStore(s => s.user?.id)
    const isLoading = useAuthStore(s => s.isLoading)
    useEffect(() => {
        if (isLoading) return
        setAnalyticsIdentity(userId ? String(userId) : null)
        const key = `${pathname}:${userId || 'guest'}`
        if (lastPage.current === key) return
        trackPage(pathname)
        lastPage.current = key
    }, [pathname, userId, isLoading])
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
