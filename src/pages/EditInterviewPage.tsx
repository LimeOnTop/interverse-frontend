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

            // Parse tech_stack
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

    if (isLoadingData) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-inter-verse-green"></div>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    Редактирование интервью
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Обновите информацию об интервью
                </p>
            </div>

            <StepIndicator currentStep={currentStep} totalSteps={4} />

            <AnimatePresence mode="wait">
                <div className="mt-8">
                    {renderStep()}
                </div>
            </AnimatePresence>

            {isLoading && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-inter-verse-green mx-auto"></div>
                        <p className="mt-4 text-gray-600 dark:text-gray-400">Обновление интервью...</p>
                    </div>
                </div>
            )}
        </div>
    )
}

