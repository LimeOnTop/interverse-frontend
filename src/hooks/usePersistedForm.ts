import { useCallback, useEffect, useRef, useState } from 'react'
import type { FieldValues, UseFormWatch } from 'react-hook-form'

const PREFIX = 'iv:form:'

export function readFormDraft<T>(key: string): T | null {
    try {
        const raw = sessionStorage.getItem(PREFIX + key)
        if (!raw) return null
        return JSON.parse(raw) as T
    } catch {
        return null
    }
}

export function writeFormDraft(key: string, value: unknown) {
    try {
        sessionStorage.setItem(PREFIX + key, JSON.stringify(value))
    } catch {
        // quota / private mode
    }
}

export function clearFormDraft(key: string) {
    try {
        sessionStorage.removeItem(PREFIX + key)
    } catch {
        // ignore
    }
}

export function usePersistedState<T>(key: string, initial: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [state, setState] = useState<T>(() => readFormDraft<T>(key) ?? initial)

    useEffect(() => {
        writeFormDraft(key, state)
    }, [key, state])

    return [state, setState]
}

/** Persist a subset of react-hook-form values (never passwords). */
export function usePersistedRhfValues<T extends FieldValues>(
    key: string,
    watch: UseFormWatch<T>,
    pick: (values: T) => Record<string, unknown>,
) {
    const pickRef = useRef(pick)
    pickRef.current = pick

    useEffect(() => {
        const sub = watch((values) => {
            writeFormDraft(key, pickRef.current(values as T))
        })
        return () => sub.unsubscribe()
    }, [key, watch])
}

export function useClearFormDraft(key: string) {
    return useCallback(() => clearFormDraft(key), [key])
}
