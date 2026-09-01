import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Briefcase, Mail, Phone, Calendar } from 'lucide-react'
import { api } from '../services/api'
import toast from 'react-hot-toast'
import CandidateFilters from '../components/CandidateFilters'
import PageHeader from '../components/ui/PageHeader'
import PageTransition from '../components/ui/PageTransition'
import Card from '../components/ui/Card'
import EmptyState from '../components/ui/EmptyState'
import Spinner from '../components/ui/Spinner'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'

interface Candidate {
    id: string
    name: string
    email: string
    phone: string
    experience: number
    level: string
    specialization: string
    tech_stack: string
    created_at: string
}

export default function CandidatesPage() {
    const [candidates, setCandidates] = useState<Candidate[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [levelFilter, setLevelFilter] = useState('')
    const [specializationFilter, setSpecializationFilter] = useState('')

    useEffect(() => {
        fetchCandidates()
    }, [])

    const fetchCandidates = async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams()
            if (levelFilter) params.append('level', levelFilter)
            if (specializationFilter) params.append('specialization', specializationFilter)

            const response = await api.get(`/candidates/?${params.toString()}`)
            setCandidates(response.data.candidates || [])
        } catch (error: any) {
            toast.error('Ошибка при загрузке вакансий')
        } finally {
            setLoading(false)
        }
    }

    const handleClearFilters = () => {
        setLevelFilter('')
        setSpecializationFilter('')
        setSearchTerm('')
    }

    const filteredCandidates = candidates.filter(candidate =>
        candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.specialization.toLowerCase().includes(searchTerm.toLowerCase())
    )

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

    if (loading) return <Spinner size="lg" className="h-64" />

    return (
        <PageTransition className="space-y-8">
            <PageHeader
                title="Вакансии"
                description="Управление открытыми вакансиями"
                action={
                    <Button>
                        <Plus className="w-5 h-5" /> Добавить вакансию
                    </Button>
                }
            />

            <CandidateFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                levelFilter={levelFilter}
                onLevelChange={setLevelFilter}
                specializationFilter={specializationFilter}
                onSpecializationChange={setSpecializationFilter}
                onApplyFilters={fetchCandidates}
                onClearFilters={handleClearFilters}
            />

            <section>
                <h2 className="text-lg font-semibold mb-4 tabular-nums">
                    Вакансии <span className="text-secondary font-normal">({filteredCandidates.length})</span>
                </h2>

                {filteredCandidates.length === 0 ? (
                    <EmptyState
                        icon={Briefcase}
                        title="Нет вакансий"
                        description="Добавьте вакансию, чтобы начать подбор"
                        action={
                            <Button>
                                <Plus className="w-5 h-5" /> Добавить вакансию
                            </Button>
                        }
                    />
                ) : (
                    <div className="grid gap-4">
                        {filteredCandidates.map((candidate, index) => (
                            <motion.div
                                key={candidate.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05, duration: 0.4 }}
                            >
                                <Card hover padding="md">
                                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                                        <div className="flex-1">
                                            <div className="flex items-start gap-3 mb-4">
                                                <div className="w-12 h-12 gradient-bg-adaptive flex items-center justify-center shrink-0">
                                                    <Briefcase className="w-6 h-6 text-white" />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                                        {candidate.name}
                                                    </h3>
                                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-secondary mt-1">
                                                        <span className="flex items-center gap-1">
                                                            <Mail className="w-4 h-4" />
                                                            {candidate.email}
                                                        </span>
                                                        {candidate.phone && (
                                                            <span className="flex items-center gap-1">
                                                                <Phone className="w-4 h-4" />
                                                                {candidate.phone}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid sm:grid-cols-3 gap-4 mb-4">
                                                <div>
                                                    <p className="text-xs font-medium uppercase tracking-wide text-secondary mb-1">Направление</p>
                                                    <p className="text-gray-900 dark:text-gray-100">{getSpecializationLabel(candidate.specialization)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-medium uppercase tracking-wide text-secondary mb-1">Уровень</p>
                                                    <p className="text-gray-900 dark:text-gray-100">{getLevelLabel(candidate.level)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-medium uppercase tracking-wide text-secondary mb-1">Опыт</p>
                                                    <p className="text-gray-900 dark:text-gray-100">{candidate.experience} лет</p>
                                                </div>
                                            </div>

                                            {candidate.tech_stack && (
                                                <div>
                                                    <p className="text-xs font-medium uppercase tracking-wide text-secondary mb-2">Технологии</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {JSON.parse(candidate.tech_stack).map((tech: string, techIndex: number) => (
                                                            <Badge key={techIndex}>{tech}</Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-col items-start lg:items-end gap-3 shrink-0">
                                            <div className="flex items-center text-sm text-secondary">
                                                <Calendar className="w-4 h-4 mr-1" />
                                                Создана: {new Date(candidate.created_at).toLocaleDateString('ru-RU')}
                                            </div>
                                            <div className="flex gap-2">
                                                <Button variant="secondary" className="text-sm px-4 py-2">Редактировать</Button>
                                                <Button className="text-sm px-4 py-2">Начать тренировку</Button>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}
            </section>
        </PageTransition>
    )
}
