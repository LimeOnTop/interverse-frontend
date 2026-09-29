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
    scheduledAt?: string
    level?: string
    specialization?: string
    status?: string
    technologies?: string[]
}

function normalizeInterview(raw: ApiInterview): ApiInterview {
    return {
        ...raw,
        scheduled_at: raw.scheduled_at || raw.scheduledAt,
    }
}

export interface SessionStep {
    id: string
    questionId: string
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
        options: normalizeOptions(item.options),
    }
}

function normalizeOptions(raw: unknown): string[] | undefined {
    if (!Array.isArray(raw) || raw.length === 0) {
        return undefined
    }

    const options = raw.map((entry) => {
        if (typeof entry === 'string') {
            return entry
        }
        if (typeof entry === 'object' && entry !== null && 'text' in entry) {
            return String((entry as { text?: unknown }).text ?? '')
        }
        return ''
    }).filter(Boolean)

    return options.length > 0 ? options : undefined
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

    const steps: SessionStep[] = []
    const taskCount = normalizedTasks.length
    const chunkSize = taskCount > 0
        ? Math.max(1, Math.ceil(normalizedQuestions.length / (taskCount + 1)))
        : normalizedQuestions.length

    let questionIndex = 0
    let taskIndex = 0
    let questionNumber = 1

    while (questionIndex < normalizedQuestions.length || taskIndex < normalizedTasks.length) {
        const chunkEnd = Math.min(questionIndex + chunkSize, normalizedQuestions.length)
        while (questionIndex < chunkEnd) {
            steps.push(mapQuestionStep(normalizedQuestions[questionIndex], questionNumber))
            questionIndex += 1
            questionNumber += 1
        }

        if (taskIndex < normalizedTasks.length) {
            steps.push(mapTaskStep(normalizedTasks[taskIndex], taskIndex + 1))
            taskIndex += 1
        }
    }

    return steps
}

function mapQuestionStep(question: ReturnType<typeof normalizeSessionItem>, questionNumber: number): SessionStep {
    return {
        id: question.id,
        questionId: question.questionId,
        type: 'question',
        label: `Вопрос ${questionNumber}`,
        text: question.text,
        technology: question.technology,
        options: question.options,
        questionNumber,
    }
}

function mapTaskStep(task: ReturnType<typeof normalizeSessionItem>, taskNumber: number): SessionStep {
    return {
        id: task.id,
        questionId: task.questionId,
        type: 'task',
        label: `Задача ${taskNumber}`,
        text: task.text,
        technology: task.technology,
        taskNumber,
    }
}

export function getSessionStorageKey(interviewId: string) {
    return `interview-session-${interviewId}`
}

export function getAnswersStorageKey(interviewId: string) {
    return `interview-answers-${interviewId}`
}

export function clearInterviewSessionCache(interviewId: string) {
    localStorage.removeItem(getSessionStorageKey(interviewId))
    localStorage.removeItem(getAnswersStorageKey(interviewId))
}

export function restoreAnswersForSession(
    interviewId: string,
    steps: SessionStep[],
): Record<string, StepAnswer> {
    const cachedAnswers = localStorage.getItem(getAnswersStorageKey(interviewId))
    if (!cachedAnswers) {
        return {}
    }

    try {
        const parsed = JSON.parse(cachedAnswers) as Record<string, StepAnswer>
        const stepIds = new Set(steps.map((step) => step.id))

        return Object.fromEntries(
            Object.entries(parsed).filter(([stepId]) => stepIds.has(stepId)),
        )
    } catch {
        return {}
    }
}

export function parseSessionResponse(data: {
    session_id?: string
    interview?: ApiInterview
    questions?: ApiSessionItem[]
    tasks?: ApiSessionItem[]
}) {
    if (!data.interview?.id) {
        throw new Error('Некорректный ответ сервера')
    }

    const interview = normalizeInterview(data.interview)

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
    clearInterviewSessionCache(interviewId)

    const responseData = await requestSessionStart(apiClient, interviewId)
    const sessionData = parseSessionResponse(responseData)

    localStorage.setItem(getSessionStorageKey(interviewId), JSON.stringify(sessionData))

    return sessionData
}

export function formatUserFacingError(error: unknown, fallback: string): string {
    const message = typeof error === 'object'
        && error !== null
        && 'response' in error
        && typeof (error as { response?: { data?: { error?: unknown } } }).response?.data?.error === 'string'
        ? (error as { response: { data: { error: string } } }).response.data.error
        : typeof error === 'string'
            ? error
            : ''

    if (message.includes('not enough questions')) {
        if (message.includes('Go')) {
            return 'В банке пока есть вопросы только по Go. Выберите Go в стеке технологий или создайте новую тренировку с Go.'
        }
        return 'Недостаточно вопросов для выбранного стека или уровня. Попробуйте добавить Go.'
    }

    if (message.includes('not enough tasks')) {
        return 'Недостаточно практических задач для выбранного стека или уровня. Добавьте Go в технологии.'
    }

    const lower = message.toLowerCase()
    if (
        lower.includes('not found')
        || lower.includes('не найдена')
        || lower.includes('load session:')
        || lower.includes('get interview:')
        || lower.includes('get session content:')
    ) {
        return 'Тренировка не найдена'
    }

    if (lower.includes('forbidden') || lower.includes('нет доступа')) {
        return 'Нет доступа к тренировке'
    }

    return message || fallback
}

export function formatSessionStartError(error: unknown): string {
    return formatUserFacingError(error, 'Ошибка при запуске тренировки')
}

export function canStartInterview(status: string) {
    return status === 'scheduled' || status === 'in_progress'
}
