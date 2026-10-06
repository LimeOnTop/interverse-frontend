import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, XCircle, Code2, HelpCircle } from 'lucide-react'
import Card from '../ui/Card'
import Badge from '../ui/Badge'

export interface AnswerReviewItem {
    step_id: string
    question_id?: string
    item_type: 'question' | 'task' | string
    sort_order?: number
    label: string
    prompt: string
    technology?: string
    options?: string[]
    selected_index?: number | null
    correct_index?: number | null
    user_answer: string
    correct_answer: string
    is_correct?: boolean | null
}

interface ReportAnswerReviewsProps {
    items: AnswerReviewItem[]
}

export default function ReportAnswerReviews({ items }: ReportAnswerReviewsProps) {
    const reviews = useMemo(
        () => [...items].sort((a, b) => {
            const typeOrder = (type: string) => (type === 'task' ? 1 : 0)
            const byType = typeOrder(a.item_type) - typeOrder(b.item_type)
            if (byType !== 0) return byType
            return (a.sort_order ?? 0) - (b.sort_order ?? 0)
        }),
        [items],
    )

    const [activeId, setActiveId] = useState('')

    useEffect(() => {
        if (reviews.length === 0) {
            setActiveId('')
            return
        }
        if (!reviews.some((item) => item.step_id === activeId)) {
            setActiveId(reviews[0].step_id)
        }
    }, [reviews, activeId])

    const active = reviews.find((item) => item.step_id === activeId) ?? reviews[0]

    if (reviews.length === 0) {
        return (
            <Card padding="lg">
                <h2 className="text-xl sm:text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">Разбор ответов</h2>
                <p className="text-sm text-secondary">
                    Для этого отчёта разбор ответов ещё не сохранён. Запустите AI-анализ заново, чтобы увидеть ответы и эталоны.
                </p>
            </Card>
        )
    }

    const isTask = active?.item_type === 'task'

    return (
        <Card padding="lg">
            <div className="mb-5">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Разбор ответов</h2>
                <p className="text-sm text-secondary mt-1">
                    Откройте вкладку, чтобы сравнить свой ответ с верным вариантом или эталонным решением.
                </p>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
                {reviews.map((item) => {
                    const selected = item.step_id === active?.step_id
                    const isItemTask = item.item_type === 'task'
                    return (
                        <button
                            key={item.step_id}
                            type="button"
                            onClick={() => setActiveId(item.step_id)}
                            className={`px-3 py-1.5 text-sm border transition-colors ${
                                selected
                                    ? 'border-inter-verse-green bg-green-50 text-inter-verse-green dark:border-purple-400 dark:bg-purple-900/30 dark:text-purple-200'
                                    : 'border-gray-200 dark:border-gray-600 text-secondary hover:border-gray-300 dark:hover:border-gray-500'
                            }`}
                        >
                            <span className="inline-flex items-center gap-1.5">
                                {isItemTask ? <Code2 className="w-3.5 h-3.5" /> : <HelpCircle className="w-3.5 h-3.5" />}
                                {item.label}
                                {!isItemTask && item.is_correct === true && (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-inter-verse-green dark:text-purple-300" />
                                )}
                                {!isItemTask && item.is_correct === false && (
                                    <XCircle className="w-3.5 h-3.5 text-red-500" />
                                )}
                            </span>
                        </button>
                    )
                })}
            </div>

            {active && (
                <div className="space-y-5">
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={isTask ? 'info' : active.is_correct ? 'success' : active.is_correct === false ? 'danger' : 'default'}>
                            {isTask
                                ? 'Задача'
                                : active.is_correct === true
                                    ? 'Верно'
                                    : active.is_correct === false
                                        ? 'Неверно'
                                        : 'Вопрос'}
                        </Badge>
                        {active.technology && (
                            <span className="text-xs text-secondary">{active.technology}</span>
                        )}
                    </div>

                    <div>
                        <p className="text-xs uppercase tracking-wide text-secondary mb-2">Условие</p>
                        <p className="text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre-wrap">{active.prompt}</p>
                    </div>

                    {isTask ? (
                        <div className="grid md:grid-cols-2 gap-4">
                            <CodePanel title="Ваш код" code={active.user_answer} />
                            <CodePanel title="Эталонное решение" code={active.correct_answer} tone="reference" />
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-4">
                            <AnswerPanel
                                title="Ваш ответ"
                                text={active.user_answer}
                                tone={active.is_correct === false ? 'wrong' : active.is_correct ? 'right' : 'neutral'}
                            />
                            <AnswerPanel
                                title="Верный ответ"
                                text={active.correct_answer}
                                tone="right"
                            />
                        </div>
                    )}

                    {!isTask && active.options && active.options.length > 0 && (
                        <div>
                            <p className="text-xs uppercase tracking-wide text-secondary mb-2">Все варианты</p>
                            <ul className="space-y-2">
                                {active.options.map((option, index) => {
                                    const isSelected = active.selected_index === index
                                    const isCorrectOption = active.correct_index === index
                                    return (
                                        <li
                                            key={`${active.step_id}-opt-${index}`}
                                            className={`text-sm px-3 py-2 border ${
                                                isCorrectOption
                                                    ? 'border-inter-verse-green/50 bg-green-50 dark:border-purple-500/40 dark:bg-purple-900/20'
                                                    : isSelected
                                                        ? 'border-red-300 bg-red-50 dark:border-red-500/40 dark:bg-red-900/20'
                                                        : 'border-gray-200 dark:border-gray-600'
                                            }`}
                                        >
                                            <span className="text-secondary mr-2">{index + 1}.</span>
                                            <span className="text-gray-900 dark:text-gray-100">{option}</span>
                                            {isCorrectOption && (
                                                <span className="ml-2 text-xs text-inter-verse-green dark:text-purple-300">верный</span>
                                            )}
                                            {isSelected && !isCorrectOption && (
                                                <span className="ml-2 text-xs text-red-600 dark:text-red-300">ваш выбор</span>
                                            )}
                                        </li>
                                    )
                                })}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </Card>
    )
}

function AnswerPanel({
    title,
    text,
    tone,
}: {
    title: string
    text: string
    tone: 'right' | 'wrong' | 'neutral'
}) {
    const toneClass = tone === 'right'
        ? 'border-inter-verse-green/40 dark:border-purple-500/40'
        : tone === 'wrong'
            ? 'border-red-300 dark:border-red-500/40'
            : 'border-gray-200 dark:border-gray-600'

    return (
        <div className={`border p-4 ${toneClass}`}>
            <p className="text-xs uppercase tracking-wide text-secondary mb-2">{title}</p>
            <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-relaxed">{text}</p>
        </div>
    )
}

function CodePanel({
    title,
    code,
    tone = 'neutral',
}: {
    title: string
    code: string
    tone?: 'neutral' | 'reference'
}) {
    return (
        <div className={`border p-4 ${
            tone === 'reference'
                ? 'border-inter-verse-green/40 dark:border-purple-500/40'
                : 'border-gray-200 dark:border-gray-600'
        }`}
        >
            <p className="text-xs uppercase tracking-wide text-secondary mb-2">{title}</p>
            <pre className="text-xs sm:text-sm font-mono whitespace-pre-wrap break-words text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-iv-dark-bg p-3 overflow-x-auto max-h-80">
                {code}
            </pre>
        </div>
    )
}
