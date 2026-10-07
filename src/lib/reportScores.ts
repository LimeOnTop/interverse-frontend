import type { BadgeVariant } from '../components/ui/Badge'

export const PASS_SCORE_THRESHOLD = 60

export interface ReportSectionScore {
    key: string
    name: string
    score: number
    passed?: boolean
    /** Section exists in UI but is not scored yet. */
    comingSoon?: boolean
}

export function isSectionPassed(score: number, passed?: boolean): boolean {
    if (typeof passed === 'boolean') {
        return passed
    }

    return score >= PASS_SCORE_THRESHOLD
}

export function getScoreVariant(score: number): BadgeVariant {
    return score >= PASS_SCORE_THRESHOLD ? 'success' : 'danger'
}

export function getScoreLabel(score: number) {
    if (score >= 80) return 'Отлично'
    if (score >= PASS_SCORE_THRESHOLD) return 'Хорошо'
    if (score === 0) return 'Не пройдено'
    return 'Требует улучшения'
}

export function buildReportSections(report: {
    algorithm_score: number
    architecture_score: number
    coding_score: number
    soft_skills_score: number
    algorithm_passed?: boolean
    architecture_passed?: boolean
    coding_passed?: boolean
    soft_skills_passed?: boolean
}): ReportSectionScore[] {
    return [
        { key: 'theory', name: 'Теория', score: report.algorithm_score, passed: report.algorithm_passed },
        { key: 'architecture', name: 'Архитектура', score: report.architecture_score, passed: false, comingSoon: true },
        { key: 'coding', name: 'Кодинг', score: report.coding_score, passed: report.coding_passed },
        { key: 'soft_skills', name: 'Soft Skills', score: report.soft_skills_score, passed: false, comingSoon: true },
    ]
}
