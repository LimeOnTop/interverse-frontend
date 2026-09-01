import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { api } from '../services/api'
import toast from 'react-hot-toast'
import StepIndicator from '../components/InterviewWizard/StepIndicator'
import SpecializationStep from '../components/InterviewWizard/SpecializationStep'
import TechStackStep from '../components/InterviewWizard/TechStackStep'
import LevelStep from '../components/InterviewWizard/LevelStep'
import ScheduleStep from '../components/InterviewWizard/ScheduleStep'
import PageHeader from '../components/ui/PageHeader'
import PageTransition from '../components/ui/PageTransition'
import Card from '../components/ui/Card'
import Spinner from '../components/ui/Spinner'

const STEPS = {
    SPECIALIZATION: 1,
    TECH_STACK: 2,
    LEVEL: 3,
    SCHEDULE: 4,
}

export default function EditInterviewPage() {
    const { id } = useParams<{ id: string }>()
    const [currentStep, setCurrentStep] = useState(STEPS.SPECIALIZATION)
    const [selectedSpecialization, setSelectedSpecialization] = useState('')
    const [selectedTechStack, setSelectedTechStack] = useState<string[]>([])
    const [selectedLevel, setSelectedLevel] = useState('')
    const [scheduledAt, setScheduledAt] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isLoadingData, setIsLoadingData] = useState(true)

    const navigate = useNavigate()

    useEffect(() => {
        if (id) {
            fetchInterview()
        }
    }, [id])

    const fetchInterview = async () => {
        try {
            setIsLoadingData(true)
            const response = await api.get(`/interviews/${id}`)
            const interview = response.data.interview

            setSelectedSpecialization(interview.specialization || '')
            setSelectedLevel(interview.level || '')
            setScheduledAt(interview.scheduled_at || '')

            if (interview.tech_stack) {
                try {
                    const techStack = JSON.parse(interview.tech_stack)
                    setSelectedTechStack(Array.isArray(techStack) ? techStack : [])
                } catch {
                    setSelectedTechStack([])
                }
            } else {
                setSelectedTechStack([])
            }
        } catch (error: any) {
            toast.error('Ошибка при загрузке интервью')
            navigate('/dashboard')
        } finally {
            setIsLoadingData(false)
        }
    }

    const handleNext = () => {
        if (currentStep < 4) {
            setCurrentStep(currentStep + 1)
        }
    }

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1)
        }
    }

    const handleSubmit = async () => {
        if (!id) {
            toast.error('ID интервью не найден')
            return
        }

        setIsLoading(true)
        try {
            const interviewData = {
                title: `${selectedSpecialization} интервью - ${selectedLevel}`,
                description: `Техническое интервью для позиции ${selectedLevel} ${selectedSpecialization} разработчика`,
                specialization: selectedSpecialization,
                tech_stack: JSON.stringify(selectedTechStack),
                level: selectedLevel,
                scheduled_at: scheduledAt,
            }

            await api.put(`/interviews/${id}`, interviewData)

            toast.success('Интервью обновлено успешно!')
            navigate('/dashboard')
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Ошибка при обновлении интервью')
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
                        onSelect={setSelectedSpecialization}
                        onNext={handleNext}
                    />
                )
            case STEPS.TECH_STACK:
                return (
                    <TechStackStep
                        selectedSpecialization={selectedSpecialization}
                        selectedTechStack={selectedTechStack}
                        onUpdateTechStack={setSelectedTechStack}
                        onNext={handleNext}
                        onBack={handleBack}
                    />
                )
            case STEPS.LEVEL:
                return (
                    <LevelStep
                        selectedLevel={selectedLevel}
                        onSelect={setSelectedLevel}
                        onNext={handleNext}
                        onBack={handleBack}
                    />
                )
            case STEPS.SCHEDULE:
                return (
                    <ScheduleStep
                        scheduledAt={scheduledAt}
                        onScheduleChange={setScheduledAt}
                        onNext={handleSubmit}
                        onBack={handleBack}
                    />
                )
            default:
                return null
        }
    }

    if (isLoadingData) return <Spinner size="lg" className="h-96" />

    return (
        <PageTransition className="max-w-4xl mx-auto">
            <PageHeader
                title="Редактирование интервью"
                description="Обновите информацию об интервью"
            />

            <StepIndicator currentStep={currentStep} totalSteps={4} />

            <Card padding="lg" className="mt-6">
                <AnimatePresence mode="wait">
                    {renderStep()}
                </AnimatePresence>
            </Card>

            {isLoading && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card padding="lg" className="text-center">
                        <Spinner size="lg" />
                        <p className="text-secondary mt-4">Обновление интервью...</p>
                    </Card>
                </div>
            )}
        </PageTransition>
    )
}
