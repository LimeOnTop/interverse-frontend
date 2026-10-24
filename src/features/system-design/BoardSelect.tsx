import { useState } from 'react'
import * as Select from '@radix-ui/react-select'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'

export default function BoardSelect({
    id,
    label,
    value,
    onChange,
    options,
}: {
    id: string
    label: string
    value: string
    onChange: (value: string) => void
    options: { value: string; label: string; disabled?: boolean; hint?: string }[]
}) {
    const [keyboard, setKeyboard] = useState(false)
    return (
        <Select.Root value={value} onValueChange={onChange}>
            <Select.Trigger
                onPointerDown={() => setKeyboard(false)}
                onKeyDown={() => setKeyboard(true)}
                id={id}
                aria-label={label}
                className="sd-select-trigger"
            >
                <Select.Value placeholder="Выберите блок" />
                <Select.Icon>
                    <ChevronDown size={16} />
                </Select.Icon>
            </Select.Trigger>
            <Select.Portal container={(document.fullscreenElement as HTMLElement) || undefined}>
                <Select.Content
                    data-keyboard={keyboard || undefined}
                    position="popper"
                    sideOffset={6}
                    collisionPadding={12}
                    className="sd-select-content"
                >
                    <Select.ScrollUpButton className="sd-select-scroll">
                        <ChevronUp size={16} />
                    </Select.ScrollUpButton>
                    <Select.Viewport className="sd-select-viewport">
                        {options.map((option) => (
                            <Select.Item
                                key={option.value}
                                value={option.value}
                                disabled={option.disabled}
                                className="sd-select-option"
                            >
                                <Select.ItemText>{option.label}</Select.ItemText>
                                {option.hint && <span className="sd-select-hint">{option.hint}</span>}
                                <Select.ItemIndicator>
                                    <Check size={16} />
                                </Select.ItemIndicator>
                            </Select.Item>
                        ))}
                    </Select.Viewport>
                    <Select.ScrollDownButton className="sd-select-scroll">
                        <ChevronDown size={16} />
                    </Select.ScrollDownButton>
                </Select.Content>
            </Select.Portal>
        </Select.Root>
    )
}
