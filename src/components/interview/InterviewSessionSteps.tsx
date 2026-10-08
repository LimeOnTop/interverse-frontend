import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Check } from 'lucide-react'
import type { SessionStep } from '../../lib/interviewSession'

const getOptionLabel = (index: number) => String.fromCharCode(65 + index)
const pad = (value: number) => String(value).padStart(2, '0')

/** "ВОПРОС 03 / 12" and the technology chip above a question or task. */
function StepKicker({ step, total }: { step: SessionStep; total: number }) {
    const isTask = step.type === 'task'
    const number = (isTask ? step.taskNumber : step.questionNumber) ?? 1
    return (
        <div className="flex items-center justify-between gap-3">
            <span className="iv-eyebrow">{isTask ? 'Задача' : 'Вопрос'} {pad(number)} / {pad(total)}</span>
            {step.technology && (
                <span className="rounded-md border border-gray-200 dark:border-iv-dark-line px-2.5 py-1 text-xs font-semibold text-secondary">
                    {step.technology}
                </span>
            )}
        </div>
    )
}

interface InterviewQuestionStepProps {
    step: SessionStep
    total: number
    selectedOptionIndex?: number
    onSelectOption: (index: number) => void
}

export default function InterviewQuestionStep({
    step,
    total,
    selectedOptionIndex,
    onSelectOption,
}: InterviewQuestionStepProps) {
    return (
        <div>
            <StepKicker step={step} total={total} />
            <h2 className="mt-5 text-xl sm:text-2xl font-bold leading-snug tracking-tight text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                {step.text}
            </h2>

            <div className="mt-6 grid gap-3" role="group" aria-label="Варианты ответа">
                {step.options?.map((option, index) => {
                    const isSelected = selectedOptionIndex === index
                    return (
                        <motion.button
                            key={`${step.id}-${index}`}
                            type="button"
                            onClick={() => onSelectOption(index)}
                            aria-pressed={isSelected}
                            whileTap={{ scale: 0.995 }}
                            className={`w-full text-left rounded-xl border px-4 py-3.5 sm:px-5 sm:py-4 flex items-center gap-4 transition-[color,background-color,border-color,box-shadow] duration-200 ${
                                isSelected
                                    ? 'border-inter-verse-green bg-green-50/60 shadow-[inset_3px_0_0_0_#013220] dark:border-purple-400 dark:bg-iv-dark-tint dark:shadow-[inset_3px_0_0_0_#c084fc]'
                                    : 'border-gray-200 dark:border-iv-dark-line hover:border-gray-300 dark:hover:border-gray-500'
                            }`}
                        >
                            <span
                                className={`w-8 h-8 shrink-0 rounded-md flex items-center justify-center text-xs font-bold ${
                                    isSelected
                                        ? 'gradient-bg-adaptive text-white'
                                        : 'bg-gray-100 text-gray-600 dark:bg-iv-dark-bg dark:text-gray-400'
                                }`}
                            >
                                {getOptionLabel(index)}
                            </span>
                            <span className="text-sm sm:text-base leading-relaxed text-gray-900 dark:text-gray-100">{option}</span>
                        </motion.button>
                    )
                })}
            </div>
        </div>
    )
}

interface InterviewTaskStepProps {
    step: SessionStep
    total: number
    value: string
    onChange: (value: string) => void
}

export function InterviewTaskStep({ step, total, value, onChange }: InterviewTaskStepProps) {
    return (
        <div>
            <StepKicker step={step} total={total} />
            <h2 className="mt-5 text-lg sm:text-xl font-bold leading-snug text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                {step.text}
            </h2>
            <p className="mt-3 text-sm text-secondary">Можно написать код или объяснить решение словами.</p>
            <label className="mt-5 block">
                <span className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Ваше решение</span>
                <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="// Опишите подход или напишите код…"
                    spellCheck={false}
                    className="input-field rounded-xl resize-y min-h-[45vh] sm:min-h-[260px] font-mono text-sm leading-relaxed dark:!bg-iv-dark-bg"
                />
            </label>
        </div>
    )
}

interface RouteMapProps {
    steps: SessionStep[]
    currentIndex: number
    isAnswered: (step: SessionStep) => boolean
    onSelect: (index: number) => void
}

/** Grid of all steps: current, answered and empty; tasks are shown as "{ }". */
export function InterviewRouteMap({ steps, currentIndex, isAnswered, onSelect }: RouteMapProps) {
    return (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(2.75rem,1fr))] gap-2">
            {steps.map((step, index) => {
                const active = index === currentIndex
                const answered = isAnswered(step)
                return (
                    <button
                        key={step.id}
                        type="button"
                        onClick={() => onSelect(index)}
                        aria-current={active ? 'step' : undefined}
                        aria-label={`${step.label}${answered ? ', есть ответ' : ''}`}
                        className={`h-11 rounded-lg border font-mono text-xs font-semibold transition-iv ${
                            active
                                ? 'border-inter-verse-green text-inter-verse-green bg-green-50/60 dark:border-purple-400 dark:text-purple-200 dark:bg-iv-dark-tint'
                                : answered
                                    ? 'border-inter-verse-green/40 text-inter-verse-green dark:border-purple-400/40 dark:text-purple-300'
                                    : 'border-gray-200 dark:border-iv-dark-line text-secondary hover:border-gray-300 dark:hover:border-gray-500'
                        }`}
                    >
                        {step.type === 'task' ? '{ }' : pad(step.questionNumber ?? index + 1)}
                    </button>
                )
            })}
        </div>
    )
}

interface InterviewSessionCompleteProps {
    answeredQuestions: number
    totalQuestions: number
    completedTasks: number
    totalTasks: number
    submitting?: boolean
    reportId?: string | null
    submitError?: string | null
    onRetry?: () => void
    onFinish: () => void
}

export function InterviewSessionComplete({
    answeredQuestions,
    totalQuestions,
    completedTasks,
    totalTasks,
    submitting = false,
    reportId = null,
    submitError = null,
    onRetry,
    onFinish,
}: InterviewSessionCompleteProps) {
    return (
        <section className="iv-panel rounded-2xl p-6 sm:p-12 text-center">
            <div className="mx-auto w-16 h-16 rounded-full gradient-bg-adaptive text-white flex items-center justify-center">
                {submitting ? <span className="w-6 h-6 rounded-full border-2 border-white/40 border-t-white animate-spin" /> : <Check className="w-7 h-7" strokeWidth={2.5} />}
            </div>
            <p className="iv-eyebrow mt-6">Практика завершена</p>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                {submitting ? 'Формируем отчёт…' : 'Следующий шаг: разбор.'}
            </h1>
            <p className="mt-3 text-secondary max-w-md mx-auto">
                {submitting
                    ? 'Проверяем ответы и считаем результат. Это может занять до минуты.'
                    : 'Ответы отправлены. В отчёте результат по теории и практике и то, что стоит подтянуть.'}
            </p>

            <div className="mt-8 grid grid-cols-2 max-w-sm mx-auto rounded-xl border border-gray-200 dark:border-iv-dark-line divide-x divide-gray-200 dark:divide-iv-dark-line">
                <div className="p-4">
                    <strong className="block text-2xl font-bold tabular-nums gradient-text-adaptive">{answeredQuestions} / {totalQuestions}</strong>
                    <small className="text-xs text-secondary">Ответов на вопросы</small>
                </div>
                <div className="p-4">
                    <strong className="block text-2xl font-bold tabular-nums gradient-text-adaptive">{completedTasks} / {totalTasks}</strong>
                    <small className="text-xs text-secondary">Решений задач</small>
                </div>
            </div>

            {submitError && <p className="mt-6 text-sm text-red-600 dark:text-red-400">{submitError}</p>}

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                {submitError && !reportId && !submitting && onRetry && (
                    <button type="button" onClick={onRetry} className="btn-primary-adaptive rounded-lg px-6 py-3 text-sm">
                        Повторить формирование отчёта
                    </button>
                )}
                {reportId && !submitting && (
                    <Link to={`/reports/${reportId}`} replace className="btn-primary-adaptive inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm">
                        Открыть отчёт <ArrowRight className="w-4 h-4" />
                    </Link>
                )}
                <button
                    type="button"
                    onClick={onFinish}
                    disabled={submitting}
                    className="rounded-lg border border-gray-200 dark:border-iv-dark-line px-6 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100 disabled:opacity-50"
                >
                    {submitting ? 'Подождите…' : 'Вернуться на главную'}
                </button>
            </div>
        </section>
    )
}
