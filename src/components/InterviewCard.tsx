import { useState } from 'react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'
import { User, Code, Play, Edit, Loader2, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '../services/api'
import { canStartInterview, startInterviewSession, clearInterviewSessionCache } from '../lib/interviewSession'
import Badge, { statusBadgeVariant } from './ui/Badge'
import Card from './ui/Card'

interface InterviewCardProps {
    interview: {
        id: string
        title: string
        description: string
        status: string
        scheduled_at?: string
        duration?: number
        level: string
        specialization: string
        tech_stack?: string
        technologies?: string[]
        created_at: string
    }
    onClick?: () => void
    onDelete?: (id: string) => void
}

const statusLabels: Record<string, string> = {
    scheduled: 'Запланировано',
    in_progress: 'В процессе',
    completed: 'Завершено',
    cancelled: 'Отменено',
}

const levelLabels: Record<string, string> = {
    intern: 'Intern', junior: 'Junior', middle: 'Middle', senior: 'Senior', lead: 'Lead',
}

const specLabels: Record<string, string> = {
    frontend: 'Frontend', backend: 'Backend', devops: 'DevOps', qa: 'QA', data_science: 'Data Science',
}

export default function InterviewCard({ interview, onClick, onDelete }: InterviewCardProps) {
    const navigate = useNavigate()
    const [starting, setStarting] = useState(false)
    const [deleting, setDeleting] = useState(false)

    const handleClick = () => {
        if (onClick) onClick()
        else navigate(`/interviews/${interview.id}/edit-full`)
    }

    const handleStart = async (e: React.MouseEvent) => {
        e.stopPropagation()

        if (!canStartInterview(interview.status)) {
            return
        }

        try {
            setStarting(true)
            await startInterviewSession(api, interview.id)
            toast.success('Тренировка запущена')
            navigate(`/interview/${interview.id}`)
        } catch (error) {
            console.error('Error starting interview:', error)
            toast.error('Не удалось запустить тренировку')
        } finally {
            setStarting(false)
        }
    }

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation()

        if (!window.confirm('Удалить эту тренировку?')) {
            return
        }

        try {
            setDeleting(true)
            await api.delete(`/interviews/${interview.id}`)
            clearInterviewSessionCache(interview.id)
            toast.success('Тренировка удалена')
            onDelete?.(interview.id)
        } catch (error) {
            console.error('Error deleting interview:', error)
            toast.error('Не удалось удалить тренировку')
        } finally {
            setDeleting(false)
        }
    }

    const formatDate = (d: string) => {
        try { return format(new Date(d), 'dd MMM yyyy, HH:mm', { locale: ru }) }
        catch { return d }
    }

    const parseTechStack = (ts: string) => {
        if (!ts || ts === 'null') return []
        try {
            const p = JSON.parse(ts)
            return Array.isArray(p) ? p : p ? [p] : []
        } catch { return [] }
    }

    const techStack = interview.technologies?.length
        ? interview.technologies
        : parseTechStack(interview.tech_stack || '')

    return (
        <Card hover padding="md" onClick={handleClick} className="group h-full flex flex-col">
            <div className="mb-4">
                <Badge variant={statusBadgeVariant(interview.status || '')} className="mb-3">
                    {statusLabels[interview.status || ''] || interview.status}
                </Badge>
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 group-hover:text-inter-verse-green dark:group-hover:text-purple-400 transition-iv line-clamp-1">
                    {interview.title}
                </h3>
                <p className="text-secondary text-sm mt-1 line-clamp-2">{interview.description}</p>
            </div>

            <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 dark:bg-iv-dark-bg border border-gray-100 dark:border-gray-600">
                <div className="w-9 h-9 flex items-center justify-center bg-white dark:bg-iv-dark-surface border border-gray-200 dark:border-gray-600 shrink-0">
                    <User className="w-4 h-4 text-gray-500" strokeWidth={1.75} />
                </div>
                <div className="min-w-0">
                    <div className="text-sm font-medium truncate">
                        {specLabels[interview.specialization] || interview.specialization}
                    </div>
                    <div className="text-xs text-secondary truncate">
                        {levelLabels[interview.level] || interview.level}
                        {interview.scheduled_at ? ` · ${formatDate(interview.scheduled_at)}` : ''}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                <div className="p-2 bg-gray-50 dark:bg-iv-dark-bg border border-gray-100 dark:border-gray-600">
                    <div className="text-xs text-secondary mb-0.5">Специализация</div>
                    <div className="font-medium">{specLabels[interview.specialization] || interview.specialization}</div>
                </div>
                <div className="p-2 bg-gray-50 dark:bg-iv-dark-bg border border-gray-100 dark:border-gray-600">
                    <div className="text-xs text-secondary mb-0.5">Уровень</div>
                    <span className="iv-chip text-xs">{levelLabels[interview.level] || interview.level}</span>
                </div>
            </div>

            {techStack.length > 0 && (
                <div className="mb-4">
                    <div className="flex items-center gap-1.5 mb-2 text-xs text-secondary">
                        <Code className="w-3.5 h-3.5" /> Технологии
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {techStack.slice(0, 3).map((t: string, i: number) => (
                            <span key={i} className="iv-chip">{t}</span>
                        ))}
                        {techStack.length > 3 && <span className="iv-chip">+{techStack.length - 3}</span>}
                    </div>
                </div>
            )}

            <div className="mt-auto pt-4 iv-divider flex items-center justify-between">
                <span className="text-xs text-secondary">{formatDate(interview.created_at)}</span>
                <div className="flex gap-2">
                    {canStartInterview(interview.status) && (
                        <button
                            type="button"
                            onClick={handleStart}
                            disabled={starting}
                            className="iv-play-btn"
                            aria-label="Начать тренировку"
                        >
                            {starting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Play className="w-4 h-4" strokeWidth={2} />
                            )}
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); navigate(`/interviews/${interview.id}/edit-full`) }}
                        className="btn-icon w-9 h-9"
                        aria-label="Редактировать тренировку"
                    >
                        <Edit className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={deleting}
                        className="btn-icon w-9 h-9 hover:text-red-500 dark:hover:text-red-500 disabled:opacity-50"
                        aria-label="Удалить тренировку"
                    >
                        {deleting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Trash2 className="w-4 h-4" />
                        )}
                    </button>
                </div>
            </div>
        </Card>
    )
}
