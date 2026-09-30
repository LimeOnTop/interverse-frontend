import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '../services/api'
import { useAuthStore } from '../store/authStore'
import { resolveSubscriptionPlan } from '../utils/subscription'
import PageHeader from '../components/ui/PageHeader'
import PageTransition from '../components/ui/PageTransition'
import EmptyState from '../components/ui/EmptyState'
import Spinner from '../components/ui/Spinner'
import Button from '../components/ui/Button'
import VacancyCard, { type VacancyCardData } from '../components/VacancyCard'

const PROFILE_SKILLS_HREF = '/profile?open=skills'
const POLL_INTERVAL_MS = 20_000

interface VacanciesResponse {
    profile_ready: boolean
    query_text?: string
    items?: VacancyCardData[]
    page?: number
    per_page?: number
    total?: number
    sources?: string[]
    errors?: string[]
}

function mergeVacancyCards(prev: VacancyCardData[], next: VacancyCardData[]): {
    items: VacancyCardData[]
    added: number
} {
    const prevIds = new Set(prev.map((item) => item.id))
    const addedItems = next.filter((item) => item.id && !prevIds.has(item.id))
    if (addedItems.length === 0 && next.length === 0) {
        return { items: prev, added: 0 }
    }

    const byId = new Map<string, VacancyCardData>()
    for (const item of [...addedItems, ...prev, ...next]) {
        if (!item.id || byId.has(item.id)) continue
        byId.set(item.id, item)
    }

    // Keep newly discovered cards first, then previous order for the rest.
    const items: VacancyCardData[] = []
    for (const item of addedItems) {
        const current = byId.get(item.id)
        if (current) items.push(current)
        byId.delete(item.id)
    }
    for (const item of prev) {
        const current = byId.get(item.id)
        if (!current) continue
        items.push(current)
        byId.delete(item.id)
    }
    for (const item of byId.values()) {
        items.push(item)
    }
    return { items, added: addedItems.length }
}

export default function VacanciesPage() {
    const user = useAuthStore((s) => s.user)
    const hasPro = resolveSubscriptionPlan(user) === 'paid'
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [profileReady, setProfileReady] = useState(false)
    const [items, setItems] = useState<VacancyCardData[]>([])
    const [queryText, setQueryText] = useState('')
    const [total, setTotal] = useState(0)
    const [sources, setSources] = useState<string[]>([])
    const [providerErrors, setProviderErrors] = useState<string[]>([])
    const [polling, setPolling] = useState(false)

    useEffect(() => {
        if (!hasPro) {
            setLoading(false)
            return
        }

        let cancelled = false
        ;(async () => {
            setLoading(true)
            setError(null)
            try {
                const { data } = await api.get<VacanciesResponse>('/vacancies/', {
                    params: { page: 0, per_page: 24 },
                })
                if (cancelled) return
                const list = data.items ?? []
                setProfileReady(Boolean(data.profile_ready))
                setItems(list)
                setQueryText(data.query_text ?? '')
                setTotal(data.total ?? list.length)
                setSources(data.sources ?? [])
                setProviderErrors(data.errors ?? [])
            } catch (err: unknown) {
                if (cancelled) return
                const message =
                    (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
                    'Не удалось загрузить вакансии'
                setError(message)
            } finally {
                if (!cancelled) setLoading(false)
            }
        })()
        return () => {
            cancelled = true
        }
    }, [hasPro])

    useEffect(() => {
        if (!hasPro || !profileReady || loading || error) return

        let cancelled = false
        const poll = async () => {
            try {
                setPolling(true)
                const { data } = await api.get<VacanciesResponse>('/vacancies/', {
                    params: { page: 0, per_page: 24 },
                })
                if (cancelled) return
                const list = data.items ?? []
                setProfileReady(Boolean(data.profile_ready))
                setQueryText(data.query_text ?? '')
                setTotal(data.total ?? list.length)
                setSources(data.sources ?? [])
                setProviderErrors(data.errors ?? [])
                setItems((prev) => {
                    const { items: merged, added } = mergeVacancyCards(prev, list)
                    if (added > 0) {
                        toast.success(
                            added === 1 ? 'Добавлена 1 новая вакансия' : `Добавлено новых вакансий: ${added}`,
                            { id: 'vacancy-new' },
                        )
                    }
                    return merged
                })
            } catch {
                // Keep showing cached cards; silent on background poll errors.
            } finally {
                if (!cancelled) setPolling(false)
            }
        }

        const timer = window.setInterval(() => {
            void poll()
        }, POLL_INTERVAL_MS)

        return () => {
            cancelled = true
            window.clearInterval(timer)
        }
    }, [hasPro, profileReady, loading, error])

    const fallbackSkills = queryText
        .split(/\s+/)
        .map((item) => item.trim())
        .filter(Boolean)

    return (
        <PageTransition className="space-y-8">
            <PageHeader
                title="Вакансии"
                description="Актуальные вакансии по навыкам из вашего профиля"
            />

            {!hasPro && (
                <EmptyState
                    icon={Briefcase}
                    title="Поиск вакансий недоступен"
                    description={
                        <>
                            Поиск вакансий недоступен в базовой версии. Перейдите на{' '}
                            <span className="font-medium text-inter-verse-green dark:text-purple-400">
                                Pro версию
                            </span>
                            , чтобы подбирать актуальные предложения по навыкам из профиля.
                        </>
                    }
                    action={
                        <Link to="/subscription">
                            <Button variant="primary">Перейти на Pro версию</Button>
                        </Link>
                    }
                />
            )}

            {hasPro && loading && (
                <div className="flex justify-center py-16">
                    <Spinner />
                </div>
            )}

            {hasPro && !loading && error && (
                <EmptyState
                    icon={Briefcase}
                    title="Ошибка загрузки"
                    description={error}
                />
            )}

            {hasPro && !loading && !error && !profileReady && (
                <EmptyState
                    icon={Sparkles}
                    title="Добавьте навыки в профиль"
                    description="Вакансии подбираются по технологиям из формы «Навыки». Укажите стек — и мы найдём подходящие предложения."
                    action={
                        <Link to={PROFILE_SKILLS_HREF}>
                            <Button variant="primary">Указать навыки</Button>
                        </Link>
                    }
                />
            )}

            {hasPro && !loading && !error && profileReady && items.length === 0 && (
                <EmptyState
                    icon={Briefcase}
                    title="Вакансии не найдены"
                    description={
                        queryText
                            ? `По навыкам «${queryText}» ничего не нашлось${providerErrors.length ? ` (${providerErrors.join('; ')})` : ''}. Обновите навыки или попробуйте позже.`
                            : 'По навыкам из профиля вакансии пока не найдены.'
                    }
                    action={
                        <Link to={PROFILE_SKILLS_HREF}>
                            <Button variant="secondary">Изменить навыки</Button>
                        </Link>
                    }
                />
            )}

            {hasPro && !loading && !error && profileReady && items.length > 0 && (
                <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-secondary">
                        <p>
                            Найдено по навыкам{' '}
                            <span className="font-medium text-gray-800 dark:text-gray-200">«{queryText}»</span>
                            {total > 0 ? ` · ${total.toLocaleString('ru-RU')}` : ''}
                            {polling ? ' · обновление…' : ''}
                        </p>
                        {sources.length > 0 && (
                            <p>Источники: {sources.join(', ')}</p>
                        )}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 items-stretch">
                        {items.map((vacancy) => (
                            <VacancyCard
                                key={vacancy.id}
                                vacancy={vacancy}
                                fallbackSkills={fallbackSkills}
                            />
                        ))}
                    </div>
                </div>
            )}
        </PageTransition>
    )
}
