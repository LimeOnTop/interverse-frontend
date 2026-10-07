import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import type { FocusGroup } from '../../lib/reportAnalysis'
import { pluralRu } from '../../lib/dashboard'

const PLACEHOLDERS = [
    { title: 'Асинхронность', topics: 'порядок выполнения и обработка ошибок' },
    { title: 'Хранение данных', topics: 'структуры и выбор подхода' },
    { title: 'Устройство языка', topics: 'области видимости и побочные эффекты' },
]

interface FocusPlanProps {
    locked: boolean
    groups: FocusGroup[]
    /** Number of groups, known even when the list is locked. */
    count: number
    title?: string
    description?: string
    action?: boolean
}

/** Numbered weak topic groups; blurred placeholders with a Pro offer for Basic. */
export default function FocusPlan({ locked, groups, count, title = 'Следующий шаг', description, action = true }: FocusPlanProps) {
    const empty = !locked && groups.length === 0

    return (
        <div className="iv-panel p-5 sm:p-6">
            <p className="iv-eyebrow">{title}</p>
            <h2 className="mt-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
                {empty ? 'Ошибок не найдено' : 'Закрепить слабые темы'}
            </h2>
            <p className="mt-1 text-sm text-secondary">
                {description ?? (empty ? 'Можно повышать уровень или добавить новые технологии.' : 'План собран по ошибкам последнего отчёта')}
            </p>

            {locked ? (
                <>
                    <ol className="mt-4 select-none" aria-hidden>
                        {PLACEHOLDERS.slice(0, Math.max(1, Math.min(count || 3, 3))).map((item, index) => (
                            <PlanStep key={item.title} index={index} title={item.title} subtitle={item.topics} blurred />
                        ))}
                    </ol>
                    <Link to="/subscription" className="mt-5 btn-primary-adaptive w-full inline-flex justify-center items-center gap-2 rounded-lg">
                        Открыть план в Pro <ArrowRight className="w-4 h-4" />
                    </Link>
                </>
            ) : (
                <>
                    {groups.length > 0 && (
                        <ol className="mt-4">
                            {groups.slice(0, 5).map((group, index) => (
                                <PlanStep
                                    key={group.title}
                                    index={index}
                                    title={group.title}
                                    subtitle={[
                                        `${group.count} ${pluralRu(group.count, ['ошибка', 'ошибки', 'ошибок'])}`,
                                        group.topics.join(', '),
                                    ].filter(Boolean).join(' · ')}
                                />
                            ))}
                        </ol>
                    )}
                    {action && (
                        <Link to="/interviews/create" className="mt-5 btn-primary-adaptive w-full inline-flex justify-center items-center gap-2 rounded-lg">
                            Настроить тренировку <ArrowRight className="w-4 h-4" />
                        </Link>
                    )}
                </>
            )}
        </div>
    )
}

function PlanStep({ index, title, subtitle, blurred = false }: { index: number; title: string; subtitle: string; blurred?: boolean }) {
    return (
        <li className="flex gap-3 py-3.5 border-b last:border-b-0 border-gray-200 dark:border-gray-600">
            <span className="font-mono text-xs font-semibold pt-1 gradient-text-adaptive">{String(index + 1).padStart(2, '0')}</span>
            <div className={`min-w-0 ${blurred ? 'blur-[6px] pointer-events-none' : ''}`}>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
                <p className="text-sm text-secondary mt-0.5">{subtitle}</p>
            </div>
        </li>
    )
}
