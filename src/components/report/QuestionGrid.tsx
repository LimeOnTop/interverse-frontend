import { useMemo, useState } from 'react'
import { ChevronDown, Code2, HelpCircle } from 'lucide-react'
import type { AnswerReviewItem } from '../../lib/reportAnalysis'

/**
 * Questions and tasks of the session. An opened tile shows only the user's own
 * answer, without marking it right or wrong.
 */
export default function QuestionGrid({ items }: { items: AnswerReviewItem[] }) {
    const reviews = useMemo(
        () => [...items].sort((a, b) => {
            const typeOrder = (type: string) => (type === 'task' ? 1 : 0)
            const byType = typeOrder(a.item_type) - typeOrder(b.item_type)
            if (byType !== 0) return byType
            return (a.sort_order ?? 0) - (b.sort_order ?? 0)
        }),
        [items],
    )
    const [openId, setOpenId] = useState<string | null>(null)

    if (reviews.length === 0) return null

    return (
        <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Вопросы тренировки</h2>
            <p className="text-sm text-secondary mt-1 mb-5">Откройте вопрос, чтобы посмотреть свой ответ.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {reviews.map((item, index) => {
                    const open = item.step_id === openId
                    const isTask = item.item_type === 'task'
                    const Icon = isTask ? Code2 : HelpCircle
                    return (
                        <div
                            key={item.step_id}
                            className={`iv-surface border transition-iv ${
                                open
                                    ? 'sm:col-span-2 border-inter-verse-green dark:border-purple-400'
                                    : 'border-gray-200 dark:border-gray-600 hover:border-inter-verse-green/60 dark:hover:border-purple-400/60'
                            }`}
                        >
                            <button
                                type="button"
                                onClick={() => setOpenId(open ? null : item.step_id)}
                                aria-expanded={open}
                                className="w-full text-left p-4"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl font-bold tabular-nums leading-none gradient-text-adaptive w-8 shrink-0">
                                        {String(index + 1).padStart(2, '0')}
                                    </span>
                                    <span className="flex-1 min-w-0 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-secondary">
                                        <Icon className="w-3.5 h-3.5 shrink-0" />
                                        <span className="truncate">{isTask ? 'Задача' : 'Вопрос'}{item.technology ? ` · ${item.technology}` : ''}</span>
                                    </span>
                                    <ChevronDown className={`w-4 h-4 shrink-0 text-secondary transition-transform ${open ? 'rotate-180' : ''}`} />
                                </div>
                                <p className={`mt-3 text-sm text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre-wrap ${open ? '' : 'line-clamp-2'}`}>
                                    {item.prompt}
                                </p>
                            </button>
                            {open && (
                                <div className="mx-4 mb-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                                    <p className="text-xs uppercase tracking-wide text-secondary mb-2">{isTask ? 'Ваше решение' : 'Ваш ответ'}</p>
                                    {isTask ? (
                                        <pre className="text-xs sm:text-sm font-mono whitespace-pre-wrap break-words text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-iv-dark-bg p-3 overflow-x-auto max-h-80">
                                            {item.user_answer}
                                        </pre>
                                    ) : (
                                        <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-relaxed">{item.user_answer}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </section>
    )
}
