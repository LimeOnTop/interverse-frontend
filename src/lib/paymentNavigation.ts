export type PaymentFormPayload = {
    action: string
    method?: string
    fields: Record<string, string>
}

/** A restored document keeps React state: release checkout only after returning from navigation. */
export function createPaymentNavigation(
    onReturn: () => void,
    target: Pick<Window, 'addEventListener' | 'removeEventListener'> = window,
    doc: Document = document,
) {
    let navigating = false
    let form: HTMLFormElement | null = null
    const removeForm = () => { form?.remove(); form = null }
    const returned = () => {
        if (!navigating) return
        navigating = false
        removeForm()
        onReturn()
    }
    target.addEventListener('pageshow', returned)
    return {
        submit(payment: PaymentFormPayload) {
            removeForm()
            form = doc.createElement('form')
            form.method = (payment.method || 'POST').toUpperCase() === 'GET' ? 'GET' : 'POST'
            form.action = payment.action
            form.acceptCharset = 'UTF-8'
            form.style.display = 'none'
            Object.entries(payment.fields).forEach(([name, value]) => {
                const input = doc.createElement('input')
                input.type = 'hidden'
                input.name = name
                input.value = String(value ?? '')
                form!.appendChild(input)
            })
            doc.body.appendChild(form)
            navigating = true
            try { form.submit() } catch (error) { returned(); throw error }
        },
        dispose() {
            target.removeEventListener('pageshow', returned)
            navigating = false
            removeForm()
        },
    }
}
