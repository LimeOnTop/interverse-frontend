import { useState, useEffect, useMemo, useCallback } from 'react'
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
    type InterviewSessionData,
    type StepAnswer,
} from '../lib/interviewSession'

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

            const cached = localStorage.getItem(getSessionStorageKey(id))
            if (cached) {
                const parsed = JSON.parse(cached) as InterviewSessionData
                if (parsed.interview?.id === id && parsed.steps?.length > 0) {
                    setSession(parsed)
                    const cachedAnswers = localStorage.getItem(getAnswersStorageKey(id))
                    if (cachedAnswers) {
                        setAnswers(JSON.parse(cachedAnswers))
                    }
                    setLoading(false)
                    return
                }
            }

            const sessionResponse = await api.get(`/interviews/${id}/session`)
            const sessionData = parseSessionResponse(sessionResponse.data)

            if (sessionData.steps.length === 0) {
                const interviewResponse = await api.get(`/interviews/${id}`)
                setSession({
                    sessionId: id,
                    interview: interviewResponse.data.interview,
                    steps: [],
                })
            } else {
                setSession(sessionData)
                persistSession(sessionData)
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

    const handleNext = () => {
        if (!session) return

        if (currentStepIndex < session.steps.length - 1) {
            setCurrentStepIndex((prev) => prev + 1)
            return
        }

        setIsComplete(true)
    }

    const handlePrevious = () => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex((prev) => prev - 1)
        }
    }

    const handleFinish = () => {
        if (id) {
            localStorage.removeItem(getSessionStorageKey(id))
            localStorage.removeItem(getAnswersStorageKey(id))
        }
        navigate('/dashboard')
    }

    if (loading) {
        return <Spinner size="lg" className="h-96" />
    }

    if (!session) {
        return (
            <PageTransition className="text-center py-12">
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Тренировка не найдена</h2>
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
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{session.interview.title}</h1>
                            <p className="text-secondary text-sm mt-1">{session.interview.description}</p>
                        </div>
                    </div>
                </Card>

                <EmptyState
                    icon={Play}
                    title="Сессия ещё не начата"
                    description="Нажмите кнопку ниже, чтобы получить 20 вопросов и 2 практические задачи"
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
                    onFinish={handleFinish}
                />
            </PageTransition>
        )
    }

    return (
        <PageTransition className="max-w-3xl mx-auto space-y-6">
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

            <div className="flex items-center justify-between gap-4">
                <Button
                    variant="secondary"
                    onClick={handlePrevious}
                    disabled={currentStepIndex === 0}
                >
                    <ArrowLeft className="w-5 h-5" />
                    Назад
                </Button>

                <Button onClick={handleNext} disabled={!canProceed()}>
                    {currentStepIndex === totalSteps - 1 ? 'Завершить' : 'Далее'}
                    <ArrowRight className="w-5 h-5" />
                </Button>
            </div>
        </PageTransition>
    )
}
