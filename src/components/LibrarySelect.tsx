import '../styles/select.css'
import * as Select from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'

interface LibrarySelectProps {
    id?: string
    className?: string
    menuClassName?: string
    label: string
    value: string
    onChange: (value: string) => void
    options: { value: string; label: string }[]
}

export default function LibrarySelect({ id, className = '', menuClassName = '', label, value, onChange, options }: LibrarySelectProps) {
    return (
        <Select.Root value={value} onValueChange={onChange}>
            <Select.Trigger id={id} className={`lib-select-trigger ${className}`} aria-label={label}>
                <Select.Value />
                <Select.Icon><ChevronDown size={15} /></Select.Icon>
            </Select.Trigger>
            <Select.Portal>
                <Select.Content className={`lib-select-menu ${menuClassName}`} position="popper" sideOffset={7} collisionPadding={12}>
                    <Select.Viewport>
                        {options.map(option => (
                            <Select.Item className="lib-select-option" key={option.value} value={option.value}>
                                <Select.ItemText>{option.label}</Select.ItemText>
                                <Select.ItemIndicator><Check size={15} /></Select.ItemIndicator>
                            </Select.Item>
                        ))}
                    </Select.Viewport>
                </Select.Content>
            </Select.Portal>
        </Select.Root>
    )
}
