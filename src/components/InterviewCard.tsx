import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'
import { User, Code, Play, Edit } from 'lucide-react'

interface InterviewCardProps {
    interview: {
        id: string
        title: string
        description: string
        status: string
        scheduled_at?: string
        duration: number
        level: string
        specialization: string
        tech_stack: string
        candidate: {
            name: string
            email: string
        }
        created_at: string
    }
    onClick?: () => void
}

const statusColors = {
    scheduled: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-500/30',
    in_progress: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-500/30',
    completed: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-500/30',
    cancelled: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-500/30',
}

const statusLabels = {
    scheduled: 'Запланировано',
    in_progress: 'В процессе',
    completed: 'Завершено',
    cancelled: 'Отменено',
}

const levelColors = {
    intern: 'bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200 border border-gray-300 dark:border-gray-500',
    junior: 'bg-green-200 text-green-800 dark:bg-green-600 dark:text-green-200 border border-green-300 dark:border-green-500',
    middle: 'bg-blue-200 text-blue-800 dark:bg-blue-600 dark:text-blue-200 border border-blue-300 dark:border-blue-500',
    senior: 'bg-purple-200 text-purple-800 dark:bg-purple-600 dark:text-purple-200 border border-purple-300 dark:border-purple-500',
    lead: 'bg-orange-200 text-orange-800 dark:bg-orange-600 dark:text-orange-200 border border-orange-300 dark:border-orange-500',
}

// Specialization without colored background - just text
const specializationColors = {
    frontend: 'text-gray-700 dark:text-gray-300',
    backend: 'text-gray-700 dark:text-gray-300',
    devops: 'text-gray-700 dark:text-gray-300',
    qa: 'text-gray-700 dark:text-gray-300',
    data_science: 'text-gray-700 dark:text-gray-300',
}

export default function InterviewCard({ interview, onClick }: InterviewCardProps) {
    const navigate = useNavigate()

    const handleCardClick = () => {
        if (onClick) {
            onClick()
        } else {
            navigate(`/interviews/${interview.id}/edit-full`)
        }
    }

    const handleEditClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        navigate(`/interviews/${interview.id}/edit-full`)
    }

    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), 'dd MMM yyyy, HH:mm', { locale: ru })
        } catch {
            return dateString
        }
    }

    const getSpecializationLabel = (specialization: string) => {
        const labels: Record<string, string> = {
            frontend: 'Frontend',
            backend: 'Backend',
            devops: 'DevOps',
            qa: 'QA',
            data_science: 'Data Science',
        }
        return labels[specialization] || specialization
    }

    const getLevelLabel = (level: string) => {
        const labels: Record<string, string> = {
            intern: 'Intern',
            junior: 'Junior',
            middle: 'Middle',
            senior: 'Senior',
            lead: 'Lead/CTO',
        }
        return labels[level] || level
    }

    const parseTechStack = (techStack: string | null | undefined) => {
        if (!techStack || techStack === 'null' || techStack === 'undefined') {
            return []
        }
        try {
            const parsed = JSON.parse(techStack)
            // Ensure we always return an array
            if (Array.isArray(parsed)) {
                return parsed
            }
            if (parsed === null || parsed === undefined) {
                return []
            }
            // If it's a single value, wrap it in an array
            return [parsed]
        } catch {
            return []
        }
    }

    const techStack = parseTechStack(interview.tech_stack)

    return (
        <motion.div
            whileHover={{ y: -4 }}
            className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 cursor-pointer hover:shadow-xl transition-all duration-300 group"
            onClick={handleCardClick}
        >
            {/* Header with Status */}
            <div className="mb-4">
                <div className="mb-3">
                    <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border inline-block ${statusColors[interview.status as keyof typeof statusColors]}`}
                    >
                        {statusLabels[interview.status as keyof typeof statusLabels]}
                    </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-inter-verse-green dark:group-hover:text-purple-400 transition-colors">
                    {interview.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {interview.description}
                </p>
            </div>

            {/* Candidate Info */}
            <div className="flex items-center mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mr-3">
                    <User className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                </div>
                <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">{interview.candidate.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{interview.candidate.email}</div>
                </div>
            </div>

            {/* Parameters Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                {/* Specialization */}
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 h-4">Специализация</div>
                    <div className={`text-sm font-medium ${specializationColors[interview.specialization as keyof typeof specializationColors]}`}>
                        {getSpecializationLabel(interview.specialization)}
                    </div>
                </div>

                {/* Level */}
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 h-4">Уровень</div>
                    <div className={`text-sm font-medium px-2 py-1 rounded-md inline-block ${levelColors[interview.level as keyof typeof levelColors]}`}>
                        {getLevelLabel(interview.level)}
                    </div>
                </div>

                {/* Duration */}
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 h-4">Время</div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{interview.duration} мин</div>
                </div>

                {/* Scheduled Date */}
                {interview.scheduled_at && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 h-4">Дата</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatDate(interview.scheduled_at)}</div>
                    </div>
                )}
            </div>

            {/* Tech Stack */}
            {techStack.length > 0 && (
                <div className="mb-4">
                    <div className="flex items-center mb-2">
                        <Code className="w-4 h-4 text-gray-600 dark:text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Технологии</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {techStack.slice(0, 3).map((tech: string, index: number) => (
                            <span
                                key={index}
                                className="px-3 py-1 bg-inter-verse-green/20 text-inter-verse-green dark:bg-purple-600/30 dark:text-purple-200 text-xs font-medium rounded-full border border-inter-verse-green/30 dark:border-purple-500/40 shadow-sm"
                            >
                                {tech}
                            </span>
                        ))}
                        {techStack.length > 3 && (
                            <span className="px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-full border border-gray-300 dark:border-gray-500 shadow-sm">
                                +{techStack.length - 3}
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                    Создано: {formatDate(interview.created_at)}
                </div>
                <div className="flex items-center space-x-2">
                    {interview.status === 'scheduled' && (
                        <button
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 gradient-bg-adaptive text-white rounded-lg hover:opacity-90 transition-colors"
                            title="Начать интервью"
                        >
                            <Play className="w-4 h-4" />
                        </button>
                    )}
                    <button
                        onClick={handleEditClick}
                        className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        title="Редактировать интервью"
                    >
                        <Edit className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </motion.div>
    )
}
