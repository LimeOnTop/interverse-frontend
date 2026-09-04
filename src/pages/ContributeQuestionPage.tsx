import { useState } from 'react'
import { Lightbulb } from 'lucide-react'
import toast from 'react-hot-toast'
import PageHeader from '../components/ui/PageHeader'
import PageTransition from '../components/ui/PageTransition'
import FormCard from '../components/ui/FormCard'
import Button from '../components/ui/Button'
import { api } from '../services/api'

export default function ContributeQuestionPage() {
    const [question, setQuestion] = useState('')
    const [answer, setAnswer] = useState('')
    const [technology, setTechnology] = useState('Go')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const text = question.trim()
        if (text.length < 10) {
            toast.error('Опишите вопрос подробнее (минимум 10 символов)')
            return
        }

        try {
            setIsSubmitting(true)
            const { data } = await api.post('/contributions/questions', {
                text,
                answer: answer.trim() || undefined,
                technology: technology.trim() || 'Общее',
            })
            toast.success(data.message || 'Вопрос отправлен на модерацию')
            setQuestion('')
            setAnswer('')
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
            <PageHeader
                title="Предложить вопрос"
                description="Помогите наполнить банк тренировок — и получите скидку за одобренные материалы"
            />

            <div className="max-w-form space-y-6">
                <FormCard className="space-y-5">
                    <p className="text-base font-semibold leading-relaxed gradient-text-adaptive">
                        Ваш вклад поможет улучшить сервис
                    </p>

                    <p className="text-sm text-secondary leading-relaxed">
                        За вопросы, которые пройдут модерацию, мы предоставим скидку на подписку.
                        Чем больше качественных вопросов вы пришлёте — тем выше скидка,{' '}
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                            до 90%
                        </span>
                        .
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
                                Вопрос
                            </label>
                            <textarea
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                className="input-field-underlined w-full min-h-[120px] resize-y"
                                placeholder="Сформулируйте вопрос для тренировки собеседования…"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
                                Правильный ответ
                                <span className="normal-case font-normal text-secondary">
                                    {' '}
                                    (необязательно)
                                </span>
                            </label>
                            <textarea
                                value={answer}
                                onChange={(e) => setAnswer(e.target.value)}
                                className="input-field-underlined w-full min-h-[100px] resize-y"
                                placeholder="Краткий эталонный ответ или пояснение…"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
                                Технология
                            </label>
                            <input
                                type="text"
                                value={technology}
                                onChange={(e) => setTechnology(e.target.value)}
                                className="input-field-underlined w-full"
                                placeholder="Go, Python, React…"
                            />
                        </div>

                        <Button type="submit" loading={isSubmitting} className="w-full justify-center">
                            <Lightbulb className="w-4 h-4" strokeWidth={1.75} />
                            Отправить на модерацию
                        </Button>
                    </form>
                </FormCard>
            </div>
        </PageTransition>
    )
}
