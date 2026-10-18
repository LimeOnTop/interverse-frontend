import PreparationCreateDialog from '../components/PreparationCreateDialog'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '../services/api'
import { useAuthStore } from '../store/authStore'
import { resolveSubscriptionPlan } from '../utils/subscription'
import PageTransition from '../components/ui/PageTransition'
import VacancyCard, {
    inferLevel,
    normalizeSkill,
    vacancyRequirements,
    workMode,
    type VacancyCardData,
} from '../components/VacancyCard'
import { formatDay, levelLabel } from '../lib/dashboard'
import { usePersistedState } from '../hooks/usePersistedForm'

const PROFILE_SKILLS_HREF = '/profile?open=skills'
const POLL_INTERVAL_MS = 20_000

type SortMode = 'match' | 'recent' | 'salary'

interface JobFilters {
    query: string
    level: string
    mode: string
    scope: 'all' | 'saved'
    sort: SortMode
}

const DEFAULT_FILTERS: JobFilters = { query: '', level: 'all', mode: 'all', scope: 'all', sort: 'match' }

function parseSkills(raw: unknown): string[] {
    if (Array.isArray(raw)) return raw.map((item) => String(item ?? '').trim()).filter(Boolean)
    if (typeof raw !== 'string' || !raw.trim()) return []
    try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) return parsed.map((item) => String(item ?? '').trim()).filter(Boolean)
    } catch {
        /* comma-separated fallback */
    }
    return raw.split(',').map((item) => item.trim()).filter(Boolean)
}

function readSaved(key: string): Set<string> {
    try {
        const raw = localStorage.getItem(key)
        return new Set(raw ? (JSON.parse(raw) as string[]) : [])
    } catch {
        return new Set()
    }
}

interface VacanciesResponse {
    loading?: boolean
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
    const [ownVacancy,setOwnVacancy]=useState(false)
    const user = useAuthStore((s) => s.user)
    const hasPro = resolveSubscriptionPlan(user) === 'paid'
    const [loading, setLoading] = useState(true)
    const [retry, setRetry] = useState(0)
    const [error, setError] = useState<string | null>(null)
    const [profileReady, setProfileReady] = useState(false)
    const [items, setItems] = useState<VacancyCardData[]>([])
    const [queryText, setQueryText] = useState('')
    const [total, setTotal] = useState(0)
    const [sources, setSources] = useState<string[]>([])
    const [providerErrors, setProviderErrors] = useState<string[]>([])
    const [polling, setPolling] = useState(false)
    const [checkedAt, setCheckedAt] = useState<Date | null>(null)
    const [profileSkills, setProfileSkills] = useState<string[]>([])
    const [filters, setFilters] = usePersistedState<JobFilters>('vacancies-filters', DEFAULT_FILTERS)
    const savedKey = `vacancies-saved:${user?.id ?? 'anon'}`
    const [saved, setSaved] = useState<Set<string>>(() => readSaved(savedKey))

    const setFilter = <K extends keyof JobFilters>(key: K, value: JobFilters[K]) =>
        setFilters((prev) => ({ ...DEFAULT_FILTERS, ...prev, [key]: value }))

    useEffect(() => {
        if (!hasPro || !user?.id) return
        let cancelled = false
        api.get(`/users/${user.id}/profile`)
            .then(({ data }) => {
                if (!cancelled) setProfileSkills(parseSkills(data?.profile?.skills))
            })
            .catch(() => {
                /* the stack row falls back to the search query */
            })
        return () => {
            cancelled = true
        }
    }, [hasPro, user?.id])

    useEffect(() => {
        if (!hasPro) {
            setLoading(false)
            return
        }

        let cancelled = false
        const controller = new AbortController()
        let pause: ReturnType<typeof setTimeout> | undefined
        ;(async () => {
            setLoading(true)
            setError(null)
            try {
                for (let attempt = 0; attempt < 20 && !cancelled; attempt++) {
                    const { data } = await api.get<VacanciesResponse>('/vacancies/', {
                        params: { page: 0, per_page: 24 }, signal: controller.signal,
                    })
                    if (cancelled) return
                    setProfileReady(Boolean(data.profile_ready))
                    setQueryText(data.query_text ?? '')
                    if (data.loading) {
                        await new Promise<void>(resolve => {
                            pause = setTimeout(resolve, 3000)
                            controller.signal.addEventListener('abort', () => resolve(), { once: true })
                        })
                        continue
                    }
                    const list = data.items ?? []
                    setItems(list)
                    setTotal(data.total ?? list.length)
                    setSources(data.sources ?? [])
                    setProviderErrors(data.errors ?? [])
                    setCheckedAt(new Date())
                    return
                }
                if (!cancelled) setError('Подборка ещё готовится. Повтори проверку через несколько секунд.')
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
            controller.abort()
            if (pause) clearTimeout(pause)
        }
    }, [hasPro, user?.id, retry])

    useEffect(() => {
        if (!hasPro || !profileReady || loading || error) return

        let cancelled = false
        let inFlight = false
        const poll = async () => {
            if (inFlight || document.hidden) return
            inFlight = true
            try {
                setPolling(true)
                const { data } = await api.get<VacanciesResponse>('/vacancies/', {
                    params: { page: 0, per_page: 24 },
                })
                if (cancelled) return
                if (data.loading) return
                const list = data.items ?? []
                setProfileReady(Boolean(data.profile_ready))
                setQueryText(data.query_text ?? '')
                setTotal(data.total ?? list.length)
                setSources(data.sources ?? [])
                setProviderErrors(data.errors ?? [])
                setCheckedAt(new Date())
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
                inFlight = false
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

    const fallbackSkills = useMemo(
        () => queryText.split(/\s+/).map((item) => item.trim()).filter(Boolean),
        [queryText],
    )
    const stack = profileSkills.length > 0 ? profileSkills : fallbackSkills
    const stackSet = useMemo(() => new Set(stack.map(normalizeSkill)), [stack])

    const toggleSaved = (id: string) => {
        setSaved((prev) => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            try {
                localStorage.setItem(savedKey, JSON.stringify([...next]))
            } catch {
                /* favourites stay for this visit only */
            }
            return next
        })
    }

    const f = { ...DEFAULT_FILTERS, ...filters }
    const visible = useMemo(() => {
        const query = f.query.toLowerCase().trim()
        const matchRatio = (v: VacancyCardData) => {
            const { complete, required, matched } = vacancyRequirements(v, stackSet, fallbackSkills)
            return (complete ? 1 : 0) + (required.length ? matched.length / required.length : 0)
        }
        const salary = (v: VacancyCardData) => v.salary_from ?? v.salary_to ?? -1
        const published = (v: VacancyCardData) => (v.published_at ? new Date(v.published_at).getTime() || 0 : 0)
        return items
            .filter((v) => {
                if (f.scope === 'saved' && !saved.has(v.id)) return false
                if (f.level !== 'all' && inferLevel(v.experience) !== f.level) return false
                if (f.mode !== 'all' && workMode(v.schedule) !== f.mode) return false
                if (!query) return true
                return [v.title, v.company_name, v.area, ...(v.skills ?? [])].join(' ').toLowerCase().includes(query)
            })
            .map((v, order) => ({ v, order }))
            .sort((a, b) => {
                if (f.sort === 'recent') return published(b.v) - published(a.v) || a.order - b.order
                if (f.sort === 'salary') return salary(b.v) - salary(a.v) || a.order - b.order
                return matchRatio(b.v) - matchRatio(a.v) || a.order - b.order
            })
            .map(({ v }) => v)
    }, [items, saved, stackSet, fallbackSkills, f.query, f.level, f.mode, f.scope, f.sort])

    const head = (
        <>
        {ownVacancy && <PreparationCreateDialog vacancy={{id:'manual',source:'manual',source_label:'Своя вакансия',title:'',url:'',skills:[]}} onClose={()=>setOwnVacancy(false)} />}
        <header className="library-head">
            <div>
                <span className="lib-eyebrow">Карьера / следующий шаг</span>
                <h1>Вакансии и подготовка</h1>
                <p>Посмотри требования. Выбери, к какой роли готовиться дальше.</p>
            </div>
            {hasPro && <button type="button" className="lib-btn is-primary" onClick={event=>{event.currentTarget.focus();setOwnVacancy(true)}}>Подготовиться к своей вакансии</button>}
            {hasPro && checkedAt && (
                <span className="lib-chip">{polling ? 'Обновляем…' : `Проверено ${formatDay(checkedAt.toISOString(), false)}`}</span>
            )}
        </header>
        </>
    )

    if (!hasPro) {
        return (
            <PageTransition>
                {head}
                <section className="collection-empty">
                    <h3>Подбор вакансий доступен в Pro</h3>
                    <p>В Pro мы собираем актуальные вакансии по навыкам из твоего профиля, показываем совпадение стека и запускаем тренировку по технологиям вакансии.</p>
                    <div className="actions">
                        <Link to="/subscription" className="lib-btn is-primary">Перейти на Pro <ArrowRight /></Link>
                    </div>
                </section>
            </PageTransition>
        )
    }

    return (
        <PageTransition>
            {head}

                            <div className="list-controls">
                                <div className="search-wrap">
                                    <Search aria-hidden="true" strokeWidth={1.75} />
                                    <input
                                        type="search"
                                        aria-label="Поиск вакансий"
                                        placeholder="Роль, технология, компания или город"
                                        value={f.query}
                                        onChange={(e) => setFilter('query', e.target.value)}
                                    />
                                </div>
                                <select aria-label="Уровень вакансий" value={f.level} onChange={(e) => setFilter('level', e.target.value)}>
                                    <option value="all">Все уровни</option>
                                    {['intern', 'junior', 'middle', 'senior'].map((level) => (
                                        <option key={level} value={level}>{levelLabel(level)}</option>
                                    ))}
                                </select>
                                <select aria-label="Формат работы" value={f.mode} onChange={(e) => setFilter('mode', e.target.value)}>
                                    <option value="all">Любой формат</option>
                                    <option value="remote">Удалённо</option>
                                    <option value="hybrid">Гибрид</option>
                                    <option value="office">Офис</option>
                                </select>
                            </div>


            {loading && (
                <section aria-busy="true" aria-label="Загрузка вакансий">
                    <p role="status" className="text-secondary mb-4">Подбираем вакансии по твоему стеку…</p>
                    <div className="job-collection" aria-hidden="true">
                        {[0, 1, 2, 3].map(index => <div key={index} className="job-card min-h-[260px]">
                            <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                            <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mt-6" />
                            <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded mt-3" />
                            <div className="h-16 bg-gray-100 dark:bg-gray-800 rounded mt-6" />
                        </div>)}
                    </div>
                </section>
            )}

            {!loading && error && (
                <section className="collection-empty">
                    <h3>Не удалось загрузить вакансии</h3>
                    <p>{error}</p>
                    <div className="actions">
                        <button type="button" className="lib-btn" onClick={() => setRetry(n => n + 1)}>Повторить</button>
                    </div>
                </section>
            )}

            {!loading && !error && !profileReady && (
                <section className="collection-empty">
                    <h3>Добавь навыки в профиль</h3>
                    <p>Вакансии подбираются по технологиям из формы «Навыки». Укажи стек — и мы найдём подходящие предложения.</p>
                    <div className="actions">
                        <Link to={PROFILE_SKILLS_HREF} className="lib-btn is-primary">Указать навыки <ArrowRight /></Link>
                    </div>
                </section>
            )}

            {!loading && !error && profileReady && (
                <>
                    <section className="opportunity-profile">
                        <div className="profile-stack">
                            <span className="lib-eyebrow">Твой стек</span>
                            {stack.slice(0, 12).map((skill) => (
                                <span key={skill} className="lib-chip">{skill}</span>
                            ))}
                        </div>
                        <Link to={PROFILE_SKILLS_HREF} className="lib-textbtn">Изменить навыки →</Link>
                    </section>

                    {items.length === 0 ? (
                        <section className="collection-empty">
                            <h3>Вакансии не найдены</h3>
                            <p>
                                {queryText
                                    ? `По навыкам «${queryText}» ничего не нашлось${providerErrors.length ? ` (${providerErrors.join('; ')})` : ''}. Обнови навыки или попробуй позже.`
                                    : 'По навыкам из профиля вакансии пока не найдены.'}
                            </p>
                            <div className="actions">
                                <Link to={PROFILE_SKILLS_HREF} className="lib-btn">Изменить навыки</Link>
                            </div>
                        </section>
                    ) : (
                        <>
                            <div className="collection-heading">
                                <h2>Подборка <span>· {visible.length}</span></h2>
                                <div className="row">
                                    <button
                                        type="button"
                                        className="lib-textbtn"
                                        aria-pressed={f.scope === 'saved'}
                                        onClick={() => setFilter('scope', f.scope === 'all' ? 'saved' : 'all')}
                                    >
                                        {f.scope === 'all' ? `Избранное${saved.size ? ` · ${saved.size}` : ''}` : 'Все вакансии'}
                                    </button>
                                    <select
                                        className="lib-select"
                                        aria-label="Сортировка вакансий"
                                        value={f.sort}
                                        onChange={(e) => setFilter('sort', e.target.value as SortMode)}
                                    >
                                        <option value="match">По совпадению стека</option>
                                        <option value="recent">Сначала новые</option>
                                        <option value="salary">По зарплате</option>
                                    </select>
                                </div>
                            </div>
                            <div className="job-legend"><span>Есть в твоём профиле</span><span>Можно добавить в подготовку</span></div>

                            {visible.length === 0 ? (
                                <section className="collection-empty">
                                    <h3>{f.scope === 'saved' && saved.size === 0 ? 'В избранном пока пусто' : 'В этой подборке ничего не найдено'}</h3>
                                    <p>{f.scope === 'saved' && saved.size === 0 ? 'Отмечай вакансии звёздочкой, чтобы вернуться к ним позже.' : 'Измени фильтры или вернись ко всем вакансиям.'}</p>
                                    <div className="actions">
                                        <button type="button" className="lib-textbtn" onClick={() => setFilters(DEFAULT_FILTERS)}>Сбросить фильтры</button>
                                    </div>
                                </section>
                            ) : (
                                <div className="job-collection">
                                    {visible.map((vacancy, index) => (
                                        <VacancyCard
                                            key={vacancy.id}
                                            vacancy={vacancy}
                                            index={index}
                                            profileSkills={stackSet}
                                            fallbackSkills={fallbackSkills}
                                            saved={saved.has(vacancy.id)}
                                            onToggleSave={() => toggleSaved(vacancy.id)}
                                        />
                                    ))}
                                </div>
                            )}

                            <p className="job-info-note">
                                {items.length} из {Math.max(total, items.length).toLocaleString('ru-RU')} по навыкам «{queryText}»
                                {sources.length > 0 ? ` · источники: ${sources.join(', ')}` : ''}. Совпадение считается по техническим
                                навыкам: число навыков из профиля / число показанных требований. Это не оценка готовности к работе.
                                Полное описание и условия — у источника.
                            </p>
                        </>
                    )}
                </>
            )}
        </PageTransition>
    )
}
