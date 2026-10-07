import { useState } from 'react'
import { ExternalLink, Minus, Plus } from 'lucide-react'
import type { WeakPoint } from '../../lib/reportAnalysis'
import { pluralRu } from '../../lib/dashboard'

/** Pro: wrong questions and failed tasks as an accordion, the first one open. */
export default function ErrorList({ points }: { points: WeakPoint[] }) {
    const [openId, setOpenId] = useState<string | null>(points[0]?.step_id ?? null)

    if (points.length === 0) {
        return (
            <section>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Ошибок нет</h2>
                <p className="mt-2 text-secondary">Все вопросы и задачи решены верно.</p>
            </section>
        )
    }

    return (
        <section>
            <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Разберите ошибки</h2>
                    <p className="mt-1 text-sm text-secondary">Сначала причина, затем материал и практика</p>
                </div>
                <span className="iv-pill shrink-0">
                    {points.length} {pluralRu(points.length, ['пункт', 'пункта', 'пунктов'])}
                </span>
            </div>

            <div className="iv-panel px-4 sm:px-6">
                {points.map((point) => {
                    const open = point.step_id === openId
                    const number = point.label.match(/\d+/)?.[0] ?? ''
                    return (
                        <div key={point.step_id} className="border-b last:border-b-0 border-gray-200 dark:border-iv-dark-line">
                            <button
                                type="button"
                                onClick={() => setOpenId(open ? null : point.step_id)}
                                aria-expanded={open}
                                className="w-full flex items-start gap-3 sm:gap-4 py-4 text-left"
                            >
                                <span className="font-mono text-xs pt-1 w-6 shrink-0 text-secondary">{number.padStart(2, '0')}</span>
                                <span className="flex-1 min-w-0">
                                    <span className={`block font-semibold text-gray-900 dark:text-gray-100 ${open ? '' : 'line-clamp-2'}`}>{point.prompt}</span>
                                    <span className="mt-1 flex flex-wrap gap-x-3 text-xs">
                                        <span className="font-semibold text-red-600 dark:text-red-400">{point.item_type === 'task' ? 'Задача' : 'Ошибка'}</span>
                                        {point.technology && <span className="text-secondary">{point.technology}</span>}
                                    </span>
                                </span>
                                {open ? <Minus className="w-4 h-4 mt-1 shrink-0 text-secondary" /> : <Plus className="w-4 h-4 mt-1 shrink-0 text-secondary" />}
                            </button>
                            {open && (
                                <div className="pb-5 sm:pl-10 space-y-4">
                                    <div className="grid gap-3 md:grid-cols-2">
                                        <div className="rounded-lg border border-gray-200 dark:border-iv-dark-line p-3">
                                            <p className="iv-eyebrow mb-1.5">Ваш ответ</p>
                                            <p className="text-sm whitespace-pre-wrap break-words text-red-600 dark:text-red-400">{point.user_answer}</p>
                                        </div>
                                        <div className="rounded-lg border border-inter-verse-green/40 dark:border-purple-400/50 p-3">
                                            <p className="iv-eyebrow mb-1.5">Правильный ответ</p>
                                            <p className="text-sm whitespace-pre-wrap break-words max-h-60 overflow-auto text-inter-verse-green dark:text-purple-300">{point.correct_answer}</p>
                                        </div>
                                    </div>
                                    {point.explanation && (
                                        <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{point.explanation}</p>
                                    )}
                                    {point.source_url && (
                                        <a
                                            href={point.source_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 text-sm font-medium text-inter-verse-green dark:text-purple-400 hover:underline"
                                        >
                                            <ExternalLink className="w-4 h-4" /> Изучить тему «{point.topic}» на Хабре
                                        </a>
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
