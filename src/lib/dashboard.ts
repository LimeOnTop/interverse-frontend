import { useEffect, useState } from 'react'
import { api } from '../services/api'
import type { GeneratedReport } from './reportAnalysis'

export interface ReportWithInterview extends GeneratedReport {
    interview?: {
        id: string
        title: string
        specialization: string
        level: string
        scheduled_at?: string
    }
}

export interface DashboardSummary {
    plan: 'free' | 'paid'
    quota: {
        used: number
        limit: number
        remaining: number
        /** day: Pro, resets at midnight Moscow time; total: Basic. */
        period: 'day' | 'total'
        resets_at?: string
    }
    trainings: {
        total: number
        completed: number
        in_progress: number
        scheduled: number
    }
    last_report: ReportWithInterview | null
}

/** Server-side dashboard numbers: quota as enforced, counts and the latest report. */
export function useDashboardSummary() {
    const [summary, setSummary] = useState<DashboardSummary | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let alive = true
        api.get('/dashboard/summary')
            .then((response) => { if (alive) setSummary(response.data) })
            .catch(() => { if (alive) setSummary(null) })
            .finally(() => { if (alive) setLoading(false) })
        return () => { alive = false }
    }, [])

    return { summary, loading }
}

export const SPECIALIZATION_LABELS: Record<string, string> = {
    frontend: 'Frontend',
    backend: 'Backend',
    devops: 'DevOps',
    qa: 'QA',
    data_science: 'Data Science',
}

export const LEVEL_LABELS: Record<string, string> = {
    intern: 'Intern',
    junior: 'Junior',
    middle: 'Middle',
    senior: 'Senior',
    lead: 'Lead',
}

export function specializationLabel(value?: string) {
    return (value && SPECIALIZATION_LABELS[value]) || value || ''
}

export function levelLabel(value?: string) {
    return (value && LEVEL_LABELS[value]) || value || ''
}

export function formatDay(value?: string, withYear = true) {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    return date.toLocaleDateString('ru-RU', withYear
        ? { day: 'numeric', month: 'long', year: 'numeric' }
        : { day: 'numeric', month: 'long' })
}

export function pluralRu(count: number, forms: [string, string, string]) {
    const mod10 = count % 10
    const mod100 = count % 100
    if (mod10 === 1 && mod100 !== 11) return forms[0]
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1]
    return forms[2]
}
