import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { api } from '../services/api'
import toast from 'react-hot-toast'
import { User, Mail, Phone, Briefcase, Award, FileText, Linkedin, Github, Calendar } from 'lucide-react'

interface CandidateData {
    id: string
    name: string
    email: string
    phone: string
    position: string
    experience: string
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

    // Interview data
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

    // Candidate data
    const [candidateData, setCandidateData] = useState<CandidateData>({
        id: '',
        name: '',
        email: '',
        phone: '',
        position: '',
        experience: '',
        skills: '',
        resume_url: '',
        linkedin_url: '',
        github_url: '',
        status: '',
    })

    // Tech stack
    const [techStack, setTechStack] = useState<string[]>([])

    useEffect(() => {
        if (id) {
            fetchData()
        }
    }, [id])

    const fetchData = async () => {
        try {
            setIsLoadingData(true)

            // Fetch interview
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

            // Parse tech stack
            if (interview.tech_stack) {
                try {
                    const parsed = JSON.parse(interview.tech_stack)
                    setTechStack(Array.isArray(parsed) ? parsed : [])
                } catch {
                    setTechStack([])
                }
            }

            // Fetch candidate if candidate_id exists
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
                        experience: candidate.experience || '',
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
            // Update interview
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

            // Update candidate if candidate_id exists
            if (candidateData.id) {
                const candidateUpdateData = {
                    name: candidateData.name,
                    email: candidateData.email,
                    phone: candidateData.phone,
                    position: candidateData.position,
                    experience: candidateData.experience,
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

    if (isLoadingData) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-inter-verse-green"></div>
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    Редактирование интервью
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Обновите информацию об интервью и данные кандидата
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Interview Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card p-6"
                >
                    <div className="flex items-center mb-6">
                        <Calendar className="w-6 h-6 text-inter-verse-green dark:text-purple-400 mr-3" />
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                            Информация об интервью
                        </h2>
                    </div>

                    <div className="space-y-4">
                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Название
                            </label>
                            <input
                                type="text"
                                value={interviewData.title}
                                onChange={(e) => setInterviewData({ ...interviewData, title: e.target.value })}
                                className="input-field-adaptive w-full"
                                placeholder="Название интервью"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Описание
                            </label>
                            <textarea
                                value={interviewData.description}
                                onChange={(e) => setInterviewData({ ...interviewData, description: e.target.value })}
                                className="input-field-adaptive w-full min-h-[100px]"
                                placeholder="Описание интервью"
                            />
                        </div>

                        {/* Status */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Статус
                            </label>
                            <select
                                value={interviewData.status}
                                onChange={(e) => setInterviewData({ ...interviewData, status: e.target.value })}
                                className="input-field-adaptive w-full"
                            >
                                <option value="scheduled">Запланировано</option>
                                <option value="in_progress">В процессе</option>
                                <option value="completed">Завершено</option>
                                <option value="cancelled">Отменено</option>
                            </select>
                        </div>

                        {/* Scheduled At */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Дата и время
                            </label>
                            <input
                                type="datetime-local"
                                value={interviewData.scheduled_at ? new Date(interviewData.scheduled_at).toISOString().slice(0, 16) : ''}
                                onChange={(e) => {
                                    const date = e.target.value ? new Date(e.target.value).toISOString() : ''
                                    setInterviewData({ ...interviewData, scheduled_at: date })
                                }}
                                className="input-field-adaptive w-full"
                            />
                        </div>

                        {/* Specialization */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Специализация
                            </label>
                            <select
                                value={interviewData.specialization}
                                onChange={(e) => setInterviewData({ ...interviewData, specialization: e.target.value })}
                                className="input-field-adaptive w-full"
                            >
                                <option value="">Выберите специализацию</option>
                                <option value="frontend">Frontend</option>
                                <option value="backend">Backend</option>
                                <option value="devops">DevOps</option>
                                <option value="qa">QA</option>
                                <option value="data_science">Data Science</option>
                            </select>
                        </div>

                        {/* Level */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Уровень
                            </label>
                            <select
                                value={interviewData.level}
                                onChange={(e) => setInterviewData({ ...interviewData, level: e.target.value })}
                                className="input-field-adaptive w-full"
                            >
                                <option value="">Выберите уровень</option>
                                <option value="intern">Intern</option>
                                <option value="junior">Junior</option>
                                <option value="middle">Middle</option>
                                <option value="senior">Senior</option>
                                <option value="lead">Lead/CTO</option>
                            </select>
                        </div>

                        {/* Tech Stack */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Технологии
                            </label>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {techStack.map((tech, index) => (
                                    <span
                                        key={index}
                                        className="px-3 py-1 bg-inter-verse-green/20 text-inter-verse-green dark:bg-purple-600/30 dark:text-purple-200 text-sm rounded-full flex items-center gap-2"
                                    >
                                        {tech}
                                        <button
                                            type="button"
                                            onClick={() => removeTechStackItem(index)}
                                            className="hover:text-red-500"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <input
                                type="text"
                                placeholder="Добавить технологию"
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault()
                                        addTechStackItem(e.currentTarget.value)
                                        e.currentTarget.value = ''
                                    }
                                }}
                                className="input-field-adaptive w-full"
                            />
                        </div>
                    </div>
                </motion.div>

                {/* Candidate Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="card p-6"
                >
                    <div className="flex items-center mb-6">
                        <User className="w-6 h-6 text-inter-verse-green dark:text-purple-400 mr-3" />
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                            Данные кандидата
                        </h2>
                    </div>

                    <div className="space-y-4">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                <User className="w-4 h-4 inline mr-1" />
                                ФИО
                            </label>
                            <input
                                type="text"
                                value={candidateData.name}
                                onChange={(e) => setCandidateData({ ...candidateData, name: e.target.value })}
                                className="input-field-adaptive w-full"
                                placeholder="Имя кандидата"
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                <Mail className="w-4 h-4 inline mr-1" />
                                Email
                            </label>
                            <input
                                type="email"
                                value={candidateData.email}
                                onChange={(e) => setCandidateData({ ...candidateData, email: e.target.value })}
                                className="input-field-adaptive w-full"
                                placeholder="email@example.com"
                            />
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                <Phone className="w-4 h-4 inline mr-1" />
                                Телефон
                            </label>
                            <input
                                type="tel"
                                value={candidateData.phone}
                                onChange={(e) => setCandidateData({ ...candidateData, phone: e.target.value })}
                                className="input-field-adaptive w-full"
                                placeholder="+7 (999) 123-45-67"
                            />
                        </div>

                        {/* Position */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                <Briefcase className="w-4 h-4 inline mr-1" />
                                Позиция
                            </label>
                            <input
                                type="text"
                                value={candidateData.position}
                                onChange={(e) => setCandidateData({ ...candidateData, position: e.target.value })}
                                className="input-field-adaptive w-full"
                                placeholder="Должность"
                            />
                        </div>

                        {/* Experience */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                <Award className="w-4 h-4 inline mr-1" />
                                Опыт работы
                            </label>
                            <input
                                type="text"
                                value={candidateData.experience}
                                onChange={(e) => setCandidateData({ ...candidateData, experience: e.target.value })}
                                className="input-field-adaptive w-full"
                                placeholder="Например: 3 года"
                            />
                        </div>

                        {/* Skills */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Навыки
                            </label>
                            <textarea
                                value={candidateData.skills}
                                onChange={(e) => setCandidateData({ ...candidateData, skills: e.target.value })}
                                className="input-field-adaptive w-full min-h-[80px]"
                                placeholder="Список навыков"
                            />
                        </div>

                        {/* Resume URL */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                <FileText className="w-4 h-4 inline mr-1" />
                                Ссылка на резюме
                            </label>
                            <input
                                type="url"
                                value={candidateData.resume_url}
                                onChange={(e) => setCandidateData({ ...candidateData, resume_url: e.target.value })}
                                className="input-field-adaptive w-full"
                                placeholder="https://example.com/resume.pdf"
                            />
                        </div>

                        {/* LinkedIn URL */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                <Linkedin className="w-4 h-4 inline mr-1" />
                                LinkedIn
                            </label>
                            <input
                                type="url"
                                value={candidateData.linkedin_url}
                                onChange={(e) => setCandidateData({ ...candidateData, linkedin_url: e.target.value })}
                                className="input-field-adaptive w-full"
                                placeholder="https://linkedin.com/in/username"
                            />
                        </div>

                        {/* GitHub URL */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                <Github className="w-4 h-4 inline mr-1" />
                                GitHub
                            </label>
                            <input
                                type="url"
                                value={candidateData.github_url}
                                onChange={(e) => setCandidateData({ ...candidateData, github_url: e.target.value })}
                                className="input-field-adaptive w-full"
                                placeholder="https://github.com/username"
                            />
                        </div>

                        {/* Status */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Статус кандидата
                            </label>
                            <select
                                value={candidateData.status}
                                onChange={(e) => setCandidateData({ ...candidateData, status: e.target.value })}
                                className="input-field-adaptive w-full"
                            >
                                <option value="active">Активный</option>
                                <option value="archived">Архивирован</option>
                            </select>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 mt-8">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                    Отмена
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="btn-primary-adaptive px-6 py-2"
                >
                    {isLoading ? 'Сохранение...' : 'Сохранить изменения'}
                </button>
            </div>

            {isLoading && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-inter-verse-green mx-auto"></div>
                        <p className="mt-4 text-gray-600 dark:text-gray-400">Обновление данных...</p>
                    </div>
                </div>
            )}
        </div>
    )
}

