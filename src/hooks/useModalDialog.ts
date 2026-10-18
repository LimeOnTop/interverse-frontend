import { useEffect, useRef } from 'react'

/** Callers focus their trigger before opening; restore it after the portal unmounts. */
export function useModalDialog() {
    const dialog = useRef<HTMLDialogElement>(null)
    const opener = useRef<HTMLElement | null>(document.activeElement instanceof HTMLElement ? document.activeElement : null)
    useEffect(() => {
        const element = dialog.current
        element?.showModal()
        return () => {
            element?.close()
            requestAnimationFrame(() => {
                const target = opener.current
                if (target?.isConnected && target !== document.body) target.focus({ preventScroll: true })
                else {
                    const fallback = document.querySelector<HTMLElement>('[data-dialog-fallback], main h1, h1')
                    if (fallback) { fallback.tabIndex = -1; fallback.focus({ preventScroll: true }) }
                }
            })
        }
    }, [])
    return dialog
}
