import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

export default function InterviewWizardPage() {
    const [currentStep, setCurrentStep] = useState(STEPS.SPECIALIZATION)
    const [selectedSpecialization, setSelectedSpecialization] = useState('')
    const [selectedTechStack, setSelectedTechStack] = useState<string[]>([])
    const [selectedLevel, setSelectedLevel] = useState('')
    const [scheduledAt, setScheduledAt] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const navigate = useNavigate()

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
        setIsLoading(true)
        try {
            // First, create a candidate (for demo purposes, we'll use a placeholder)
            const candidateData = {
                name: 'Новый кандидат',
                email: 'candidate@example.com',
                phone: '',
                experience: 0,
                level: selectedLevel,
                specialization: selectedSpecialization,
                tech_stack: JSON.stringify(selectedTechStack),
            }

            const candidateResponse = await api.post('/candidates/', candidateData)
            const candidateId = candidateResponse.data.id

            // Then create the interview
            const interviewData = {
                title: `${selectedSpecialization} интервью - ${selectedLevel}`,
                description: `Техническое интервью для позиции ${selectedLevel} ${selectedSpecialization} разработчика`,
                candidate_id: candidateId,
                specialization: selectedSpecialization,
                tech_stack: JSON.stringify(selectedTechStack),
                level: selectedLevel,
                duration: 60,
                scheduled_at: scheduledAt,
            }

            await api.post('/interviews/', interviewData)

            toast.success('Интервью создано успешно!')
            navigate('/dashboard')
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Ошибка при создании интервью')
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

    return (
        <div className="max-w-6xl mx-auto">
            <div className="text-center mb-6">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                    Создание интервью
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Следуйте шагам для создания структурированного технического интервью
                </p>
            </div>

            <StepIndicator currentStep={currentStep} totalSteps={4} />

            <div className="min-h-[400px] pb-8">
                <AnimatePresence mode="wait">
                    {renderStep()}
                </AnimatePresence>
            </div>

            {isLoading && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-xl text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-inter-verse-green dark:border-purple-500 mx-auto mb-4"></div>
                        <p className="text-gray-600 dark:text-gray-400">Создание интервью...</p>
                    </div>
                </div>
            )}
        </div>
    )
}
