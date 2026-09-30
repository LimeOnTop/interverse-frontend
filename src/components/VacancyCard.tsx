import { ExternalLink, MapPin } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import Card from './ui/Card'
import Button from './ui/Button'
import Badge from './ui/Badge'
import { api } from '../services/api'
import { formatSessionStartError, startInterviewSession } from '../lib/interviewSession'

export interface VacancyCardData {
    id: string
    external_id?: string
    source: string
    source_label: string
    title: string
    company_name?: string
    company_logo_url?: string
    area?: string
    salary_from?: number | null
    salary_to?: number | null
    salary_currency?: string
    salary_gross?: boolean | null
    experience?: string
    employment?: string
    schedule?: string
    snippet?: string
    skills?: string[]
    url: string
    published_at?: string
}

function formatSalary(v: VacancyCardData): string | null {
    const currency = (v.salary_currency || 'RUB').toUpperCase() === 'RUB' ? '₽' : v.salary_currency || ''
    const from = v.salary_from ?? null
    const to = v.salary_to ?? null
    if (from == null && to == null) return null
    const fmt = (n: number) => n.toLocaleString('ru-RU')
    let text = ''
    if (from != null && to != null) text = `${fmt(from)} – ${fmt(to)} ${currency}`
    else if (from != null) text = `от ${fmt(from)} ${currency}`
    else text = `до ${fmt(to!)} ${currency}`
    if (v.salary_gross === true) text += ' до вычета'
    if (v.salary_gross === false) text += ' на руки'
    return text
}

function formatDate(raw?: string): string | null {
    if (!raw) return null
    const d = new Date(raw)
    if (Number.isNaN(d.getTime())) return null
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

function inferSpecialization(skills: string[]): string {
    const joined = skills.join(' ').toLowerCase()
    if (/(react|vue|angular|typescript|javascript|css|html|frontend)/.test(joined)) return 'frontend'
    if (/(docker|kubernetes|k8s|terraform|ansible|devops|ci\/cd)/.test(joined)) return 'devops'
    if (/(qa|selenium|cypress|playwright|pytest)/.test(joined)) return 'qa'
    if (/(pandas|numpy|tensorflow|pytorch|ml|data)/.test(joined)) return 'data_science'
    return 'backend'
}

function inferLevel(experience?: string): string {
    const raw = (experience || '').toLowerCase()
    const years = Number((raw.match(/\d+/) || [])[0] || 0)
    if (years >= 5 || /senior|ведущ|главн/.test(raw)) return 'senior'
    if (years >= 2 || /middle|средн/.test(raw)) return 'middle'
    if (years >= 1 || /junior|младш/.test(raw)) return 'junior'
    return 'middle'
}

interface VacancyCardProps {
    vacancy: VacancyCardData
    fallbackSkills?: string[]
}

export default function VacancyCard({ vacancy, fallbackSkills = [] }: VacancyCardProps) {
    const navigate = useNavigate()
    const [training, setTraining] = useState(false)
    const salary = formatSalary(vacancy)
    const published = formatDate(vacancy.published_at)
    const tags = [vacancy.employment, vacancy.schedule].filter(Boolean) as string[]
    const skills = (vacancy.skills && vacancy.skills.length > 0 ? vacancy.skills : fallbackSkills).slice(0, 8)

    const handleTrain = async () => {
        if (skills.length === 0) {
            toast.error('У вакансии нет технологий для тренировки. Добавьте навыки в профиль.')
            return
        }
        const specialization = inferSpecialization(skills)
        const level = inferLevel(vacancy.experience)
        try {
            setTraining(true)
            const { data } = await api.post('/interviews/', {
                title: `Тренировка: ${vacancy.title}`.slice(0, 120),
                description: `Тренировка по технологиям вакансии «${vacancy.title}»`,
                specialization,
                level,
                tech_stack: JSON.stringify(skills),
            })
            const interviewId = data?.interview?.id as string | undefined
            if (!interviewId) {
                throw new Error('Некорректный ответ при создании тренировки')
            }
            await startInterviewSession(api, interviewId)
            toast.success('Тренировка запущена')
            navigate(`/interview/${interviewId}`)
        } catch (error) {
            toast.error(formatSessionStartError(error))
        } finally {
            setTraining(false)
        }
    }

    return (
        <Card hover padding="md" className="h-full">
            <div className="flex h-full min-h-0 flex-1 flex-col">
                <div className="flex min-h-0 flex-1 flex-col gap-4">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex items-start gap-3">
                            {vacancy.company_logo_url ? (
                                <img
                                    src={vacancy.company_logo_url}
                                    alt=""
                                    className="w-10 h-10 object-contain shrink-0 p-1"
                                />
                            ) : null}
                            <div className="min-w-0">
                                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 leading-snug line-clamp-2">
                                    {vacancy.title}
                                </h3>
                                {vacancy.company_name && (
                                    <p className="text-sm text-secondary mt-1 truncate">{vacancy.company_name}</p>
                                )}
                            </div>
                        </div>
                        <Badge
                            variant="default"
                            className="shrink-0 !bg-transparent dark:!bg-transparent !border-0"
                        >
                            {vacancy.source_label || vacancy.source}
                        </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="p-2 bg-gray-50 dark:bg-iv-dark-bg">
                            <div className="text-xs text-secondary mb-0.5">Локация</div>
                            <div className="font-medium truncate flex items-center gap-1">
                                {vacancy.area ? (
                                    <>
                                        <MapPin className="w-3.5 h-3.5 shrink-0 text-secondary" strokeWidth={1.75} />
                                        <span className="truncate">{vacancy.area}</span>
                                    </>
                                ) : (
                                    <span className="text-secondary">—</span>
                                )}
                            </div>
                        </div>
                        <div className="p-2 bg-gray-50 dark:bg-iv-dark-bg">
                            <div className="text-xs text-secondary mb-0.5">Зарплата</div>
                            <div className="font-medium truncate">{salary || <span className="text-secondary">не указана</span>}</div>
                        </div>
                        <div className="p-2 bg-gray-50 dark:bg-iv-dark-bg">
                            <div className="text-xs text-secondary mb-0.5">Опыт</div>
                            <div className="font-medium truncate">
                                {vacancy.experience || <span className="text-secondary">не указан</span>}
                            </div>
                        </div>
                        <div className="p-2 bg-gray-50 dark:bg-iv-dark-bg">
                            <div className="text-xs text-secondary mb-0.5">Опубликовано</div>
                            <div className="font-medium truncate">
                                {published || <span className="text-secondary">—</span>}
                            </div>
                        </div>
                    </div>

                    {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {tags.map((item) => (
                                <span key={item} className="iv-chip !bg-transparent dark:!bg-transparent !border-0">
                                    {item}
                                </span>
                            ))}
                        </div>
                    )}

                    {vacancy.snippet && (
                        <p className="text-sm text-secondary line-clamp-3">{vacancy.snippet}</p>
                    )}

                    {skills.length > 0 && (
                        <div>
                            <div className="text-xs text-secondary mb-2">Технологии</div>
                            <div className="flex flex-wrap gap-1.5">
                                {skills.map((skill) => (
                                    <span key={skill} className="iv-chip !bg-transparent dark:!bg-transparent !border-0">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-auto shrink-0 pt-4 flex items-center justify-between gap-3">
                    <a
                        href={vacancy.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors hover:text-inter-verse-green dark:hover:text-purple-400"
                        onClick={(e) => e.stopPropagation()}
                    >
                        Перейти на вакансию
                        <ExternalLink className="w-3.5 h-3.5" strokeWidth={2} />
                    </a>
                    <Button
                        type="button"
                        className="text-sm px-4 py-2"
                        loading={training}
                        onClick={(e) => {
                            e.stopPropagation()
                            void handleTrain()
                        }}
                    >
                        Тренироваться
                    </Button>
                </div>
            </div>
        </Card>
    )
}
