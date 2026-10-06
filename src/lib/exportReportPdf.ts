import { jsPDF } from 'jspdf'
import type { AnswerReviewItem, GeneratedReport } from './reportAnalysis'
import { buildReportSections, getScoreLabel } from './reportScores'

export interface ReportPdfInput extends GeneratedReport {
    interview?: {
        id?: string
        title?: string
        specialization?: string
        level?: string
        scheduled_at?: string
        duration?: number
    }
}

const PAGE_MARGIN = 16
const LINE_HEIGHT = 5.4
const SECTION_GAP = 7
const FONT_NAME = 'DejaVuSans'
const FONT_URL = '/fonts/DejaVuSans.ttf'
const FONT_BOLD_URL = '/fonts/DejaVuSans-Bold.ttf'

const SPECIALIZATION_LABELS: Record<string, string> = {
    frontend: 'Frontend',
    backend: 'Backend',
    devops: 'DevOps',
    qa: 'QA',
    data_science: 'Data Science',
}

const LEVEL_LABELS: Record<string, string> = {
    intern: 'Intern',
    junior: 'Junior',
    middle: 'Middle',
    senior: 'Senior',
    lead: 'Lead/CTO',
}

let fontCache: { regular?: string; bold?: string } = {}

function arrayBufferToBase64(buffer: ArrayBuffer) {
    const bytes = new Uint8Array(buffer)
    const chunk = 0x8000
    let binary = ''
    for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
    }
    return btoa(binary)
}

async function loadFontBase64(url: string) {
    const response = await fetch(url)
    if (!response.ok) {
        throw new Error('Не удалось загрузить шрифт для PDF')
    }
    return arrayBufferToBase64(await response.arrayBuffer())
}

async function ensureFonts(doc: jsPDF) {
    if (!fontCache.regular) {
        fontCache.regular = await loadFontBase64(FONT_URL)
    }
    if (!fontCache.bold) {
        fontCache.bold = await loadFontBase64(FONT_BOLD_URL)
    }

    doc.addFileToVFS(`${FONT_NAME}.ttf`, fontCache.regular)
    doc.addFont(`${FONT_NAME}.ttf`, FONT_NAME, 'normal')
    doc.addFileToVFS(`${FONT_NAME}-Bold.ttf`, fontCache.bold)
    doc.addFont(`${FONT_NAME}-Bold.ttf`, FONT_NAME, 'bold')
    doc.setFont(FONT_NAME, 'normal')
}

function sanitizeFilename(value: string) {
    return value
        .replace(/[^\p{L}\p{N}\-_ ]+/gu, '')
        .trim()
        .replace(/\s+/g, '-')
        .slice(0, 60) || 'report'
}

function formatDate(value?: string) {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '—'
    return date.toLocaleString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

function createPdfWriter(doc: jsPDF) {
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const contentWidth = pageWidth - PAGE_MARGIN * 2
    let y = PAGE_MARGIN

    const ensureSpace = (needed: number) => {
        if (y + needed <= pageHeight - PAGE_MARGIN) return
        doc.addPage()
        y = PAGE_MARGIN
    }

    const writeWrapped = (text: string, options?: { bold?: boolean; size?: number; color?: [number, number, number] }) => {
        const size = options?.size ?? 10
        doc.setFont(FONT_NAME, options?.bold ? 'bold' : 'normal')
        doc.setFontSize(size)
        if (options?.color) {
            doc.setTextColor(...options.color)
        } else {
            doc.setTextColor(30, 30, 30)
        }

        const lines = doc.splitTextToSize(text || '—', contentWidth) as string[]
        for (const line of lines) {
            ensureSpace(LINE_HEIGHT)
            doc.text(line, PAGE_MARGIN, y)
            y += LINE_HEIGHT
        }
    }

    const writeHeading = (text: string) => {
        y += SECTION_GAP / 2
        ensureSpace(10)
        writeWrapped(text, { bold: true, size: 13, color: [1, 50, 32] })
        y += 1.5
    }

    const writeLabelValue = (label: string, value: string) => {
        ensureSpace(LINE_HEIGHT * 2)
        doc.setFont(FONT_NAME, 'bold')
        doc.setFontSize(9)
        doc.setTextColor(100, 100, 100)
        doc.text(label, PAGE_MARGIN, y)
        y += LINE_HEIGHT
        writeWrapped(value, { size: 10 })
        y += 1.2
    }

    return { writeWrapped, writeHeading, writeLabelValue }
}

function formatAnswerReview(item: AnswerReviewItem, index: number) {
    const kind = item.item_type === 'task' ? 'Задача' : 'Вопрос'
    const correctness =
        typeof item.is_correct === 'boolean'
            ? (item.is_correct ? 'верно' : 'неверно')
            : 'без оценки'
    const lines = [
        `${index + 1}. ${kind}: ${item.label || 'Без названия'} (${correctness})`,
    ]
    if (item.technology) lines.push(`Технология: ${item.technology}`)
    if (item.prompt) lines.push(`Условие: ${item.prompt}`)
    if (item.options && item.options.length > 0) {
        lines.push(`Варианты: ${item.options.map((opt, i) => `${i + 1}) ${opt}`).join('; ')}`)
    }
    lines.push(`Ответ кандидата: ${item.user_answer || '—'}`)
    lines.push(`Эталон: ${item.correct_answer || '—'}`)
    return lines.join('\n')
}

/** Builds and downloads a PDF with the full report payload (Cyrillic-safe). */
export async function downloadReportPdf(report: ReportPdfInput) {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    await ensureFonts(doc)
    const { writeWrapped, writeHeading, writeLabelValue } = createPdfWriter(doc)

    const title = report.interview?.title || 'Тренировка'
    const specialization = SPECIALIZATION_LABELS[report.interview?.specialization || ''] || report.interview?.specialization || '—'
    const level = LEVEL_LABELS[report.interview?.level || ''] || report.interview?.level || '—'
    const sections = buildReportSections(report)
    const createdAt = formatDate(report.created_at)
    const scheduledAt = formatDate(report.interview?.scheduled_at)

    writeWrapped('InterVerse — отчёт по тренировке', { bold: true, size: 16, color: [1, 50, 32] })
    writeWrapped(title, { bold: true, size: 13 })
    writeWrapped(`Сформирован: ${createdAt}`, { size: 9, color: [110, 110, 110] })

    writeHeading('О тренировке')
    writeLabelValue('Специализация', specialization)
    writeLabelValue('Уровень', level)
    writeLabelValue('Дата проведения', scheduledAt)
    writeLabelValue('ID интервью', report.interview?.id || report.interview_id || '—')
    writeLabelValue('ID отчёта', report.id || '—')

    writeHeading('Общая оценка')
    writeWrapped(`${report.overall_score}% — ${getScoreLabel(report.overall_score)}`, { bold: true, size: 12 })

    writeHeading('Оценки по критериям')
    for (const section of sections) {
        const status = section.comingSoon
            ? 'скоро'
            : typeof section.passed === 'boolean'
                ? (section.passed ? 'сдано' : 'не сдано')
                : getScoreLabel(section.score)
        writeWrapped(`${section.name}: ${section.score}% (${status})`)
    }

    writeHeading('Комментарии интервьюера')
    writeWrapped(report.comments || '—')

    writeHeading('Рекомендации')
    writeWrapped(report.recommendations || '—')

    const weakPoints = report.weak_points || []
    if (weakPoints.length > 0) {
        writeHeading('Слабые места')
        weakPoints.forEach((point, index) => {
            const lines = [
                `${index + 1}. ${point.label}: ${point.prompt}`,
                `Ваш ответ: ${point.user_answer || '—'}`,
                `Правильный ответ: ${point.correct_answer || '—'}`,
            ]
            if (point.explanation) lines.push(`Объяснение: ${point.explanation}`)
            lines.push(`Изучить тему «${point.topic}»: ${point.source_url}`)
            writeWrapped(lines.join('\n'), { size: 9 })
            writeWrapped(' ', { size: 6 })
        })
    }

    const reviews = [...(report.answer_reviews || [])].sort((a, b) => {
        const typeOrder = (type: string) => (type === 'task' ? 1 : 0)
        const byType = typeOrder(a.item_type) - typeOrder(b.item_type)
        if (byType !== 0) return byType
        return (a.sort_order ?? 0) - (b.sort_order ?? 0)
    })

    writeHeading('Разбор ответов')
    if (reviews.length === 0) {
        writeWrapped('Разбор ответов для этого отчёта не сохранён.')
    } else {
        reviews.forEach((item, index) => {
            writeWrapped(formatAnswerReview(item, index), { size: 9 })
            writeWrapped(' ', { size: 6 })
        })
    }

    const filename = `interverse-report-${sanitizeFilename(title)}-${report.id?.slice(0, 8) || 'export'}.pdf`
    doc.save(filename)
}
