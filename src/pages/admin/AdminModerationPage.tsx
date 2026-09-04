import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ClipboardCheck, HelpCircle } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import PageTransition from '../../components/ui/PageTransition'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import { api } from '../../services/api'
import type { AdminQuestion } from './AdminQuestionsPage'

const PAGE_SIZE = 50

export default function AdminModerationPage() {
    const navigate = useNavigate()
    const [questions, setQuestions] = useState<AdminQuestion[]>([])
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)

    const loadPage = useCallback(async (nextPage: number, append: boolean) => {
        try {
            if (append) setLoadingMore(true)
            else setLoading(true)

            const { data } = await api.get('/admin/moderation/questions', {
                params: { page: nextPage, limit: PAGE_SIZE },
            })

            const items: AdminQuestion[] = data.questions || []
            const nextTotal = data.pagination?.total ?? items.length
            setTotal(nextTotal)
            setPage(nextPage)
            setQuestions((prev) => (append ? [...prev, ...items] : items))
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Не удалось загрузить очередь модерации')
        } finally {
            setLoading(false)
            setLoadingMore(false)
        }
    }, [])

    useEffect(() => {
        loadPage(1, false)
    }, [loadPage])

    const contributorTag = (question: AdminQuestion) =>
        (question.tags || []).find((tag) => tag.startsWith('user:'))?.replace('user:', 'user ') || null

    const hasMore = questions.length < total

    return (
        <PageTransition>
            <PageHeader
                title="Модерация"
                description="Вопросы, отправленные пользователями. Одобрите подходящие или отклоните."
            />

            {loading ? (
                <div className="flex justify-center py-16">
                    <Spinner />
                </div>
            ) : questions.length === 0 ? (
                <EmptyState
                    icon={ClipboardCheck}
                    title="Очередь пуста"
                    description="Новые предложения появятся здесь после отправки со страницы «Предложить вопрос»"
                />
            ) : (
                <>
                    <p className="text-sm text-secondary mb-4">
                        В очереди: {total}. Показано {questions.length}
                    </p>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {questions.map((question) => (
                            <Card
                                key={question.id}
                                hover
                                padding="md"
                                onClick={() => navigate(`/admin/moderation/${question.id}`)}
                            >
                                <div className="flex flex-wrap gap-2 mb-3">
                                    <Badge variant="warning">На модерации</Badge>
                                    <Badge variant="default">{question.technology || '—'}</Badge>
                                    {contributorTag(question) && (
                                        <Badge variant="info">{contributorTag(question)}</Badge>
                                    )}
                                </div>
                                <p className="text-sm text-gray-900 dark:text-gray-100 line-clamp-3 leading-relaxed mb-3">
                                    {question.text}
                                </p>
                                {question.answer && question.answer !== 'Ожидает модерации' && (
                                    <p className="text-xs text-secondary line-clamp-2">
                                        Ответ: {question.answer}
                                    </p>
                                )}
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
                                <HelpCircle className="w-4 h-4" />
                                Загрузить ещё
                            </Button>
                        </div>
                    )}
                </>
            )}
        </PageTransition>
    )
}
