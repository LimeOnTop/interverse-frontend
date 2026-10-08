import { isTrainingLimitError } from '../store/promoStore'
import { ArrowRight, Clock3, MapPin, Star } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
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
    if (from != null && to != null) return `${fmt(from)} – ${fmt(to)} ${currency}`
    if (from != null) return `от ${fmt(from)} ${currency}`
    return `до ${fmt(to!)} ${currency}`
}

function salaryCaption(v: VacancyCardData, hasSalary: boolean): string {
    if (!hasSalary) return 'Уточните у работодателя'
    if (v.salary_gross === true) return 'До вычета налогов'
    if (v.salary_gross === false) return 'На руки'
    return 'Налогообложение не уточнено'
}

function formatDate(raw?: string): string | null {
    if (!raw) return null
    const d = new Date(raw)
    if (Number.isNaN(d.getTime())) return null
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

function companyInitials(name?: string): string {
    const words = (name || '').replace(/["«»()]/g, ' ').split(/\s+/).filter((w) => /[\p{L}\d]/u.test(w))
    if (words.length === 0) return '—'
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
    return (words[0][0] + words[1][0]).toUpperCase()
}

function inferSpecialization(skills: string[]): string {
    const joined = skills.join(' ').toLowerCase()
    if (/(react|vue|angular|typescript|javascript|css|html|frontend)/.test(joined)) return 'frontend'
    if (/(docker|kubernetes|k8s|terraform|ansible|devops|ci\/cd)/.test(joined)) return 'devops'
    if (/(qa|selenium|cypress|playwright|pytest)/.test(joined)) return 'qa'
    if (/(pandas|numpy|tensorflow|pytorch|ml|data)/.test(joined)) return 'data_science'
    return 'backend'
}

/** Training level guessed from the vacancy's experience line. */
export function inferLevel(experience?: string): string {
    const raw = (experience || '').toLowerCase()
    if (/без опыта|нет опыта|intern|стаж[её]р/.test(raw)) return 'intern'
    const years = Number((raw.match(/\d+/) || [])[0] || 0)
    if (years >= 5 || /senior|ведущ|главн/.test(raw)) return 'senior'
    if (years >= 2 || /middle|средн/.test(raw)) return 'middle'
    if (years >= 1 || /junior|младш/.test(raw)) return 'junior'
    return 'middle'
}

/** Work format bucket from the schedule line: remote, hybrid or office. */
export function workMode(schedule?: string): 'remote' | 'hybrid' | 'office' | '' {
    const raw = (schedule || '').toLowerCase()
    if (!raw) return ''
    if (/гибрид|hybrid/.test(raw)) return 'hybrid'
    if (/удал[её]н|remote/.test(raw)) return 'remote'
    return 'office'
}

export const normalizeSkill = (skill: string) => skill.trim().toLowerCase()

/** Vacancy requirements with the ones already in the profile marked. */
export function vacancyRequirements(vacancy: VacancyCardData, profileSkills: Set<string>, fallbackSkills: string[]) {
    const complete = Boolean(vacancy.skills && vacancy.skills.length > 0)
    const required = (complete ? vacancy.skills! : fallbackSkills).slice(0, 14)
    const matched = required.filter((skill) => profileSkills.has(normalizeSkill(skill)))
    return { complete, required, matched }
}

interface VacancyCardProps {
    vacancy: VacancyCardData
    index?: number
    profileSkills: Set<string>
    fallbackSkills?: string[]
    saved: boolean
    onToggleSave: () => void
}

export default function VacancyCard({ vacancy, index = 0, profileSkills, fallbackSkills = [], saved, onToggleSave }: VacancyCardProps) {
    const navigate = useNavigate()
    const [training, setTraining] = useState(false)
    const salary = formatSalary(vacancy)
    const published = formatDate(vacancy.published_at)
    const { complete, required, matched } = vacancyRequirements(vacancy, profileSkills, fallbackSkills)
    const matchedSet = new Set(matched)
    const company = vacancy.company_name || 'Компания не указана'
    const sourceLine = [vacancy.source_label || vacancy.source, published].filter(Boolean).join(' · ')

    const handleTrain = async () => {
        const skills = required.slice(0, 8)
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
            // The limit promo opens from the API interceptor.
            if (!isTrainingLimitError(error)) {
                toast.error(formatSessionStartError(error))
            }
        } finally {
            setTraining(false)
        }
    }

    return (
        <article className="job-card" style={{ '--i': index } as React.CSSProperties}>
            <header className="job-top">
                <div className="job-company">
                    <span className="company-mark" aria-hidden="true">
                        {vacancy.company_logo_url ? <img src={vacancy.company_logo_url} alt="" loading="lazy" /> : companyInitials(vacancy.company_name)}
                    </span>
                    <div>
                        <b>{company}</b>
                        {sourceLine && <small>{sourceLine}</small>}
                    </div>
                </div>
                <button
                    type="button"
                    className={`save-job ${saved ? 'saved' : ''}`}
                    aria-pressed={saved}
                    aria-label={`${saved ? 'Убрать из избранного' : 'Сохранить вакансию'} ${company}`}
                    onClick={onToggleSave}
                >
                    <Star strokeWidth={1.75} />
                </button>
            </header>

            <h2>{vacancy.title}</h2>
            <div className={`job-compensation ${salary ? '' : 'unspecified'}`}>{salary || 'Зарплата не указана'}</div>
            <p className="salary-caption">{salaryCaption(vacancy, Boolean(salary))}</p>

            <div className="job-facts">
                <span><MapPin strokeWidth={1.75} /> {vacancy.area || 'Город не указан'}</span>
                {vacancy.schedule && <span><Clock3 strokeWidth={1.75} /> {vacancy.schedule}</span>}
                {vacancy.experience && <span>{vacancy.experience}</span>}
                {vacancy.employment && <span>{vacancy.employment}</span>}
            </div>

            {required.length > 0 && (
                <>
                    <div className="job-skill-header">
                        <strong>Требуемые навыки</strong>
                        <small>{complete ? 'Из описания вакансии' : 'По навыкам из профиля'}</small>
                    </div>
                    <div className="job-skills">
                        {required.map((skill) => (
                            <span key={skill} className={`requirement-tag ${matchedSet.has(skill) ? 'match' : ''}`}>
                                {matchedSet.has(skill) ? '✓ ' : ''}{skill}
                            </span>
                        ))}
                    </div>
                    <div className="job-coverage">
                        {complete ? (
                            <>
                                <span className="coverage-dots" aria-hidden="true">
                                    {required.map((skill) => <i key={skill} className={matchedSet.has(skill) ? 'on' : ''} />)}
                                </span>
                                <small>{matched.length} из {required.length} в профиле</small>
                            </>
                        ) : (
                            <small>Источник не указал навыки · полное совпадение не оценено</small>
                        )}
                    </div>
                </>
            )}

            {vacancy.snippet && (
                <details className="job-detail">
                    <summary>Задачи и требования</summary>
                    <p>{vacancy.snippet}</p>
                </details>
            )}

            <div className="job-footspace" />
            <footer className="job-actions">
                <a href={vacancy.url} target="_blank" rel="noopener noreferrer">
                    На вакансию ↗
                </a>
                <button type="button" className="lib-btn is-primary" disabled={training} onClick={() => void handleTrain()}>
                    {training ? 'Запускаем…' : <>Тренировка по вакансии <ArrowRight /></>}
                </button>
            </footer>
        </article>
    )
}
