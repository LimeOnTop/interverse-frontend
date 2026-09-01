import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
    variant?: 'default' | 'underlined'
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, variant = 'default', className = '', id, ...props }, ref) => {
        const inputClass = variant === 'underlined' ? 'input-field-underlined' : 'input-field'

        return (
            <div className="w-full">
                {label && (
                    <label htmlFor={id} className="block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
                        {label}
                    </label>
                )}
                <input ref={ref} id={id} className={`${inputClass} ${className}`} {...props} />
                {error && <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{error}</p>}
            </div>
        )
    }
)

Input.displayName = 'Input'
export default Input
