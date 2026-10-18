import { useEffect, useRef } from 'react'
import { createPaymentNavigation, type PaymentFormPayload } from '../lib/paymentNavigation'

export function usePaymentNavigation(onReturn: () => void) {
    const callback = useRef(onReturn)
    callback.current = onReturn
    const navigation = useRef<ReturnType<typeof createPaymentNavigation> | null>(null)
    useEffect(() => {
        navigation.current = createPaymentNavigation(() => callback.current())
        return () => { navigation.current?.dispose(); navigation.current = null }
    }, [])
    return (payment: PaymentFormPayload) => { navigation.current?.submit(payment) }
}
