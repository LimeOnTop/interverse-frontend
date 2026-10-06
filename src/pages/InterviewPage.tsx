import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Play } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '../services/api'
import PageTransition from '../components/ui/PageTransition'
import Card from '../components/ui/Card'
import EmptyState from '../components/ui/EmptyState'
import Spinner from '../components/ui/Spinner'
import Button from '../components/ui/Button'
import InterviewQuestionStep, {
    InterviewTaskStep,
    InterviewSessionHeader,
    InterviewSessionComplete,
} from '../components/interview/InterviewSessionSteps'
import {
    startInterviewSession,
    parseSessionResponse,
    getSessionStorageKey,
    getAnswersStorageKey,
    clearInterviewSessionCache,
    restoreAnswersForSession,
    formatUserFacingError,
    type InterviewSessionData,
    type StepAnswer,
} from '../lib/interviewSession'
import { submitInterviewForAnalysis } from '../lib/reportAnalysis'

const specLabels: Record<string, string> = {
    frontend: 'Frontend',
    backend: 'Backend',
    devops: 'DevOps',
    qa: 'QA',
    data_science: 'Data Science',
}

const levelLabels: Record<string, string> = {
    intern: 'Intern',
    junior: 'Junior',
    middle: 'Middle',
    senior: 'Senior',
    lead: 'Lead / CTO',
}

export default function InterviewPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()

    const [session, setSession] = useState<InterviewSessionData | null>(null)
    const [currentStepIndex, setCurrentStepIndex] = useState(0)
    const [answers, setAnswers] = useState<Record<string, StepAnswer>>({})
    const [loading, setLoading] = useState(true)
    const [starting, setStarting] = useState(false)
    const [isComplete, setIsComplete] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [reportId, setReportId] = useState<string | null>(null)
    const [submitError, setSubmitError] = useState<string | null>(null)
    const submitStartedRef = useRef(false)

    const persistSession = useCallback((data: InterviewSessionData) => {
        if (!id) return
        localStorage.setItem(getSessionStorageKey(id), JSON.stringify(data))
    }, [id])

    const persistAnswers = useCallback((nextAnswers: Record<string, StepAnswer>) => {
        if (!id) return
        localStorage.setItem(getAnswersStorageKey(id), JSON.stringify(nextAnswers))
    }, [id])

    const loadSession = useCallback(async () => {
        if (!id) return

        try {
            setLoading(true)

            const sessionResponse = await api.get(`/interviews/${id}/session`)
            const sessionData = parseSessionResponse(sessionResponse.data)

            if (sessionData.steps.length === 0) {
                const interviewResponse = await api.get(`/interviews/${id}`)
                setSession({
                    sessionId: id,
                    interview: interviewResponse.data.interview,
                    steps: [],
                })
                setAnswers({})
                clearInterviewSessionCache(id)
            } else {
                const hasMissingOptions = sessionData.steps.some(
                    (step) => step.type === 'question' && !step.options?.length,
                )

                if (hasMissingOptions && sessionData.interview.status !== 'completed') {
                    clearInterviewSessionCache(id)

                    if (sessionData.interview.status === 'scheduled') {
                        const freshSession = await startInterviewSession(api, id)
                        setSession(freshSession)
                        persistSession(freshSession)
                        setAnswers({})
                    } else {
                        const retryResponse = await api.post(`/interviews/${id}/start`, {})
                        const freshSession = parseSessionResponse(retryResponse.data)
                        setSession(freshSession)
                        persistSession(freshSession)
                        setAnswers(restoreAnswersForSession(id, freshSession.steps))
                    }
                } else {
                    setSession(sessionData)
                    persistSession(sessionData)
                    setAnswers(restoreAnswersForSession(id, sessionData.steps))
                }
            }
        } catch (error) {
            console.error('Error loading session:', error)
            toast.error('Не удалось загрузить тренировку')
            navigate('/dashboard')
        } finally {
            setLoading(false)
        }
    }, [id, navigate, persistSession])

    useEffect(() => {
        loadSession()
    }, [loadSession])

    const currentStep = session?.steps[currentStepIndex]
    const totalSteps = session?.steps.length ?? 0

    const stats = useMemo(() => {
        if (!session) {
            return { answeredQuestions: 0, completedTasks: 0 }
        }

        let answeredQuestions = 0
        let completedTasks = 0

        session.steps.forEach((step) => {
            const answer = answers[step.id]
            if (!answer) return

            if (step.type === 'question' && answer.selectedOptionIndex !== undefined) {
                answeredQuestions += 1
            }

            if (step.type === 'task' && answer.taskAnswer?.trim()) {
                completedTasks += 1
            }
        })

        return { answeredQuestions, completedTasks }
    }, [answers, session])

    const handleStartSession = async () => {
        if (!id) return

        try {
            setStarting(true)
            const sessionData = await startInterviewSession(api, id)

            if (sessionData.steps.length === 0) {
                toast.error('Сессия пуста — проверьте банк вопросов')
                return
            }

            setSession(sessionData)
            setCurrentStepIndex(0)
            setAnswers({})
            setIsComplete(false)
            persistSession(sessionData)
            toast.success('Тренировка начата')
        } catch (error) {
            console.error('Error starting session:', error)
            toast.error('Не удалось начать тренировку')
        } finally {
            setStarting(false)
        }
    }

    const handleSelectOption = (optionIndex: number) => {
        if (!currentStep) return

        const nextAnswers = {
            ...answers,
            [currentStep.id]: {
                stepId: currentStep.id,
                selectedOptionIndex: optionIndex,
            },
        }
        setAnswers(nextAnswers)
        persistAnswers(nextAnswers)
    }

    const handleTaskChange = (value: string) => {
        if (!currentStep) return

        const nextAnswers = {
            ...answers,
            [currentStep.id]: {
                stepId: currentStep.id,
                taskAnswer: value,
            },
        }
        setAnswers(nextAnswers)
        persistAnswers(nextAnswers)
    }

    const canProceed = () => {
        if (!currentStep) return false
        const answer = answers[currentStep.id]

        if (currentStep.type === 'question') {
            return answer?.selectedOptionIndex !== undefined
        }

        return Boolean(answer?.taskAnswer?.trim())
    }

    const submitSession = useCallback(async () => {
        if (!id || !session || submitStartedRef.current) {
            return
        }

        submitStartedRef.current = true
        setSubmitting(true)
        setSubmitError(null)

        try {
            const report = await submitInterviewForAnalysis(id, session.steps, answers)
            setReportId(report.id)
            clearInterviewSessionCache(id)
            toast.success('Отчёт сформирован')
        } catch (error) {
            console.error('Error generating report:', error)
            const message = formatUserFacingError(error, 'Не удалось сформировать отчёт')
            setSubmitError(message)
            toast.error(message)
            // Allow a manual retry: answers are still in memory.
            submitStartedRef.current = false
        } finally {
            setSubmitting(false)
        }
    }, [answers, id, session])

    const handleNext = () => {
        if (!session) return

        if (currentStepIndex < session.steps.length - 1) {
            setCurrentStepIndex((prev) => prev + 1)
            return
        }

        setIsComplete(true)
        void submitSession()
    }

    const handlePrevious = () => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex((prev) => prev - 1)
        }
    }

    const handleFinish = () => {
        if (id) {
            clearInterviewSessionCache(id)
        }
        navigate('/dashboard')
    }

    if (loading) {
        return <Spinner size="lg" className="h-96" />
    }

    if (!session) {
        return (
            <PageTransition className="text-center py-12">
                <h2 className="text-xl sm:text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Тренировка не найдена</h2>
                <Button onClick={() => navigate('/dashboard')}>Вернуться на дашборд</Button>
            </PageTransition>
        )
    }

    if (session.steps.length === 0) {
        return (
            <PageTransition className="max-w-3xl mx-auto space-y-6">
                <Card padding="md">
                    <div className="flex items-start gap-3">
                        <Button variant="icon" onClick={() => navigate('/interview-service')}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{session.interview.title}</h1>
                            <p className="text-secondary text-sm mt-1">{session.interview.description}</p>
                        </div>
                    </div>
                </Card>

                <EmptyState
                    icon={Play}
                    title="Сессия ещё не начата"
                    description="Нажмите кнопку ниже, чтобы получить набор вопросов (10–20) и практических задач (1–3)"
                    action={
                        <Button onClick={handleStartSession} loading={starting}>
                            Начать тренировку
                        </Button>
                    }
                />
            </PageTransition>
        )
    }

    if (isComplete) {
        return (
            <PageTransition className="max-w-3xl mx-auto">
                <InterviewSessionComplete
                    answeredQuestions={stats.answeredQuestions}
                    completedTasks={stats.completedTasks}
                    submitting={submitting}
                    reportId={reportId}
                    submitError={submitError}
                    onRetry={() => void submitSession()}
                    onFinish={handleFinish}
                />
            </PageTransition>
        )
    }

    return (
        <PageTransition className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
            <InterviewSessionHeader
                title={session.interview.title}
                description={session.interview.description}
                currentStep={currentStepIndex + 1}
                totalSteps={totalSteps}
                level={levelLabels[session.interview.level || ''] || session.interview.level}
                specialization={specLabels[session.interview.specialization || ''] || session.interview.specialization}
                onBack={() => navigate('/interview-service')}
            />

            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStep?.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                >
                    {currentStep?.type === 'question' ? (
                        <InterviewQuestionStep
                            step={currentStep}
                            selectedOptionIndex={answers[currentStep.id]?.selectedOptionIndex}
                            onSelectOption={handleSelectOption}
                        />
                    ) : currentStep ? (
                        <InterviewTaskStep
                            step={currentStep}
                            value={answers[currentStep.id]?.taskAnswer || ''}
                            onChange={handleTaskChange}
                        />
                    ) : null}
                </motion.div>
            </AnimatePresence>

            {/* Phones: sticky thumb-reach action bar. */}
            <div className="sm:hidden sticky bottom-0 z-10 -mx-4 px-4 py-3 iv-surface border-t border-gray-200 dark:border-gray-600 iv-safe-bottom grid grid-cols-[auto_1fr] gap-3">
                <button
                    type="button"
                    onClick={handlePrevious}
                    disabled={currentStepIndex === 0}
                    aria-label="Предыдущий шаг"
                    className="btn-secondary px-4 disabled:opacity-50 disabled:pointer-events-none"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <button
                    type="button"
                    onClick={handleNext}
                    disabled={!canProceed()}
                    className="btn-primary-adaptive disabled:opacity-50 disabled:pointer-events-none"
                >
                    {currentStepIndex === totalSteps - 1 ? 'Завершить' : 'Далее'}
                    <ArrowRight className="w-5 h-5" />
                </button>
            </div>

            <div className="hidden sm:flex items-center justify-between gap-4">
                <button
                    type="button"
                    onClick={handlePrevious}
                    disabled={currentStepIndex === 0}
                    className="btn-nav-link disabled:opacity-50 disabled:pointer-events-none"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Назад
                </button>

                <button
                    type="button"
                    onClick={handleNext}
                    disabled={!canProceed()}
                    className="btn-nav-link disabled:opacity-50 disabled:pointer-events-none"
                >
                    {currentStepIndex === totalSteps - 1 ? 'Завершить' : 'Далее'}
                    <ArrowRight className="w-5 h-5" />
                </button>
            </div>
        </PageTransition>
    )
}
