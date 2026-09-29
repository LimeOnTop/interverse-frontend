import { useEffect, useState } from 'react'
import { api } from '../services/api'

interface SearchHit {
    id?: string
    name: string
}

export function useTechnologySearch(searchTerm: string, limit = 24) {
    const trimmedSearch = searchTerm.trim()
    const isSearchActive = trimmedSearch.length >= 2
    const [searchResults, setSearchResults] = useState<string[]>([])
    const [isSearching, setIsSearching] = useState(false)

    useEffect(() => {
        if (!isSearchActive) {
            setSearchResults([])
            setIsSearching(false)
            return
        }

        const controller = new AbortController()
        const timeoutId = window.setTimeout(async () => {
            setIsSearching(true)
            try {
                const { data } = await api.get('/technologies/search', {
                    params: { q: trimmedSearch, limit, page: 1 },
                    signal: controller.signal,
                })
                const hits: SearchHit[] = data?.technologies ?? []
                const names = hits
                    .map((item) => item.name)
                    .filter((name): name is string => Boolean(name))
                setSearchResults(Array.from(new Set(names)))
            } catch (error) {
                if ((error as { code?: string; name?: string })?.code === 'ERR_CANCELED' ||
                    (error as { name?: string })?.name === 'CanceledError') {
                    return
                }
                console.error('Technology search failed:', error)
                setSearchResults([])
            } finally {
                setIsSearching(false)
            }
        }, 300)

        return () => {
            controller.abort()
            window.clearTimeout(timeoutId)
        }
    }, [trimmedSearch, isSearchActive, limit])

    return {
        trimmedSearch,
        isSearchActive,
        searchResults,
        isSearching,
    }
}
