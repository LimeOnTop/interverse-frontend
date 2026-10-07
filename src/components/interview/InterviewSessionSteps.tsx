import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import Card from '../ui/Card'
import type { SessionStep } from '../../lib/interviewSession'

interface InterviewQuestionStepProps {
    step: SessionStep
    selectedOptionIndex?: number
    onSelectOption: (index: number) => void
}

const getOptionLabel = (index: number) => String.fromCharCode(65 + index)

export default function InterviewQuestionStep({
    step,
    selectedOptionIndex,
    onSelectOption,
}: InterviewQuestionStepProps) {
    return (
        <Card padding="lg" className="space-y-5 sm:space-y-6">
            <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-widest text-inter-verse-green dark:text-purple-400">
                        {step.label}
                    </span>
                    {step.technology && <Badge variant="info">{step.technology}</Badge>}
                </div>
                <p className="text-base sm:text-lg leading-relaxed text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                    {step.text}
                </p>
            </div>

            <div className="grid gap-3">
                {step.options?.map((option, index) => {
                    const isSelected = selectedOptionIndex === index

                    return (
                        <motion.button
                            key={`${step.id}-${index}`}
                            type="button"
                            onClick={() => onSelectOption(index)}
                            whileTap={{ scale: 0.99 }}
                            className={`w-full text-left p-4 border transition-iv ${
                                isSelected
                                    ? 'border-inter-verse-green bg-green-50 dark:border-purple-400 dark:bg-purple-900/20'
                                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-iv-dark-bg'
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                <span
                                    className={`w-8 h-8 shrink-0 flex items-center justify-center text-sm font-bold ${
                                        isSelected
                                            ? 'gradient-bg-adaptive text-white'
                                            : 'bg-gray-100 text-gray-700 dark:bg-iv-dark-bg dark:text-gray-300'
                                    }`}
                                >
                                    {getOptionLabel(index)}
                                </span>
                                <span className="text-sm sm:text-base leading-relaxed text-gray-800 dark:text-gray-200">
                                    {option}
                                </span>
                            </div>
                        </motion.button>
                    )
                })}
            </div>

            {selectedOptionIndex === undefined && (
                <p className="text-sm text-secondary">Выберите один из вариантов ответа</p>
            )}
        </Card>
    )
}

interface InterviewTaskStepProps {
    step: SessionStep
    value: string
    onChange: (value: string) => void
}

export function InterviewTaskStep({ step, value, onChange }: InterviewTaskStepProps) {
    return (
        <Card padding="lg" className="space-y-5 sm:space-y-6">
            <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400">
                        {step.label}
                    </span>
                    {step.technology && <Badge variant="warning">{step.technology}</Badge>}
                </div>
                <p className="text-base sm:text-lg leading-relaxed text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                    {step.text}
                </p>
            </div>

            <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-secondary mb-2">
                    Ваше решение
                </label>
                <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Опишите подход, код или архитектурное решение..."
                    className="input-field resize-y min-h-[45vh] sm:min-h-[220px] font-mono text-sm"
                />
            </div>
        </Card>
    )
}

interface InterviewSessionHeaderProps {
    title: string
    description?: string
    currentStep: number
    totalSteps: number
    level?: string
    specialization?: string
    onBack: () => void
}

export function InterviewSessionHeader({
    title,
    description,
    currentStep,
    totalSteps,
    level,
    specialization,
    onBack,
}: InterviewSessionHeaderProps) {
    const progress = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0

    return (
        <Card padding="md" className="space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                <div className="flex items-start gap-2 sm:gap-3">
                    <Button variant="icon" onClick={onBack} aria-label="Выйти из тренировки" className="-ml-2 sm:ml-0 shrink-0">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div className="min-w-0">
                        <h1 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100 leading-snug">{title}</h1>
                        {description && <p className="hidden sm:block text-secondary text-sm mt-1">{description}</p>}
                    </div>
                </div>
                <div className="hidden sm:block text-sm text-secondary">
                    {specialization && <p>{specialization}</p>}
                    {level && <p>{level}</p>}
                </div>
            </div>

            <div>
                <div className="flex items-center justify-between text-sm text-secondary mb-2">
                    <span className="tabular-nums">Шаг {currentStep} из {totalSteps}</span>
                    <span className="tabular-nums">{Math.round(progress)}%</span>
                </div>
                <div className="wizard-progress">
                    <div className="wizard-progress-fill" style={{ width: `${progress}%` }} />
                </div>
            </div>
        </Card>
    )
}

interface InterviewSessionCompleteProps {
    answeredQuestions: number
    completedTasks: number
    submitting?: boolean
    reportId?: string | null
    submitError?: string | null
    onRetry?: () => void
    onFinish: () => void
}

export function InterviewSessionComplete({
    answeredQuestions,
    completedTasks,
    submitting = false,
    reportId = null,
    submitError = null,
    onRetry,
    onFinish,
}: InterviewSessionCompleteProps) {
    return (
        <Card padding="lg" className="text-center space-y-6">
            <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    {submitting ? 'Анализируем ответы...' : 'Тренировка завершена'}
                </h2>
                <p className="text-secondary">
                    {submitting
                        ? 'Формируем отчёт по вашим ответам. Это может занять до минуты.'
                        : 'Вы прошли все вопросы и практические задачи.'}
                </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 max-w-md mx-auto">
                <div className="iv-surface border border-gray-200 dark:border-gray-600 p-4">
                    <div className="text-3xl font-bold gradient-text-adaptive tabular-nums">{answeredQuestions}</div>
                    <div className="text-sm text-secondary mt-1">вопросов с ответом</div>
                </div>
                <div className="iv-surface border border-gray-200 dark:border-gray-600 p-4">
                    <div className="text-3xl font-bold gradient-text-adaptive tabular-nums">{completedTasks}</div>
                    <div className="text-sm text-secondary mt-1">решённых задач</div>
                </div>
            </div>

            {submitError && (
                <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                {submitError && !reportId && !submitting && onRetry && (
                    <Button onClick={onRetry}>Повторить формирование отчёта</Button>
                )}
                {reportId && !submitting && (
                    <Link to={`/reports/${reportId}`} replace>
                        <Button>Открыть отчёт</Button>
                    </Link>
                )}
                <Button variant={reportId ? 'secondary' : 'primary'} onClick={onFinish} disabled={submitting}>
                    {submitting ? 'Подождите...' : 'Вернуться на дашборд'}
                </Button>
            </div>
        </Card>
    )
}
