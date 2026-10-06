import { Link } from 'react-router-dom'
import { ExternalLink, Lock } from 'lucide-react'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import type { WeakPoint } from '../../lib/reportAnalysis'

function pluralWeak(count: number) {
    const mod10 = count % 10
    const mod100 = count % 100
    if (mod10 === 1 && mod100 !== 11) return 'слабое место'
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'слабых места'
    return 'слабых мест'
}

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
        return (
            <Card padding="lg">
                <div className="flex items-start gap-3 mb-4">
                    <Lock className="w-6 h-6 shrink-0 text-inter-verse-green dark:text-purple-400" />
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {count > 0 ? `Выявлено ${count} ${pluralWeak(count)}` : 'Детальный разбор ответов'}
                        </h2>
                        <p className="text-secondary mt-2 leading-relaxed">
                            {count > 0
                                ? 'Мы нашли вопросы и задачи, на которых вы ошиблись, и подготовили объяснение правильных ответов с материалами для изучения каждой темы. Разбор доступен в подписке Pro.'
                                : 'Разбор каждого ответа с объяснениями и материалами для изучения тем доступен в подписке Pro.'}
                        </p>
                    </div>
                </div>

                <div className="relative mb-6 select-none" aria-hidden>
                    <div className="space-y-3 blur-sm opacity-60">
                        {[0, 1, 2].map((index) => (
                            <div key={index} className="border border-gray-200 dark:border-gray-600 p-4">
                                <div className="h-3 w-24 bg-gray-300 dark:bg-gray-600 mb-3" />
                                <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 mb-2" />
                                <div className="h-3 w-2/3 bg-gray-200 dark:bg-gray-700" />
                            </div>
                        ))}
                    </div>
                </div>

                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Сделайте свои слабые стороны сильными с подпиской{' '}
                    <Link to="/subscription" className="text-inter-verse-green dark:text-purple-400 underline underline-offset-4">
                        Pro
                    </Link>
                </p>
                <Link to="/subscription" className="btn-primary-adaptive inline-flex justify-center px-6 py-3">
                    Перейти на Pro
                </Link>
            </Card>
        )
    }

    if (points.length === 0) {
        return (
            <Card padding="lg">
                <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">Слабые места</h2>
                <p className="text-secondary">Ошибок не найдено — все вопросы и задачи решены верно.</p>
            </Card>
        )
    }

    return (
        <Card padding="lg">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Слабые места: {points.length}
            </h2>
            <p className="text-sm text-secondary mt-1 mb-6">
                Вопросы и задачи с ошибками, объяснение правильного ответа и материалы для изучения темы.
            </p>
            <ol className="space-y-5">
                {points.map((point) => (
                    <li key={point.step_id} className="border border-gray-200 dark:border-gray-600 p-4 sm:p-5 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={point.item_type === 'task' ? 'info' : 'danger'}>{point.label}</Badge>
                            {point.technology && <span className="text-xs text-secondary">{point.technology}</span>}
                        </div>
                        <p className="text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre-wrap">{point.prompt}</p>
                        <div className="grid md:grid-cols-2 gap-3 text-sm">
                            <div className="border border-red-300 dark:border-red-500/40 p-3">
                                <p className="text-xs uppercase tracking-wide text-secondary mb-1">Ваш ответ</p>
                                <p className="whitespace-pre-wrap break-words text-gray-900 dark:text-gray-100">{point.user_answer}</p>
                            </div>
                            <div className="border border-inter-verse-green/40 dark:border-purple-500/40 p-3">
                                <p className="text-xs uppercase tracking-wide text-secondary mb-1">Правильный ответ</p>
                                <p className="whitespace-pre-wrap break-words text-gray-900 dark:text-gray-100 max-h-60 overflow-auto">{point.correct_answer}</p>
                            </div>
                        </div>
                        {point.explanation && (
                            <div className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                                <span className="font-semibold text-inter-verse-green dark:text-purple-400">Объяснение: </span>
                                {point.explanation}
                            </div>
                        )}
                        <a
                            href={point.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-inter-verse-green dark:text-purple-400 hover:underline"
                        >
                            <ExternalLink className="w-4 h-4" /> Изучить тему «{point.topic}» на Хабре
                        </a>
                    </li>
                ))}
            </ol>
        </Card>
    )
}
