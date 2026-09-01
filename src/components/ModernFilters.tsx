import { Search, Filter, X } from 'lucide-react'
import ModernSelect from './ModernSelect'
import Card from './ui/Card'
import Button from './ui/Button'

interface FilterOption { value: string; label: string }

interface ModernFiltersProps {
    searchTerm: string
    onSearchChange: (value: string) => void
    statusFilter: string
    onStatusChange: (value: string) => void
    levelFilter: string
    onLevelChange: (value: string) => void
    onApplyFilters: () => void
    onClearFilters: () => void
}

const statusOptions: FilterOption[] = [
    { value: '', label: 'Все статусы' },
    { value: 'scheduled', label: 'Запланировано' },
    { value: 'in_progress', label: 'В процессе' },
    { value: 'completed', label: 'Завершено' },
    { value: 'cancelled', label: 'Отменено' },
]

const levelOptions: FilterOption[] = [
    { value: '', label: 'Все уровни' },
    { value: 'intern', label: 'Intern' },
    { value: 'junior', label: 'Junior' },
    { value: 'middle', label: 'Middle' },
    { value: 'senior', label: 'Senior' },
    { value: 'lead', label: 'Lead' },
]

export default function ModernFilters({
    searchTerm, onSearchChange, statusFilter, onStatusChange,
    levelFilter, onLevelChange, onApplyFilters, onClearFilters,
}: ModernFiltersProps) {
    const hasActive = statusFilter || levelFilter

    return (
        <Card padding="md">
            <div className="flex flex-col lg:flex-row gap-3">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" strokeWidth={1.75} />
                    <input
                        type="text"
                        placeholder="Поиск..."
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="input-field pl-10"
                    />
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                    <ModernSelect options={statusOptions} value={statusFilter} onChange={onStatusChange} placeholder="Статус" className="min-w-[140px]" />
                    <ModernSelect options={levelOptions} value={levelFilter} onChange={onLevelChange} placeholder="Уровень" className="min-w-[140px]" />
                    <Button variant="secondary" onClick={onApplyFilters} className="px-4 py-3">
                        <Filter className="w-4 h-4" /> Применить
                    </Button>
                    {hasActive && (
                        <button onClick={onClearFilters} className="btn-ghost px-3">
                            <X className="w-4 h-4" /> Сброс
                        </button>
                    )}
                </div>
            </div>
        </Card>
    )
}
