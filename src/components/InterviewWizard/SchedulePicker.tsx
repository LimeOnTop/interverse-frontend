import PracticeTimeFields from '../PracticeTimeFields'
import { localParts } from '../../lib/practiceTime'
export function nextSlot(from = new Date()) {
    const date = new Date(from); date.setSeconds(0, 0); date.setMinutes(Math.floor(date.getMinutes() / 15) * 15 + 15)
    const parts = localParts(date, Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Moscow')
    return `${parts.day}T${parts.time}`
}
export default function SchedulePicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
    return <PracticeTimeFields value={value || nextSlot()} onChange={onChange} />
}
