import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import PageHeader from '../../components/ui/PageHeader'
import PageTransition from '../../components/ui/PageTransition'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import ModernSelect from '../../components/ModernSelect'
import { usePersistedState } from '../../hooks/usePersistedForm'
import { api } from '../../services/api'
import { HelpCircle } from 'lucide-react'

export interface QuestionOption {
    id?: string
    text: string
    is_correct: boolean
    sort_order?: number
}

export interface AdminQuestion {
    id: string
    text: string
    category: string
    difficulty: string
    technology: string
    tags?: string[]
    answer: string
    options?: QuestionOption[]
    created_at?: string
    updated_at?: string
}

const PAGE_SIZE = 50

const difficultyOptions = [
    { value: '', label: 'Все уровни' },
    { value: 'junior', label: 'Junior' },
    { value: 'middle', label: 'Middle' },
    { value: 'senior', label: 'Senior' },
    { value: 'pending_moderation', label: 'На модерации' },
]

const difficultyBadge: Record<string, 'default' | 'success' | 'warning' | 'accent'> = {
    junior: 'success',
    middle: 'warning',
    senior: 'accent',
    pending_moderation: 'default',
}

export default function AdminQuestionsPage() {
    const navigate = useNavigate()
    const [technology, setTechnology] = usePersistedState('admin-questions-technology', '')
    const [difficulty, setDifficulty] = usePersistedState('admin-questions-difficulty', '')
    const [technologyOptions, setTechnologyOptions] = useState([{ value: '', label: 'Все направления' }])
    const [questions, setQuestions] = useState<AdminQuestion[]>([])
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)

    useEffect(() => {
        ;(async () => {
            try {
                const { data } = await api.get('/technologies/', { params: { page: 1, limit: 100 } })
                const list = (data.technologies || data.Technologies || []).map((item: any) => ({
                    value: item.name || item.Name || item.title || '',
                    label: item.name || item.Name || item.title || '',
                })).filter((item: { value: string }) => item.value)
                setTechnologyOptions([{ value: '', label: 'Все направления' }, ...list, { value: 'Go', label: 'Go' }])
            } catch {
                setTechnologyOptions([
                    { value: '', label: 'Все направления' },
                    { value: 'Go', label: 'Go' },
                ])
            }
        })()
    }, [])

    const loadPage = useCallback(
        async (nextPage: number, append: boolean) => {
            try {
                if (append) setLoadingMore(true)
                else setLoading(true)

                const { data } = await api.get('/admin/questions', {
                    params: {
                        page: nextPage,
                        limit: PAGE_SIZE,
                        ...(technology ? { technology } : {}),
                        ...(difficulty ? { difficulty } : {}),
                    },
                })

                const items: AdminQuestion[] = data.questions || []
                const nextTotal = data.pagination?.total ?? items.length
                setTotal(nextTotal)
                setPage(nextPage)
                setQuestions((prev) => (append ? [...prev, ...items] : items))
            } catch (error: any) {
                toast.error(error.response?.data?.error || 'Не удалось загрузить вопросы')
            } finally {
                setLoading(false)
                setLoadingMore(false)
            }
        },
        [technology, difficulty]
    )

    useEffect(() => {
        loadPage(1, false)
    }, [loadPage])

    const hasMore = questions.length < total

    // Deduplicate technology options
    const uniqueTechOptions = technologyOptions.filter(
        (option, index, arr) => arr.findIndex((item) => item.value === option.value) === index
    )

    return (
        <PageTransition>
            <PageHeader
                title="Вопросы"
                description="Фильтруйте банк и редактируйте формулировки, ответы, направление и сложность"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                    <label className="block text-xs font-medium uppercase tracking-wide text-secondary mb-2">
                        Направление
                    </label>
                    <ModernSelect
                        options={uniqueTechOptions}
                        value={technology}
                        onChange={setTechnology}
                        placeholder="Все направления"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium uppercase tracking-wide text-secondary mb-2">
                        Сложность
                    </label>
                    <ModernSelect
                        options={difficultyOptions}
                        value={difficulty}
                        onChange={setDifficulty}
                        placeholder="Все уровни"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-16">
                    <Spinner />
                </div>
            ) : questions.length === 0 ? (
                <EmptyState
                    icon={HelpCircle}
                    title="Вопросов не найдено"
                    description="Измените фильтры или дождитесь новых предложений"
                />
            ) : (
                <>
                    <p className="text-sm text-secondary mb-4">
                        Показано {questions.length} из {total}
                    </p>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {questions.map((question) => (
                            <Card
                                key={question.id}
                                hover
                                padding="md"
                                onClick={() => navigate(`/admin/questions/${question.id}`)}
                            >
                                <div className="flex flex-wrap gap-2 mb-3">
                                    <Badge variant="default">{question.technology || '—'}</Badge>
                                    <Badge variant={difficultyBadge[question.difficulty] || 'default'}>
                                        {question.difficulty || '—'}
                                    </Badge>
                                    {question.category && (
                                        <Badge variant="default">{question.category}</Badge>
                                    )}
                                </div>
                                <p className="text-sm text-gray-900 dark:text-gray-100 line-clamp-3 leading-relaxed">
                                    {question.text}
                                </p>
                            </Card>
                        ))}
                    </div>

                    {hasMore && (
                        <div className="flex justify-center mt-8">
                            <Button
                                type="button"
                                variant="secondary"
                                loading={loadingMore}
                                onClick={() => loadPage(page + 1, true)}
                            >
                                Загрузить ещё 50
                            </Button>
                        </div>
                    )}
                </>
            )}
        </PageTransition>
    )
}
