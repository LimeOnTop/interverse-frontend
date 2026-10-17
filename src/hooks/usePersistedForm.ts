import { useCallback, useEffect, useRef, useState } from 'react'
import type { FieldValues, UseFormWatch } from 'react-hook-form'

import { privateStorageOwner, readPrivateCache, writePrivateCache } from '../lib/privateStorage'

const draftKey = (key: string) => `iv:form:${privateStorageOwner()}:${key}`

export function readFormDraft<T>(key: string): T | null {
    return readPrivateCache<T>(sessionStorage, draftKey(key))
}

export function writeFormDraft(key: string, value: unknown) {
    writePrivateCache(sessionStorage, draftKey(key), value)
}

export function clearFormDraft(key: string) {
    try {
        sessionStorage.removeItem(draftKey(key))
    } catch {
        // ignore
    }
}

export function usePersistedState<T>(key: string, initial: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const owner = useRef(privateStorageOwner())
    const [state, setState] = useState<T>(() => readFormDraft<T>(key) ?? initial)

    useEffect(() => {
        if (owner.current === privateStorageOwner()) writeFormDraft(key, state)
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
        const owner = privateStorageOwner()
        const sub = watch((values) => {
            if (owner === privateStorageOwner()) writeFormDraft(key, pickRef.current(values as T))
        })
        return () => sub.unsubscribe()
    }, [key, watch])
}

export function useClearFormDraft(key: string) {
    return useCallback(() => clearFormDraft(key), [key])
}
