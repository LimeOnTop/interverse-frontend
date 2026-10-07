import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ArrowLeft, Check, Plus, Trash2, X } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import PageTransition from '../../components/ui/PageTransition'
import FormCard from '../../components/ui/FormCard'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import ModernSelect from '../../components/ModernSelect'
import { api } from '../../services/api'
import type { AdminQuestion, QuestionOption } from './AdminQuestionsPage'

const difficultyOptions = [
    { value: 'junior', label: 'Junior' },
    { value: 'middle', label: 'Middle' },
    { value: 'senior', label: 'Senior' },
    { value: 'pending_moderation', label: 'На модерации' },
]

const approveDifficultyOptions = [
    { value: 'junior', label: 'Junior' },
    { value: 'middle', label: 'Middle' },
    { value: 'senior', label: 'Senior' },
]

const categoryOptions = [
    { value: 'question', label: 'Вопрос' },
    { value: 'task', label: 'Задача' },
    { value: 'contribution', label: 'Вклад пользователя' },
]

export default function AdminQuestionDetailPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const location = useLocation()
    const isModeration = location.pathname.startsWith('/admin/moderation')
    const backTo = isModeration ? '/admin/moderation' : '/admin/questions'

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [approving, setApproving] = useState(false)
    const [rejecting, setRejecting] = useState(false)
    const [text, setText] = useState('')
    const [answer, setAnswer] = useState('')
    const [technology, setTechnology] = useState('')
    const [difficulty, setDifficulty] = useState('junior')
    const [category, setCategory] = useState('question')
    const [tags, setTags] = useState<string[]>([])
    const [options, setOptions] = useState<QuestionOption[]>([])

    useEffect(() => {
        if (!id) return
        let cancelled = false
        ;(async () => {
            try {
                setLoading(true)
                const { data } = await api.get(`/questions/${id}`)
                const question: AdminQuestion = data.question
                if (cancelled || !question) return
                setText(question.text || '')
                setAnswer(question.answer === 'Ожидает модерации' ? '' : question.answer || '')
                setTechnology(question.technology || '')
                setDifficulty(
                    isModeration && question.difficulty === 'pending_moderation'
                        ? 'junior'
                        : question.difficulty || 'junior'
                )
                setCategory(
                    isModeration && question.category === 'contribution'
                        ? 'question'
                        : question.category || 'question'
                )
                setTags(question.tags || [])
                setOptions(
                    (question.options || []).map((option, index) => ({
                        id: option.id,
                        text: option.text,
                        is_correct: option.is_correct,
                        sort_order: option.sort_order ?? index,
                    }))
                )
            } catch (error: any) {
                toast.error(error.response?.data?.error || 'Не удалось загрузить вопрос')
                navigate(backTo)
            } finally {
                if (!cancelled) setLoading(false)
            }
        })()
        return () => {
            cancelled = true
        }
    }, [id, navigate, isModeration, backTo])

    const updateOption = (index: number, patch: Partial<QuestionOption>) => {
        setOptions((prev) => prev.map((option, i) => (i === index ? { ...option, ...patch } : option)))
    }

    const payload = () => ({
        text: text.trim(),
        answer: answer.trim() || 'Ожидает модерации',
        technology: technology.trim(),
        difficulty,
        category,
        tags,
        options: options.map((option, index) => ({
            text: option.text.trim(),
            is_correct: option.is_correct,
            sort_order: index,
        })),
    })

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!id) return
        if (text.trim().length < 3) {
            toast.error('Текст вопроса слишком короткий')
            return
        }

        try {
            setSaving(true)
            await api.put(`/questions/${id}`, payload())
            toast.success('Вопрос сохранён')
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Не удалось сохранить')
        } finally {
            setSaving(false)
        }
    }

    const handleApprove = async () => {
        if (!id) return
        if (!['junior', 'middle', 'senior'].includes(difficulty)) {
            toast.error('Выберите сложность junior / middle / senior')
            return
        }
        try {
            setApproving(true)
            const { data } = await api.post(`/admin/moderation/questions/${id}/approve`, {
                difficulty,
                technology: technology.trim(),
                category: category === 'contribution' ? 'question' : category,
                text: text.trim(),
                answer: answer.trim(),
            })
            toast.success(data.message || 'Вопрос одобрен')
            navigate('/admin/moderation')
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Не удалось одобрить')
        } finally {
            setApproving(false)
        }
    }

    const handleReject = async () => {
        if (!id) return
        if (!window.confirm('Отклонить и удалить этот вопрос?')) return
        try {
            setRejecting(true)
            const { data } = await api.post(`/admin/moderation/questions/${id}/reject`)
            toast.success(data.message || 'Вопрос отклонён')
            navigate('/admin/moderation')
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Не удалось отклонить')
        } finally {
            setRejecting(false)
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <Spinner />
            </div>
        )
    }

    return (
        <PageTransition>
            <div className="mb-4">
                <Link
                    to={backTo}
                    className="inline-flex items-center gap-2 text-sm text-secondary hover:text-inter-verse-green dark:hover:text-purple-400 transition-iv"
                >
                    <ArrowLeft className="w-4 h-4" />
                    {isModeration ? 'К очереди модерации' : 'К списку вопросов'}
                </Link>
            </div>

            <PageHeader
                title={isModeration ? 'Модерация вопроса' : 'Редактирование вопроса'}
                description={
                    isModeration
                        ? 'Проверьте формулировку и ответ, затем одобрите или отклоните'
                        : 'Измените формулировку, ответы, направление и сложность'
                }
            />

            <FormCard className="max-w-form space-y-6">
                <form onSubmit={handleSave} className="space-y-6">
                    <div>
                        <label className="block text-xs font-medium uppercase tracking-wide text-secondary mb-2">
                            Вопрос
                        </label>
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            className="input-field-underlined w-full min-h-[140px] resize-y"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium uppercase tracking-wide text-secondary mb-2">
                            Правильный ответ / эталон
                        </label>
                        <textarea
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            className="input-field-underlined w-full min-h-[100px] resize-y"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-xs font-medium uppercase tracking-wide text-secondary mb-2">
                                Направление
                            </label>
                            <input
                                type="text"
                                value={technology}
                                onChange={(e) => setTechnology(e.target.value)}
                                className="input-field-underlined w-full"
                                placeholder="Go, Python…"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium uppercase tracking-wide text-secondary mb-2">
                                Сложность
                            </label>
                            <ModernSelect
                                options={isModeration ? approveDifficultyOptions : difficultyOptions}
                                value={difficulty}
                                onChange={setDifficulty}
                                placeholder="Сложность"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium uppercase tracking-wide text-secondary mb-2">
                            Категория
                        </label>
                        <ModernSelect
                            options={categoryOptions.filter((item) =>
                                isModeration ? item.value !== 'contribution' : true
                            )}
                            value={category}
                            onChange={setCategory}
                            placeholder="Категория"
                        />
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between gap-3">
                            <label className="block text-xs font-medium uppercase tracking-wide text-secondary">
                                Варианты ответов
                            </label>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() =>
                                    setOptions((prev) => [
                                        ...prev,
                                        { text: '', is_correct: false, sort_order: prev.length },
                                    ])
                                }
                            >
                                <Plus className="w-4 h-4" />
                                Добавить
                            </Button>
                        </div>

                        {options.length === 0 ? (
                            <p className="text-sm text-secondary">
                                Нет вариантов — можно оставить только эталонный ответ
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {options.map((option, index) => (
                                    <div
                                        key={option.id || index}
                                        className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center border border-gray-200 dark:border-iv-dark-line p-3"
                                    >
                                        <input
                                            type="text"
                                            value={option.text}
                                            onChange={(e) => updateOption(index, { text: e.target.value })}
                                            className="input-field-underlined flex-1"
                                            placeholder={`Вариант ${index + 1}`}
                                        />
                                        <label className="inline-flex items-center gap-2 text-sm shrink-0">
                                            <input
                                                type="checkbox"
                                                checked={option.is_correct}
                                                onChange={(e) =>
                                                    updateOption(index, { is_correct: e.target.checked })
                                                }
                                            />
                                            Верный
                                        </label>
                                        <button
                                            type="button"
                                            className="btn-icon"
                                            onClick={() =>
                                                setOptions((prev) => prev.filter((_, i) => i !== index))
                                            }
                                            aria-label="Удалить вариант"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {isModeration ? (
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Button
                                type="button"
                                loading={approving}
                                className="flex-1 justify-center"
                                onClick={handleApprove}
                            >
                                <Check className="w-4 h-4" />
                                Одобрить
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                loading={rejecting}
                                className="flex-1 justify-center"
                                onClick={handleReject}
                            >
                                <X className="w-4 h-4" />
                                Отклонить
                            </Button>
                        </div>
                    ) : (
                        <Button type="submit" loading={saving} className="w-full justify-center">
                            Сохранить изменения
                        </Button>
                    )}
                </form>
            </FormCard>
        </PageTransition>
    )
}
