import { ButtonHTMLAttributes, forwardRef } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'icon'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant
    loading?: boolean
}

const variantClass: Record<Variant, string> = {
    primary: 'btn-primary-adaptive',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
    icon: 'btn-icon',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ variant = 'primary', loading, className = '', children, disabled, ...props }, ref) => (
        <button
            ref={ref}
            className={`${variantClass[variant]} ${className} ${disabled || loading ? 'opacity-50 pointer-events-none' : ''}`}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? 'Загрузка...' : children}
        </button>
    )
)

Button.displayName = 'Button'
export default Button
