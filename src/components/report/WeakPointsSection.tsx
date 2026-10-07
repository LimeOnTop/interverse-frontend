import { Link } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import type { WeakPoint } from '../../lib/reportAnalysis'
import GradientDash from './GradientDash'

function pluralWeak(count: number) {
    const mod10 = count % 10
    const mod100 = count % 100
    if (mod10 === 1 && mod100 !== 11) return 'слабое место'
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'слабых места'
    return 'слабых мест'
}

// Placeholder lines behind the blur: never the user's real weak points.
const PLACEHOLDER_LINES = [
    'Путаница в порядке выполнения асинхронных операций и обработке ошибок внутри цепочки вызовов',
    'Неточное понимание того, как устроено хранение данных и когда выбирать каждую структуру',
    'Пробел в теме изоляции состояния и побочных эффектов при повторном использовании кода',
    'Решение задачи не учитывает граничные случаи и пустые входные данные',
    'Ошибка в оценке сложности алгоритма при росте объёма входных данных',
    'Неуверенное владение инструментами отладки и чтением сообщений об ошибках',
]

export default function WeakPointsSection({
    locked,
    count,
    points,
}: {
    locked: boolean
    count: number
    points: WeakPoint[]
}) {
    if (locked) {
        const lines = PLACEHOLDER_LINES.slice(0, Math.min(Math.max(count, 3), PLACEHOLDER_LINES.length))
        return (
            <section>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {count > 0 ? `Выявлено ${count} ${pluralWeak(count)}` : 'Разбор ошибок'}
                </h2>
                <p className="text-secondary mt-2 leading-relaxed">
                    {count > 0
                        ? 'Мы разобрали каждую ошибку: почему ответ неверный, какой правильный и что изучить по теме.'
                        : 'Разбор каждого ответа с объяснениями и материалами для изучения тем.'}
                </p>

                <ul className="mt-5 space-y-3 select-none" aria-hidden>
                    {lines.map((line) => (
                        <li key={line} className="flex items-start gap-3 leading-relaxed">
                            <GradientDash />
                            <span className="blur-[6px] text-gray-700 dark:text-gray-300 pointer-events-none">{line}</span>
                        </li>
                    ))}
                </ul>

                <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-4">
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Сделайте слабые стороны сильными с{' '}
                        <span className="gradient-text-adaptive">Pro</span>
                    </p>
                    <Link to="/subscription" className="btn-primary-adaptive inline-flex justify-center px-6 py-3 sm:ml-auto">
                        Открыть разбор
                    </Link>
                </div>
            </section>
        )
    }

    if (points.length === 0) {
        return (
            <section>
                <h2 className="text-xl sm:text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">Слабые места</h2>
                <p className="text-secondary">Ошибок не найдено: все вопросы и задачи решены верно.</p>
            </section>
        )
    }

    return (
        <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                Выявлено {points.length} {pluralWeak(points.length)}
            </h2>
            <p className="text-sm text-secondary mt-1 mb-6">
                Вопросы и задачи с ошибками, объяснение правильного ответа и материалы по теме.
            </p>
            <ul className="space-y-6">
                {points.map((point) => (
                    <li key={point.step_id} className="flex items-start gap-3">
                        <GradientDash />
                        <div className="min-w-0 flex-1 space-y-3">
                            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs font-semibold uppercase tracking-wide">
                                <span className="text-inter-verse-green dark:text-purple-400">{point.label}</span>
                                {point.technology && <span className="text-secondary">{point.technology}</span>}
                            </div>
                            <p className="text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre-wrap">{point.prompt}</p>
                            <div className="grid md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-secondary mb-1">Ваш ответ</p>
                                    <p className="whitespace-pre-wrap break-words text-red-600 dark:text-red-400">{point.user_answer}</p>
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-secondary mb-1">Правильный ответ</p>
                                    <p className="whitespace-pre-wrap break-words text-inter-verse-green dark:text-purple-400 max-h-60 overflow-auto">{point.correct_answer}</p>
                                </div>
                            </div>
                            {point.explanation && (
                                <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{point.explanation}</p>
                            )}
                            <a
                                href={point.source_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-sm font-medium text-inter-verse-green dark:text-purple-400 hover:underline"
                            >
                                <ExternalLink className="w-4 h-4" /> Изучить тему «{point.topic}» на Хабре
                            </a>
                        </div>
                    </li>
                ))}
            </ul>
        </section>
    )
}
