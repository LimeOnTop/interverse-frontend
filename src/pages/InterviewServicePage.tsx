import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Calendar, Clock, Play, ArrowRight } from 'lucide-react'
import { api } from '../services/api'
import {
    startInterviewSession,
    formatSessionStartError,
} from '../lib/interviewSession'
import toast from 'react-hot-toast'
import PageHeader from '../components/ui/PageHeader'
import PageTransition from '../components/ui/PageTransition'
import Card from '../components/ui/Card'
import EmptyState from '../components/ui/EmptyState'
import Spinner from '../components/ui/Spinner'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'

interface Interview {
    id: string
    title: string
    description: string
    scheduled_at: string
    duration?: number
    level: string
    specialization: string
}

export default function InterviewServicePage() {
    const navigate = useNavigate()
    const [interviews, setInterviews] = useState<Interview[]>([])
    const [loading, setLoading] = useState(true)
    const [startingId, setStartingId] = useState<string | null>(null)

    useEffect(() => {
        fetchScheduledInterviews()
    }, [])

    const fetchScheduledInterviews = async () => {
        try {
            setLoading(true)
            const response = await api.get('/interviews/?status=scheduled')
            console.log('Fetched interviews:', response.data)
            const interviewsList = response.data.interviews || []
            console.log('Interviews list:', interviewsList)
            setInterviews(interviewsList)
        } catch (error: any) {
            console.error('Error fetching interviews:', error)
            toast.error('Ошибка при загрузке интервью')
        } finally {
            setLoading(false)
        }
    }

    const handleStartInterview = async (interview: Interview) => {
        try {
            setStartingId(interview.id)
            await startInterviewSession(api, interview.id)
            toast.success('Тренировка запущена!')
            navigate(`/interview/${interview.id}`)
        } catch (error: any) {
            console.error('Error starting session:', error)
            toast.error(formatSessionStartError(error))
        } finally {
            setStartingId(null)
        }
    }

    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleDateString('ru-RU', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        } catch {
            return dateString
        }
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

    if (loading) return <Spinner size="lg" className="h-96" />

    return (
        <PageTransition className="space-y-8">
            <PageHeader
                title="Тренировки"
                description="Выберите запланированную тренировку и начните прохождение"
            />

            {interviews.length === 0 ? (
                <EmptyState
                    icon={Calendar}
                    title="Нет запланированных интервью"
                    description='Создайте интервью в разделе "Создать интервью", чтобы начать работу'
                />
            ) : (
                <div className="grid gap-4">
                    {interviews.map((interview, index) => (
                        <motion.div
                            key={interview.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05, duration: 0.4 }}
                        >
                            <Card hover padding="md">
                                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                                    <div className="flex-1">
                                        <div className="flex items-start gap-3 mb-4">
                                            <div className="w-10 h-10 gradient-bg-adaptive flex items-center justify-center shrink-0">
                                                <Calendar className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                                    {interview.title}
                                                </h3>
                                                <p className="text-secondary text-sm mt-1">{interview.description}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-secondary">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 shrink-0" />
                                                {interview.duration || 60} минут
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="info">{getSpecializationLabel(interview.specialization)}</Badge>
                                                <Badge>{getLevelLabel(interview.level)}</Badge>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 shrink-0" />
                                                {formatDate(interview.scheduled_at)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="shrink-0">
                                        <Button
                                            onClick={() => handleStartInterview(interview)}
                                            disabled={startingId !== null}
                                            loading={startingId === interview.id}
                                        >
                                            <Play className="w-5 h-5" />
                                            {startingId === interview.id ? 'Запуск...' : 'Начать интервью'}
                                            <ArrowRight className="w-5 h-5" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}
        </PageTransition>
    )
}
