import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { api } from '../services/api'
import toast from 'react-hot-toast'
import { Calendar } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import PageTransition from '../components/ui/PageTransition'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import Input from '../components/ui/Input'

interface InterviewData {
    id: string
    title: string
    description: string
    status: string
    scheduled_at: string
    level: string
    specialization: string
    tech_stack: string
}

export default function EditInterviewFullPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()

    const [isLoading, setIsLoading] = useState(false)
    const [isLoadingData, setIsLoadingData] = useState(true)

    const [interviewData, setInterviewData] = useState<InterviewData>({
        id: '',
        title: '',
        description: '',
        status: '',
        scheduled_at: '',
        level: '',
        specialization: '',
        tech_stack: '',
    })

    const [techStack, setTechStack] = useState<string[]>([])

    useEffect(() => {
        if (id) {
            fetchData()
        }
    }, [id])

    const fetchData = async () => {
        try {
            setIsLoadingData(true)

            const interviewResponse = await api.get(`/interviews/${id}`)
            const interview = interviewResponse.data.interview

            setInterviewData({
                id: interview.id,
                title: interview.title || '',
                description: interview.description || '',
                status: interview.status || 'scheduled',
                scheduled_at: interview.scheduled_at || '',
                level: interview.level || '',
                specialization: interview.specialization || '',
                tech_stack: interview.tech_stack || '',
            })

            if (interview.tech_stack) {
                try {
                    const parsed = JSON.parse(interview.tech_stack)
                    setTechStack(Array.isArray(parsed) ? parsed : [])
                } catch {
                    setTechStack([])
                }
            }
        } catch (error: any) {
            toast.error('Ошибка при загрузке данных тренировки')
            navigate('/dashboard')
        } finally {
            setIsLoadingData(false)
        }
    }

    const handleSubmit = async () => {
        if (!id) {
            toast.error('ID тренировки не найден')
            return
        }

        setIsLoading(true)
        try {
            await api.put(`/interviews/${id}`, {
                title: interviewData.title,
                description: interviewData.description,
                status: interviewData.status,
                scheduled_at: interviewData.scheduled_at,
                specialization: interviewData.specialization,
                level: interviewData.level,
                tech_stack: JSON.stringify(techStack),
            })

            toast.success('Тренировка обновлена')
            navigate('/dashboard')
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Ошибка при обновлении данных')
        } finally {
            setIsLoading(false)
        }
    }

    const addTechStackItem = (tech: string) => {
        if (tech && !techStack.includes(tech)) {
            setTechStack([...techStack, tech])
        }
    }

    const removeTechStackItem = (index: number) => {
        setTechStack(techStack.filter((_, i) => i !== index))
    }

    if (isLoadingData) return <Spinner size="lg" className="h-96" />

    return (
        <PageTransition className="max-w-3xl mx-auto">
            <PageHeader
                title="Редактирование тренировки"
                description="Обновите параметры тренировки"
            />

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card padding="lg">
                    <div className="flex items-center gap-3 mb-6">
                        <Calendar className="w-5 h-5 text-inter-verse-green dark:text-purple-400" />
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            Параметры тренировки
                        </h2>
                    </div>

                    <div className="space-y-5">
                        <Input
                            label="Название"
                            type="text"
                            value={interviewData.title}
                            onChange={(e) => setInterviewData({ ...interviewData, title: e.target.value })}
                            variant="underlined"
                            placeholder="Название тренировки"
                        />

                        <div>
                            <label className="block text-xs font-medium uppercase tracking-wide text-secondary mb-2">Описание</label>
                            <textarea
                                value={interviewData.description}
                                onChange={(e) => setInterviewData({ ...interviewData, description: e.target.value })}
                                className="input-field-underlined w-full"
                                placeholder="Описание тренировки"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium uppercase tracking-wide text-secondary mb-2">Статус</label>
                            <select
                                value={interviewData.status}
                                onChange={(e) => setInterviewData({ ...interviewData, status: e.target.value })}
                                className="input-field-underlined w-full"
                            >
                                <option value="scheduled">Запланировано</option>
                                <option value="in_progress">В процессе</option>
                                <option value="completed">Завершено</option>
                                <option value="cancelled">Отменено</option>
                            </select>
                        </div>

                        <Input
                            label="Дата и время"
                            type="datetime-local"
                            value={interviewData.scheduled_at ? new Date(interviewData.scheduled_at).toISOString().slice(0, 16) : ''}
                            onChange={(e) => {
                                const date = e.target.value ? new Date(e.target.value).toISOString() : ''
                                setInterviewData({ ...interviewData, scheduled_at: date })
                            }}
                            variant="underlined"
                        />

                        <div>
                            <label className="block text-xs font-medium uppercase tracking-wide text-secondary mb-2">Специализация</label>
                            <select
                                value={interviewData.specialization}
                                onChange={(e) => setInterviewData({ ...interviewData, specialization: e.target.value })}
                                className="input-field-underlined w-full"
                            >
                                <option value="">Выберите специализацию</option>
                                <option value="frontend">Frontend</option>
                                <option value="backend">Backend</option>
                                <option value="devops">DevOps</option>
                                <option value="qa">QA</option>
                                <option value="data_science">Data Science</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium uppercase tracking-wide text-secondary mb-2">Уровень</label>
                            <select
                                value={interviewData.level}
                                onChange={(e) => setInterviewData({ ...interviewData, level: e.target.value })}
                                className="input-field-underlined w-full"
                            >
                                <option value="">Выберите уровень</option>
                                <option value="intern">Intern</option>
                                <option value="junior">Junior</option>
                                <option value="middle">Middle</option>
                                <option value="senior">Senior</option>
                                <option value="lead">Lead/CTO</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium uppercase tracking-wide text-secondary mb-2">Технологии</label>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {techStack.map((tech, index) => (
                                    <Badge key={index} variant="success" className="gap-2">
                                        {tech}
                                        <button type="button" onClick={() => removeTechStackItem(index)} className="hover:opacity-70">×</button>
                                    </Badge>
                                ))}
                            </div>
                            <input
                                type="text"
                                placeholder="Добавить технологию (Enter)"
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault()
                                        addTechStackItem(e.currentTarget.value)
                                        e.currentTarget.value = ''
                                    }
                                }}
                                className="input-field-underlined w-full"
                            />
                        </div>
                    </div>
                </Card>
            </motion.div>

            <div className="flex justify-end gap-4 mt-8">
                <Button variant="secondary" onClick={() => navigate('/dashboard')}>Отмена</Button>
                <Button onClick={handleSubmit} loading={isLoading}>
                    {isLoading ? 'Сохранение...' : 'Сохранить изменения'}
                </Button>
            </div>

            {isLoading && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card padding="lg" className="text-center">
                        <Spinner size="lg" />
                        <p className="text-secondary mt-4">Обновление данных...</p>
                    </Card>
                </div>
            )}
        </PageTransition>
    )
}
