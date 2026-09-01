import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { api } from '../services/api'
import toast from 'react-hot-toast'
import { User, Calendar } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import PageTransition from '../components/ui/PageTransition'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import Input from '../components/ui/Input'

interface CandidateData {
    id: string
    name: string
    email: string
    phone: string
    position: string
    experience: number
    skills: string
    resume_url: string
    linkedin_url: string
    github_url: string
    status: string
}

interface InterviewData {
    id: string
    title: string
    description: string
    status: string
    scheduled_at: string
    level: string
    specialization: string
    tech_stack: string
    candidate_id: string
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
        candidate_id: '',
    })

    const [candidateData, setCandidateData] = useState<CandidateData>({
        id: '',
        name: '',
        email: '',
        phone: '',
        position: '',
        experience: 0,
        skills: '',
        resume_url: '',
        linkedin_url: '',
        github_url: '',
        status: '',
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
                candidate_id: interview.candidate_id || '',
            })

            if (interview.tech_stack) {
                try {
                    const parsed = JSON.parse(interview.tech_stack)
                    setTechStack(Array.isArray(parsed) ? parsed : [])
                } catch {
                    setTechStack([])
                }
            }

            if (interview.candidate_id) {
                try {
                    const candidateResponse = await api.get(`/candidates/${interview.candidate_id}`)
                    const candidate = candidateResponse.data.candidate

                    setCandidateData({
                        id: candidate.id,
                        name: candidate.name || '',
                        email: candidate.email || '',
                        phone: candidate.phone || '',
                        position: candidate.position || '',
                        experience: Number(candidate.experience) || 0,
                        skills: candidate.skills || '',
                        resume_url: candidate.resume_url || '',
                        linkedin_url: candidate.linkedin_url || '',
                        github_url: candidate.github_url || '',
                        status: candidate.status || 'active',
                    })
                } catch (error: any) {
                    console.error('Failed to fetch candidate:', error)
                    toast.error('Не удалось загрузить данные кандидата')
                }
            }
        } catch (error: any) {
            toast.error('Ошибка при загрузке данных интервью')
            navigate('/dashboard')
        } finally {
            setIsLoadingData(false)
        }
    }

    const handleSubmit = async () => {
        if (!id) {
            toast.error('ID интервью не найден')
            return
        }

        setIsLoading(true)
        try {
            const interviewUpdateData = {
                title: interviewData.title,
                description: interviewData.description,
                status: interviewData.status,
                scheduled_at: interviewData.scheduled_at,
                specialization: interviewData.specialization,
                level: interviewData.level,
                tech_stack: JSON.stringify(techStack),
            }

            await api.put(`/interviews/${id}`, interviewUpdateData)

            if (candidateData.id) {
                const candidateUpdateData = {
                    name: candidateData.name,
                    email: candidateData.email,
                    phone: candidateData.phone,
                    position: candidateData.position,
                    experience: Number(candidateData.experience) || 0,
                    skills: candidateData.skills,
                    resume_url: candidateData.resume_url,
                    linkedin_url: candidateData.linkedin_url,
                    github_url: candidateData.github_url,
                    status: candidateData.status,
                }

                await api.put(`/candidates/${candidateData.id}`, candidateUpdateData)
            }

            toast.success('Интервью и данные кандидата обновлены успешно!')
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
        <PageTransition className="max-w-6xl mx-auto">
            <PageHeader
                title="Редактирование интервью"
                description="Обновите информацию об интервью и данные кандидата"
            />

            <div className="grid md:grid-cols-2 gap-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <Card padding="lg">
                        <div className="flex items-center gap-3 mb-6">
                            <Calendar className="w-5 h-5 text-inter-verse-green dark:text-purple-400" />
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                Информация об интервью
                            </h2>
                        </div>

                        <div className="space-y-5">
                            <Input
                                label="Название"
                                type="text"
                                value={interviewData.title}
                                onChange={(e) => setInterviewData({ ...interviewData, title: e.target.value })}
                                variant="underlined"
                                placeholder="Название интервью"
                            />

                            <div>
                                <label className="block text-xs font-medium uppercase tracking-wide text-secondary mb-2">Описание</label>
                                <textarea
                                    value={interviewData.description}
                                    onChange={(e) => setInterviewData({ ...interviewData, description: e.target.value })}
                                    className="input-field-underlined w-full"
                                    placeholder="Описание интервью"
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

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Card padding="lg">
                        <div className="flex items-center gap-3 mb-6">
                            <User className="w-5 h-5 text-inter-verse-green dark:text-purple-400" />
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                Данные кандидата
                            </h2>
                        </div>

                        <div className="space-y-5">
                            <Input label="ФИО" type="text" value={candidateData.name} onChange={(e) => setCandidateData({ ...candidateData, name: e.target.value })} variant="underlined" placeholder="Имя кандидата" />
                            <Input label="Email" type="email" value={candidateData.email} onChange={(e) => setCandidateData({ ...candidateData, email: e.target.value })} variant="underlined" placeholder="email@example.com" />
                            <Input label="Телефон" type="tel" value={candidateData.phone} onChange={(e) => setCandidateData({ ...candidateData, phone: e.target.value })} variant="underlined" placeholder="+7 (999) 123-45-67" />
                            <Input label="Позиция" type="text" value={candidateData.position} onChange={(e) => setCandidateData({ ...candidateData, position: e.target.value })} variant="underlined" placeholder="Должность" />
                            <Input label="Опыт работы" type="number" min={0} value={candidateData.experience} onChange={(e) => setCandidateData({ ...candidateData, experience: Number(e.target.value) || 0 })} variant="underlined" placeholder="Лет опыта" />

                            <div>
                                <label className="block text-xs font-medium uppercase tracking-wide text-secondary mb-2">Навыки</label>
                                <textarea value={candidateData.skills} onChange={(e) => setCandidateData({ ...candidateData, skills: e.target.value })} className="input-field-underlined w-full" placeholder="Список навыков" />
                            </div>

                            <Input label="Ссылка на резюме" type="url" value={candidateData.resume_url} onChange={(e) => setCandidateData({ ...candidateData, resume_url: e.target.value })} variant="underlined" placeholder="https://example.com/resume.pdf" />
                            <Input label="LinkedIn" type="url" value={candidateData.linkedin_url} onChange={(e) => setCandidateData({ ...candidateData, linkedin_url: e.target.value })} variant="underlined" placeholder="https://linkedin.com/in/username" />
                            <Input label="GitHub" type="url" value={candidateData.github_url} onChange={(e) => setCandidateData({ ...candidateData, github_url: e.target.value })} variant="underlined" placeholder="https://github.com/username" />

                            <div>
                                <label className="block text-xs font-medium uppercase tracking-wide text-secondary mb-2">Статус кандидата</label>
                                <select value={candidateData.status} onChange={(e) => setCandidateData({ ...candidateData, status: e.target.value })} className="input-field-underlined w-full">
                                    <option value="active">Активный</option>
                                    <option value="archived">Архивирован</option>
                                </select>
                            </div>
                        </div>
                    </Card>
                </motion.div>
            </div>

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
