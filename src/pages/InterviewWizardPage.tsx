import { isTrainingLimitError } from '../store/promoStore'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { api } from '../services/api'
import { startInterviewSession, formatSessionStartError } from '../lib/interviewSession'
import toast from 'react-hot-toast'
import StepIndicator from '../components/InterviewWizard/StepIndicator'
import SpecializationStep from '../components/InterviewWizard/SpecializationStep'
import TechStackStep from '../components/InterviewWizard/TechStackStep'
import LevelStep from '../components/InterviewWizard/LevelStep'
import SchedulePromptStep from '../components/InterviewWizard/SchedulePromptStep'
import ScheduleStep from '../components/InterviewWizard/ScheduleStep'
import PageHeader from '../components/ui/PageHeader'
import PageTransition from '../components/ui/PageTransition'
import Card from '../components/ui/Card'
import Spinner from '../components/ui/Spinner'
import { clearFormDraft, usePersistedState } from '../hooks/usePersistedForm'

const STEPS = {
    SPECIALIZATION: 1,
    TECH_STACK: 2,
    LEVEL: 3,
    SCHEDULE_PROMPT: 4,
    SCHEDULE: 5,
}

const DISPLAY_STEPS = 4

function getDisplayStep(step: number): number {
    if (step >= STEPS.SCHEDULE_PROMPT) {
        return DISPLAY_STEPS
    }
    return step
}

export default function InterviewWizardPage() {
    const [draft, setDraft] = usePersistedState('interview-wizard', {
        currentStep: STEPS.SPECIALIZATION,
        selectedSpecialization: '',
        selectedTechStack: [] as string[],
        selectedLevel: '',
        scheduledAt: '',
    })
    const { currentStep, selectedSpecialization, selectedTechStack, selectedLevel, scheduledAt } = draft
    const [isLoading, setIsLoading] = useState(false)

    const navigate = useNavigate()

    const handleSubmit = async (withSchedule: boolean) => {
        setIsLoading(true)
        try {
            const interviewData: Record<string, unknown> = {
                title: `Тренировка: ${selectedSpecialization} — ${selectedLevel}`,
                description: `Самостоятельная тренировка интервью по направлению ${selectedSpecialization}, уровень ${selectedLevel}`,
                specialization: selectedSpecialization,
                tech_stack: JSON.stringify(selectedTechStack),
                level: selectedLevel,
            }

            if (withSchedule && scheduledAt) {
                interviewData.scheduled_at = scheduledAt
            }

            const response = await api.post('/interviews/', interviewData)
            const interviewId = response.data?.interview?.id as string | undefined

            if (!withSchedule && interviewId) {
                await startInterviewSession(api, interviewId)
                toast.success('Тренировка запущена!')
                clearFormDraft('interview-wizard')
                navigate(`/interview/${interviewId}`)
                return
            }

            toast.success(withSchedule ? 'Тренировка запланирована!' : 'Тренировка создана!')
            clearFormDraft('interview-wizard')
            navigate('/dashboard')
        } catch (error: any) {
            // The limit promo opens from the API interceptor.
            if (!isTrainingLimitError(error)) {
                toast.error(formatSessionStartError(error))
            }
        } finally {
            setIsLoading(false)
        }
    }

    const renderStep = () => {
        switch (currentStep) {
            case STEPS.SPECIALIZATION:
                return (
                    <SpecializationStep
                        selectedSpecialization={selectedSpecialization}
                        onSelect={(value) => setDraft((prev) => ({ ...prev, selectedSpecialization: value }))}
                        onNext={() => setDraft((prev) => ({ ...prev, currentStep: STEPS.TECH_STACK }))}
                    />
                )
            case STEPS.TECH_STACK:
                return (
                    <TechStackStep
                        selectedSpecialization={selectedSpecialization}
                        selectedTechStack={selectedTechStack}
                        onUpdateTechStack={(value) => setDraft((prev) => ({ ...prev, selectedTechStack: value }))}
                        onNext={() => setDraft((prev) => ({ ...prev, currentStep: STEPS.LEVEL }))}
                        onBack={() => setDraft((prev) => ({ ...prev, currentStep: STEPS.SPECIALIZATION }))}
                    />
                )
            case STEPS.LEVEL:
                return (
                    <LevelStep
                        selectedLevel={selectedLevel}
                        onSelect={(value) => setDraft((prev) => ({ ...prev, selectedLevel: value }))}
                        onNext={() => setDraft((prev) => ({ ...prev, currentStep: STEPS.SCHEDULE_PROMPT }))}
                        onBack={() => setDraft((prev) => ({ ...prev, currentStep: STEPS.TECH_STACK }))}
                    />
                )
            case STEPS.SCHEDULE_PROMPT:
                return (
                    <SchedulePromptStep
                        onYes={() => setDraft((prev) => ({ ...prev, currentStep: STEPS.SCHEDULE }))}
                        onNo={() => handleSubmit(false)}
                        onBack={() => setDraft((prev) => ({ ...prev, currentStep: STEPS.LEVEL }))}
                    />
                )
            case STEPS.SCHEDULE:
                return (
                    <ScheduleStep
                        scheduledAt={scheduledAt}
                        onScheduleChange={(value) => setDraft((prev) => ({ ...prev, scheduledAt: value }))}
                        onNext={() => handleSubmit(true)}
                        onBack={() => setDraft((prev) => ({ ...prev, currentStep: STEPS.SCHEDULE_PROMPT }))}
                    />
                )
            default:
                return null
        }
    }

    return (
        <PageTransition className="max-w-6xl mx-auto">
            <PageHeader
                title="Начать тренировку"
                description="Спланируйте тренировочное интервью и выберите навыки для отработки"
            />

            <StepIndicator currentStep={getDisplayStep(currentStep)} totalSteps={DISPLAY_STEPS} />

            <Card padding="lg" className="min-h-[400px] mt-6">
                <AnimatePresence mode="wait">
                    {renderStep()}
                </AnimatePresence>
            </Card>

            {isLoading && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card padding="lg" className="text-center">
                        <Spinner size="lg" />
                        <p className="text-secondary mt-4">Подготовка тренировки...</p>
                    </Card>
                </div>
            )}
        </PageTransition>
    )
}
