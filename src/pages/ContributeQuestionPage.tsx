import { useEffect, useState } from 'react'
import { Lightbulb } from 'lucide-react'
import toast from 'react-hot-toast'
import PageTransition from '../components/ui/PageTransition'
import FormCard from '../components/ui/FormCard'
import Button from '../components/ui/Button'
import ModernSelect from '../components/ModernSelect'
import { api } from '../services/api'
import { usePersistedState } from '../hooks/usePersistedForm'

type TechOption = { value: string; label: string }

export default function ContributeQuestionPage() {
    const [draft, setDraft] = usePersistedState('contribute-question', {
        question: '',
        answer: '',
        technology: '',
    })
    const { question, answer, technology } = draft
    const [technologyOptions, setTechnologyOptions] = useState<TechOption[]>([])
    const [isLoadingTechs, setIsLoadingTechs] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        let cancelled = false
        ;(async () => {
            try {
                setIsLoadingTechs(true)
                const { data } = await api.get('/technologies/', { params: { page: 1, limit: 200 } })
                const list: TechOption[] = (data.technologies || [])
                    .map((item: { name?: string }) => {
                        const name = (item.name || '').trim()
                        return name ? { value: name, label: name } : null
                    })
                    .filter((item: TechOption | null): item is TechOption => Boolean(item))
                    .sort((a: TechOption, b: TechOption) => a.label.localeCompare(b.label, 'ru'))

                if (!cancelled) {
                    setTechnologyOptions(list)
                    if (list.length > 0) {
                        setDraft((prev) => ({ ...prev, technology: prev.technology || list[0].value }))
                    }
                }
            } catch {
                if (!cancelled) {
                    toast.error('Не удалось загрузить список технологий')
                    setTechnologyOptions([])
                }
            } finally {
                if (!cancelled) setIsLoadingTechs(false)
            }
        })()
        return () => {
            cancelled = true
        }
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const text = question.trim()
        if (text.length < 10) {
            toast.error('Опишите вопрос подробнее (минимум 10 символов)')
            return
        }
        if (!technology.trim()) {
            toast.error('Выберите технологию')
            return
        }

        try {
            setIsSubmitting(true)
            const { data } = await api.post('/contributions/questions', {
                text,
                answer: answer.trim() || undefined,
                technology: technology.trim(),
            })
            toast.success(data.message || 'Вопрос отправлен на модерацию')
            setDraft((prev) => ({ ...prev, question: '', answer: '' }))
        } catch (error: any) {
            toast.error(
                error.response?.data?.error ||
                    error.response?.data?.message ||
                    'Не удалось отправить вопрос'
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <PageTransition>
            <form onSubmit={handleSubmit} className="w-full">
                <FormCard className="space-y-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                            Предложить вопрос
                        </h1>
                        <p className="text-secondary mt-1 text-sm leading-relaxed">
                            Помогите наполнить банк тренировок — и получите скидку за одобренные материалы
                        </p>
                    </div>

                    <div className="iv-divider" />

                    <p className="text-2xl sm:text-3xl font-bold leading-snug">
                        Ваш вклад поможет 
                        <span className="tracking-tight gradient-text-adaptive"> улучшить сервис</span>
                    </p>
                    <p className="text-sm text-secondary leading-relaxed">
                        Предлагайте нам свои вопросы — выбирайте технологию и сформулируйте вопрос, а с нас{' '}
                        <span className="font-semibold gradient-text-adaptive">скидка до 90%</span> на подписку!
                    </p>

                    <div>
                        <label className="block text-xs font-medium uppercase tracking-wide text-secondary mb-2">
                            Технология
                        </label>
                        <ModernSelect
                            options={technologyOptions}
                            value={technology}
                            onChange={(value) => setDraft((prev) => ({ ...prev, technology: value }))}
                            placeholder={isLoadingTechs ? 'Загрузка технологий…' : 'Выберите технологию'}
                            searchable
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
                        <div>
                            <label className="block text-xs font-medium uppercase tracking-wide text-secondary mb-2">
                                Вопрос
                            </label>
                            <textarea
                                value={question}
                                onChange={(e) => setDraft((prev) => ({ ...prev, question: e.target.value }))}
                                className="input-field-underlined w-full min-h-[220px] resize-y bg-gray-50 dark:bg-iv-dark-bg px-3"
                                placeholder="Сформулируйте вопрос для тренировки собеседования…"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium uppercase tracking-wide text-secondary mb-2">
                                Правильный ответ
                                <span className="normal-case font-normal text-secondary">
                                    {' '}
                                    (необязательно)
                                </span>
                            </label>
                            <textarea
                                value={answer}
                                onChange={(e) => setDraft((prev) => ({ ...prev, answer: e.target.value }))}
                                className="input-field-underlined w-full min-h-[220px] resize-y bg-gray-50 dark:bg-iv-dark-bg px-3"
                                placeholder="Краткий эталонный ответ или пояснение…"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button
                            type="submit"
                            loading={isSubmitting}
                            disabled={isLoadingTechs || technologyOptions.length === 0}
                        >
                            <Lightbulb className="w-4 h-4" strokeWidth={1.75} />
                            Отправить на модерацию
                        </Button>
                    </div>
                </FormCard>
            </form>
        </PageTransition>
    )
}
