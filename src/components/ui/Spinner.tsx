interface SpinnerProps {
    size?: 'sm' | 'md' | 'lg'
    className?: string
}

const sizes = { sm: 'h-6 w-6', md: 'h-10 w-10', lg: 'h-12 w-12' }

export default function Spinner({ size = 'md', className = '' }: SpinnerProps) {
    return (
        <div className={`flex items-center justify-center ${className}`}>
            <div className={`iv-spinner ${sizes[size]}`} />
        </div>
    )
}
