interface StepIndicatorProps {
    currentStep: number
    totalSteps: number
}

export default function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
    return (
        <div className="flex items-center justify-center space-x-4 mb-8">
            {Array.from({ length: totalSteps }, (_, index) => {
                const step = index + 1
                const isActive = step === currentStep
                const isCompleted = step < currentStep

                return (
                    <div key={step} className="flex items-center">
                        <div
                            className={`step-indicator ${isActive
                                ? 'active-adaptive'
                                : isCompleted
                                    ? 'completed'
                                    : 'pending'
                                }`}
                        >
                            {isCompleted ? (
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            ) : (
                                step
                            )}
                        </div>
                        {step < totalSteps && (
                            <div
                                className={`w-16 h-1 mx-2 ${step < currentStep ? 'bg-inter-verse-green dark:bg-purple-500' : 'bg-gray-200 dark:bg-gray-700'
                                    }`}
                            />
                        )}
                    </div>
                )
            })}
        </div>
    )
}
