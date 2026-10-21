import { useEffect, useRef } from 'react'
import { useAuthStore } from '../store/authStore'
import { trackPricingView } from '../lib/analytics'

/** One impression per rendered tariff page, after resolving the account. */
export function usePricingAnalytics(page: 'pricing' | 'subscription' | 'pro_trial') {
    const loading = useAuthStore(s => s.isLoading)
    const tracked = useRef(false)
    useEffect(() => {
        if (!loading && !tracked.current) tracked.current = trackPricingView(page)
    }, [loading, page])
}
