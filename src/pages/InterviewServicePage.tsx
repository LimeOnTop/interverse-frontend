import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Clock, User, Play, ArrowRight } from 'lucide-react'
import { api } from '../services/api'
import toast from 'react-hot-toast'
import { useTheme } from '../contexts/ThemeContext'

interface Interview {
    id: string
    title: string
    description: string
    scheduled_at: string
    duration: number
    level: string
    specialization: string
    candidate: {
        name: string
        email: string
    }
}

export default function InterviewServicePage() {
    const { isDark } = useTheme()
    const [interviews, setInterviews] = useState<Interview[]>([])
    const [loading, setLoading] = useState(true)
    // Removed unused local selection state to avoid TS6133
    const [generating, setGenerating] = useState(false)

    useEffect(() => {
        fetchScheduledInterviews()
    }, [])

    const fetchScheduledInterviews = async () => {
        try {
            setLoading(true)
            const response = await api.get('/interviews/scheduled')
            setInterviews(response.data.interviews || [])
        } catch (error: any) {
            console.error('Error fetching interviews:', error)
            toast.error('Ошибка при загрузке интервью')
        } finally {
            setLoading(false)
        }
    }

    const handleStartInterview = async (interview: Interview) => {
        try {
            setGenerating(true)
            const response = await api.post('/interviews/generate-questions', {
                interview_id: interview.id
            })

            // Сохраняем данные в localStorage для передачи на страницу интервью
            localStorage.setItem('interview-session', JSON.stringify({
                sessionId: response.data.session_id,
                questions: response.data.questions,
                interview: response.data.interview
            }))

            toast.success('Вопросы сгенерированы! Переходим к интервью...')

            // Перенаправляем на страницу интервью
            setTimeout(() => {
                window.location.href = `/interview/${interview.id}`
            }, 1000)

        } catch (error: any) {
            console.error('Error generating questions:', error)
            toast.error('Ошибка при генерации вопросов')
        } finally {
            setGenerating(false)
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

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${isDark ? 'border-inter-verse-green' : 'border-inter-verse-green'}`}></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Сервис интервью</h1>
                <p className={`mt-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Выберите интервью для проведения и сгенерируйте вопросы</p>
            </div>

            {interviews.length === 0 ? (
                <div className="text-center py-12">
                    <Calendar className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                    <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Нет запланированных интервью
                    </h3>
                    <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        Создайте интервью в разделе "Создать интервью", чтобы начать работу
                    </p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {interviews.map((interview, index) => (
                        <motion.div
                            key={interview.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`rounded-2xl border p-6 shadow-sm hover:shadow-md transition-shadow ${isDark
                                ? 'bg-gray-800 border-gray-700'
                                : 'bg-white border-gray-200'
                                }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center mb-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-3 ${isDark ? 'bg-blue-900/20' : 'bg-blue-100'
                                            }`}>
                                            <Calendar className={`w-5 h-5 ${isDark ? 'text-blue-300' : 'text-blue-600'}`} />
                                        </div>
                                        <div>
                                            <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                {interview.title}
                                            </h3>
                                            <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{interview.description}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div className={`flex items-center text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                            <User className="w-4 h-4 mr-2" />
                                            <span className="font-medium">{interview.candidate.name}</span>
                                            <span className="mx-2">•</span>
                                            <span>{interview.candidate.email}</span>
                                        </div>

                                        <div className={`flex items-center text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                            <Clock className="w-4 h-4 mr-2" />
                                            <span>{interview.duration} минут</span>
                                        </div>

                                        <div className={`flex items-center text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                            <span className="font-medium">
                                                {getSpecializationLabel(interview.specialization)}
                                            </span>
                                            <span className="mx-2">•</span>
                                            <span>{getLevelLabel(interview.level)}</span>
                                        </div>

                                        <div className={`flex items-center text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                            <Calendar className="w-4 h-4 mr-2" />
                                            <span>{formatDate(interview.scheduled_at)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="ml-6">
                                    <button
                                        onClick={() => handleStartInterview(interview)}
                                        disabled={generating}
                                        className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2 ${generating
                                            ? isDark
                                                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'gradient-bg-adaptive text-white hover:opacity-90 shadow-lg hover:shadow-xl'
                                            }`}
                                    >
                                        <Play className="w-5 h-5" />
                                        <span>
                                            {generating ? 'Генерируем...' : 'Начать интервью'}
                                        </span>
                                        <ArrowRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    )
}
