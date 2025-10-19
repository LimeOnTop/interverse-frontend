import { Search, Filter, X } from 'lucide-react'
import ModernSelect from './ModernSelect'

interface FilterOption {
    value: string
    label: string
    icon?: React.ReactNode
}

interface CandidateFiltersProps {
    searchTerm: string
    onSearchChange: (value: string) => void
    levelFilter: string
    onLevelChange: (value: string) => void
    specializationFilter: string
    onSpecializationChange: (value: string) => void
    onApplyFilters: () => void
    onClearFilters: () => void
}

const levelOptions: FilterOption[] = [
    { value: '', label: 'Все уровни' },
    { value: 'intern', label: 'Intern' },
    { value: 'junior', label: 'Junior' },
    { value: 'middle', label: 'Middle' },
    { value: 'senior', label: 'Senior' },
    { value: 'lead', label: 'Lead/CTO' },
]

const specializationOptions: FilterOption[] = [
    { value: '', label: 'Все специализации' },
    { value: 'frontend', label: 'Frontend' },
    { value: 'backend', label: 'Backend' },
    { value: 'devops', label: 'DevOps' },
    { value: 'qa', label: 'QA' },
    { value: 'data_science', label: 'Data Science' },
]

export default function CandidateFilters({
    searchTerm,
    onSearchChange,
    levelFilter,
    onLevelChange,
    specializationFilter,
    onSpecializationChange,
    onApplyFilters,
    onClearFilters,
}: CandidateFiltersProps) {
    const hasActiveFilters = levelFilter || specializationFilter

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Поиск по имени, email или специализации..."
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-inter-verse-green focus:border-transparent transition-all duration-200 hover:bg-white"
                        />
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <ModernSelect
                        options={levelOptions}
                        value={levelFilter}
                        onChange={onLevelChange}
                        placeholder="Уровень"
                        className="min-w-[160px]"
                    />

                    <ModernSelect
                        options={specializationOptions}
                        value={specializationFilter}
                        onChange={onSpecializationChange}
                        placeholder="Специализация"
                        className="min-w-[160px]"
                    />

                    {/* Action buttons */}
                    <div className="flex gap-2">
                        <button
                            onClick={onApplyFilters}
                            className="px-4 py-3 gradient-bg-adaptive text-white rounded-xl font-medium hover:opacity-90 transition-all duration-200 flex items-center space-x-2 shadow-sm hover:shadow-md"
                        >
                            <Filter className="w-4 h-4" />
                            <span>Применить</span>
                        </button>

                        {hasActiveFilters && (
                            <button
                                onClick={onClearFilters}
                                className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all duration-200 flex items-center space-x-2"
                            >
                                <X className="w-4 h-4" />
                                <span>Очистить</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Active filters display */}
            {hasActiveFilters && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-2 flex-wrap gap-2">
                        <span className="text-sm text-gray-600">Активные фильтры:</span>
                        {levelFilter && (
                            <span className="filter-chip filter-chip-blue">
                                Уровень: {levelOptions.find(opt => opt.value === levelFilter)?.label}
                                <button
                                    onClick={() => onLevelChange('')}
                                    className="ml-2 hover:text-blue-600 transition-colors"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        )}
                        {specializationFilter && (
                            <span className="filter-chip filter-chip-purple">
                                Специализация: {specializationOptions.find(opt => opt.value === specializationFilter)?.label}
                                <button
                                    onClick={() => onSpecializationChange('')}
                                    className="ml-2 hover:text-purple-600 transition-colors"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
