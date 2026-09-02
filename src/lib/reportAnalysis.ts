import { api } from '../services/api'
import type { SessionStep, StepAnswer } from './interviewSession'

export interface GeneratedReport {
    id: string
    interview_id: string
    overall_score: number
    algorithm_score: number
    architecture_score: number
    coding_score: number
    soft_skills_score: number
    comments: string
    recommendations: string
    created_at: string
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

export async function submitInterviewForAnalysis(
    interviewId: string,
    steps: SessionStep[],
    answers: Record<string, StepAnswer>,
): Promise<GeneratedReport> {
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
