interface StepIndicatorProps {
    currentStep: number
    totalSteps: number
}

export default function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
    const progress = ((currentStep - 1) / (totalSteps - 1)) * 100

    return (
        <div className="mb-5 sm:mb-8">
            <div className="wizard-progress mb-4 sm:mb-6">
                <div className="wizard-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex items-center justify-center gap-1 sm:gap-2">
                {Array.from({ length: totalSteps }, (_, i) => {
                    const step = i + 1
                    const isActive = step === currentStep
                    const isCompleted = step < currentStep
                    return (
                        <div key={step} className="flex items-center">
                            <div className={`step-indicator ${isActive ? 'active-adaptive' : isCompleted ? 'completed' : 'pending'}`}>
                                {isCompleted ? (
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                ) : step}
                            </div>
                            {step < totalSteps && (
                                <div className={`w-8 sm:w-12 h-0.5 mx-1 ${isCompleted ? 'bg-inter-verse-green dark:bg-purple-500' : 'bg-gray-200 dark:bg-gray-600'}`} />
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
