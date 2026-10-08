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
    InterviewRouteMap,
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

    // A finished training is never shown again (e.g. after "back" from the
    // report): send the user to its report instead.
    const leaveCompletedTraining = useCallback(async () => {
        if (!id) return
        clearInterviewSessionCache(id)
        try {
            const response = await api.get('/reports/')
            const reports: { id: string; interview_id: string }[] = response.data.reports || []
            const report = reports.find((item) => item.interview_id === id)
            if (report) {
                navigate(`/reports/${report.id}`, { replace: true })
                return
            }
        } catch (error) {
            console.error('Error loading reports:', error)
        }
        toast('Тренировка уже завершена')
        navigate('/reports', { replace: true })
    }, [id, navigate])

    const loadSession = useCallback(async () => {
        if (!id) return

        try {
            setLoading(true)

            const sessionResponse = await api.get(`/interviews/${id}/session`)
            const sessionData = parseSessionResponse(sessionResponse.data)
            if (sessionData.interview?.status === 'completed') {
                await leaveCompletedTraining()
                return
            }

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
    }, [id, navigate, persistSession, leaveCompletedTraining])

    // One load per training: a repeated effect run (StrictMode, re-render) must not
    // flash the spinner and redraw the form a second time.
    const loadedForRef = useRef<string | null>(null)
    useEffect(() => {
        if (!id || loadedForRef.current === id) return
        loadedForRef.current = id
        loadSession()
    }, [id, loadSession])

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
        navigate('/dashboard', { replace: true })
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

    const questionTotal = session.steps.filter((step) => step.type === 'question').length
    const taskTotal = session.steps.filter((step) => step.type === 'task').length
    const isAnswered = (step: typeof session.steps[number]) => {
        const answer = answers[step.id]
        return step.type === 'question' ? answer?.selectedOptionIndex !== undefined : Boolean(answer?.taskAnswer?.trim())
    }
    const filled = session.steps.filter(isAnswered).length
    const isLast = currentStepIndex === totalSteps - 1
    const nextLabel = isLast ? 'Завершить' : currentStep?.type === 'task' ? 'Дальше' : 'Следующий вопрос'
    const practiceTitle = [
        session.steps.find((step) => step.technology)?.technology || specLabels[session.interview.specialization || ''] || '',
        levelLabels[session.interview.level || ''] || session.interview.level,
    ].filter(Boolean).join(' · ')

    if (isComplete) {
        return (
            <PageTransition className="max-w-3xl mx-auto">
                <InterviewSessionComplete
                    answeredQuestions={stats.answeredQuestions}
                    totalQuestions={questionTotal}
                    completedTasks={stats.completedTasks}
                    totalTasks={taskTotal}
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
        <PageTransition className="max-w-5xl mx-auto">
            <header className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <p className="iv-eyebrow">Режим фокуса</p>
                    <h1 className="mt-1.5 text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 truncate">
                        {practiceTitle ? `Практика ${practiceTitle}` : session.interview.title}
                    </h1>
                    <p className="mt-1 text-sm text-secondary">
                        {questionTotal} {plural(questionTotal, ['вопрос', 'вопроса', 'вопросов'])}
                        {taskTotal > 0 && ` + ${taskTotal} ${plural(taskTotal, ['задача', 'задачи', 'задач'])}`}
                        {` · ${filled} из ${totalSteps} заполнено`}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => navigate('/interview-service')}
                    className="shrink-0 inline-flex items-center gap-2 rounded-lg border border-gray-200 dark:border-iv-dark-line px-3 sm:px-4 py-2.5 text-sm font-semibold text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-500 transition-iv"
                    aria-label="Выйти из тренировки"
                >
                    <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Выйти</span>
                </button>
            </header>

            <div className="mt-5 sm:mt-6 iv-track"><span style={{ width: `${totalSteps ? (filled / totalSteps) * 100 : 0}%` }} /></div>

            <div className="mt-6 sm:mt-8 grid grid-cols-1 lg:grid-cols-[1fr_14rem] gap-6 lg:gap-8 items-start">
                <section className="iv-panel rounded-2xl p-5 sm:p-9 min-w-0">
                    {/* initial={false}: the first step appears with the page, not in a second fade after it. */}
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                            key={currentStep?.id}
                            initial={{ opacity: 0, x: 14 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -14 }}
                            transition={{ duration: 0.18 }}
                        >
                            {currentStep?.type === 'question' ? (
                                <InterviewQuestionStep
                                    step={currentStep}
                                    total={questionTotal}
                                    selectedOptionIndex={answers[currentStep.id]?.selectedOptionIndex}
                                    onSelectOption={handleSelectOption}
                                />
                            ) : currentStep ? (
                                <InterviewTaskStep
                                    step={currentStep}
                                    total={taskTotal}
                                    value={answers[currentStep.id]?.taskAnswer || ''}
                                    onChange={handleTaskChange}
                                />
                            ) : null}
                        </motion.div>
                    </AnimatePresence>

                    <footer className="hidden sm:flex mt-8 pt-6 border-t border-gray-200 dark:border-iv-dark-line items-center justify-between gap-3">
                        <button
                            type="button"
                            onClick={handlePrevious}
                            disabled={currentStepIndex === 0}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 dark:border-iv-dark-line px-5 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100 disabled:opacity-40 disabled:pointer-events-none"
                        >
                            <ArrowLeft className="w-4 h-4" /> Назад
                        </button>
                        <button
                            type="button"
                            onClick={handleNext}
                            disabled={!canProceed()}
                            className="btn-primary-adaptive inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm disabled:opacity-50 disabled:pointer-events-none"
                        >
                            {nextLabel} <ArrowRight className="w-4 h-4" />
                        </button>
                    </footer>
                </section>

                <aside className="lg:sticky lg:top-0">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Ваш маршрут</h3>
                    <InterviewRouteMap
                        steps={session.steps}
                        currentIndex={currentStepIndex}
                        isAnswered={isAnswered}
                        onSelect={setCurrentStepIndex}
                    />
                    <div className="hidden lg:block mt-6 pt-6 border-t border-gray-200 dark:border-iv-dark-line text-sm text-secondary leading-relaxed">
                        <p className="iv-eyebrow mb-2">В своём темпе</p>
                        <p>Ответ можно изменить. Переключайтесь между вопросами, ваш выбор сохранится.</p>
                        <p className="mt-3">Результат и разбор появятся после завершения.</p>
                    </div>
                </aside>
            </div>

            {/* Phones: sticky thumb-reach action bar. */}
            <div className="sm:hidden sticky bottom-0 z-10 mt-6 -mx-4 px-4 py-3 iv-surface border-t border-gray-200 dark:border-iv-dark-line iv-safe-bottom grid grid-cols-[auto_1fr] gap-3">
                <button
                    type="button"
                    onClick={handlePrevious}
                    disabled={currentStepIndex === 0}
                    aria-label="Предыдущий шаг"
                    className="rounded-lg border border-gray-200 dark:border-iv-dark-line px-4 text-gray-900 dark:text-gray-100 disabled:opacity-40 disabled:pointer-events-none"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <button
                    type="button"
                    onClick={handleNext}
                    disabled={!canProceed()}
                    className="btn-primary-adaptive rounded-lg inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                >
                    {nextLabel} <ArrowRight className="w-5 h-5" />
                </button>
            </div>
        </PageTransition>
    )
}

function plural(count: number, forms: [string, string, string]) {
    const mod10 = count % 10
    const mod100 = count % 100
    if (mod10 === 1 && mod100 !== 11) return forms[0]
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1]
    return forms[2]
}
