export type SessionStepType = 'question' | 'task'

export interface ApiSessionItem {
    id: string
    questionId?: string
    question_id?: string
    itemType?: string
    item_type?: string
    sortOrder?: number
    sort_order?: number
    text: string
    technology?: string
    difficulty?: string
    category?: string
    options?: string[]
}

export interface ApiInterview {
    id: string
    title: string
    description?: string
    scheduled_at?: string
    level?: string
    specialization?: string
    status?: string
    technologies?: string[]
}

export interface SessionStep {
    id: string
    type: SessionStepType
    label: string
    text: string
    technology: string
    options?: string[]
    questionNumber?: number
    taskNumber?: number
}

export interface InterviewSessionData {
    sessionId: string
    interview: ApiInterview
    steps: SessionStep[]
}

export interface StepAnswer {
    stepId: string
    selectedOptionIndex?: number
    taskAnswer?: string
}

export function normalizeSessionItem(item: ApiSessionItem) {
    return {
        id: item.id,
        questionId: item.questionId || item.question_id || item.id,
        itemType: (item.itemType || item.item_type || 'question') as SessionStepType,
        sortOrder: item.sortOrder ?? item.sort_order ?? 0,
        text: item.text,
        technology: item.technology || '',
        options: item.options,
    }
}

export function buildSessionSteps(questions: ApiSessionItem[], tasks: ApiSessionItem[]): SessionStep[] {
    const normalizedQuestions = questions
        .map(normalizeSessionItem)
        .filter((item) => item.itemType === 'question')
        .sort((a, b) => a.sortOrder - b.sortOrder)

    const normalizedTasks = tasks
        .map(normalizeSessionItem)
        .filter((item) => item.itemType === 'task')
        .sort((a, b) => a.sortOrder - b.sortOrder)

    const firstBlock = normalizedQuestions.slice(0, 10)
    const secondBlock = normalizedQuestions.slice(10, 20)
    const taskOne = normalizedTasks[0]
    const taskTwo = normalizedTasks[1]

    const steps: SessionStep[] = []

    firstBlock.forEach((question, index) => {
        steps.push(mapQuestionStep(question, index + 1))
    })

    if (taskOne) {
        steps.push(mapTaskStep(taskOne, 1))
    }

    secondBlock.forEach((question, index) => {
        steps.push(mapQuestionStep(question, index + 11))
    })

    if (taskTwo) {
        steps.push(mapTaskStep(taskTwo, 2))
    }

    return steps
}

function mapQuestionStep(question: ReturnType<typeof normalizeSessionItem>, questionNumber: number): SessionStep {
    return {
        id: question.id,
        type: 'question',
        label: `Вопрос ${questionNumber}`,
        text: question.text,
        technology: question.technology,
        options: question.options?.length === 4
            ? question.options
            : buildAnswerOptions(question.text, question.technology, question.id),
        questionNumber,
    }
}

function mapTaskStep(task: ReturnType<typeof normalizeSessionItem>, taskNumber: number): SessionStep {
    return {
        id: task.id,
        type: 'task',
        label: `Задача ${taskNumber}`,
        text: task.text,
        technology: task.technology,
        taskNumber,
    }
}

export function buildAnswerOptions(_text: string, technology: string, seed: string): string[] {
    const tech = technology || 'технологии'

    const templates = [
        `Структурированный ответ с акцентом на ${tech} и практический опыт`,
        `Теоретически верный, но неполный ответ без примеров из production`,
        `Ответ с типичной ошибкой при работе с ${tech}`,
        `Неверная интерпретация вопроса и уход от темы`,
    ]

    const offset = hashString(seed) % templates.length

    return Array.from({ length: 4 }, (_, index) => templates[(offset + index) % templates.length])
}

function hashString(value: string): number {
    let hash = 0
    for (let i = 0; i < value.length; i += 1) {
        hash = (hash << 5) - hash + value.charCodeAt(i)
        hash |= 0
    }
    return Math.abs(hash)
}

export function getSessionStorageKey(interviewId: string) {
    return `interview-session-${interviewId}`
}

export function getAnswersStorageKey(interviewId: string) {
    return `interview-answers-${interviewId}`
}

export function parseSessionResponse(data: {
    session_id?: string
    interview?: ApiInterview
    questions?: ApiSessionItem[]
    tasks?: ApiSessionItem[]
}) {
    const interview = data.interview
    if (!interview?.id) {
        throw new Error('Некорректный ответ сервера')
    }

    const questions = data.questions || []
    const tasks = data.tasks || []
    const steps = buildSessionSteps(questions, tasks)

    return {
        sessionId: data.session_id || interview.id,
        interview,
        steps,
    } satisfies InterviewSessionData
}

type SessionStartResponse = {
    session_id?: string
    interview?: ApiInterview
    questions?: ApiSessionItem[]
    tasks?: ApiSessionItem[]
}

function isAxiosNotFound(error: unknown): boolean {
    return typeof error === 'object'
        && error !== null
        && 'response' in error
        && (error as { response?: { status?: number } }).response?.status === 404
}

async function requestSessionStart(
    apiClient: { post: (url: string, data?: unknown) => Promise<{ data: unknown }> },
    interviewId: string,
): Promise<SessionStartResponse> {
    const endpoints = [
        `/interviews/${interviewId}/start`,
        `/interviews/${interviewId}/questions`,
        '/interviews/generate-questions',
    ]

    let lastError: unknown

    for (const endpoint of endpoints) {
        try {
            const body = endpoint === '/interviews/generate-questions'
                ? { interview_id: interviewId }
                : {}

            const response = await apiClient.post(endpoint, body)
            return response.data as SessionStartResponse
        } catch (error) {
            lastError = error
            if (!isAxiosNotFound(error)) {
                throw error
            }
        }
    }

    throw lastError
}

export async function startInterviewSession(
    apiClient: { post: (url: string, data?: unknown) => Promise<{ data: unknown }> },
    interviewId: string,
): Promise<InterviewSessionData> {
    const responseData = await requestSessionStart(apiClient, interviewId)
    const sessionData = parseSessionResponse(responseData)

    localStorage.setItem(getSessionStorageKey(interviewId), JSON.stringify(sessionData))
    localStorage.removeItem(getAnswersStorageKey(interviewId))

    return sessionData
}

export function canStartInterview(status: string) {
    return status === 'scheduled' || status === 'in_progress'
}
