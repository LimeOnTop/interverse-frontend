import { api } from '../services/api'
import { useAuthStore } from '../store/authStore'
import type { SessionStep, StepAnswer } from './interviewSession'

export interface AnswerReviewItem {
    step_id: string
    question_id?: string
    item_type: 'question' | 'task' | string
    sort_order?: number
    label: string
    prompt: string
    technology?: string
    options?: string[]
    selected_index?: number | null
    correct_index?: number | null
    user_answer: string
    correct_answer: string
    is_correct?: boolean | null
}

export interface WeakPoint {
    step_id: string
    item_type: 'question' | 'task' | string
    label: string
    prompt: string
    technology?: string
    user_answer: string
    correct_answer: string
    explanation?: string
    topic: string
    source_url: string
}

export interface GeneratedReport {
    id: string
    interview_id: string
    overall_score: number
    algorithm_score: number
    architecture_score: number
    coding_score: number
    soft_skills_score: number
    algorithm_passed?: boolean
    architecture_passed?: boolean
    coding_passed?: boolean
    soft_skills_passed?: boolean
    comments: string
    recommendations: string
    ai_analyzed?: boolean
    created_at: string
    answer_reviews?: AnswerReviewItem[]
    strengths?: string
    weaknesses?: string
    /** Pro-only; empty for Basic, see `locked` and `weak_points_count`. */
    weak_points?: WeakPoint[]
    weak_points_count?: number
    /** True when the report is shown with Basic restrictions. */
    locked?: boolean
    /** Two-line verdict from the section scores ("\n" between lines). */
    headline?: string
    theory_correct?: number
    theory_total?: number
    task_total?: number
    technologies?: string[]
    /** Weak topics grouped by technology; Pro only. */
    focus?: FocusGroup[]
    focus_count?: number
}

export interface FocusGroup {
    title: string
    count: number
    topics: string[]
}

const FALLBACK_MARKER = 'AI-анализ временно недоступен'

export function isFallbackReport(report: Pick<GeneratedReport, 'comments' | 'ai_analyzed'>) {
    if (typeof report.ai_analyzed === 'boolean') {
        return !report.ai_analyzed
    }

    return report.comments.includes(FALLBACK_MARKER)
}

function buildAnswerPayload(steps: SessionStep[], answers: Record<string, StepAnswer>) {
    return steps.map((step) => {
        const answer = answers[step.id]
        const payload: {
            step_id: string
            question_id: string
            item_type: string
            selected_option_index?: number
            task_answer?: string
        } = {
            step_id: step.id,
            question_id: step.questionId || step.id,
            item_type: step.type,
        }

        if (step.type === 'question' && answer?.selectedOptionIndex !== undefined) {
            payload.selected_option_index = answer.selectedOptionIndex
        }

        if (step.type === 'task' && answer?.taskAnswer) {
            payload.task_answer = answer.taskAnswer
        }

        return payload
    })
}

async function ensureFreshAuth() {
    const authStore = useAuthStore.getState()
    if (!authStore.refreshToken && !authStore.accessToken) {
        throw new Error('Сессия истекла. Войдите снова.')
    }

    const refreshed = await authStore.refreshTokens()
    if (!refreshed && !useAuthStore.getState().accessToken) {
        throw new Error('Сессия истекла. Войдите снова.')
    }
}

export async function submitInterviewForAnalysis(
    interviewId: string,
    steps: SessionStep[],
    answers: Record<string, StepAnswer>,
): Promise<GeneratedReport> {
    await ensureFreshAuth()

    const response = await api.post('/reports/generate', {
        interview_id: interviewId,
        answers: buildAnswerPayload(steps, answers),
    })

    const report = response.data?.report
    if (!report?.id) {
        throw new Error('Некорректный ответ сервера при генерации отчёта')
    }

    return report as GeneratedReport
}

export async function reanalyzeReport(reportId: string): Promise<GeneratedReport> {
    await ensureFreshAuth()

    const response = await api.post(`/reports/${reportId}/analyze`)

    const report = response.data?.report
    if (!report?.id) {
        throw new Error('Некорректный ответ сервера при AI-анализе')
    }

    return report as GeneratedReport
}
