import type { ReportWithInterview } from './dashboard'
export function reportComparisonKey(report: ReportWithInterview): string | null {
    const technologies = Array.from(new Set((report.technologies || []).map(item => item.trim().toLowerCase()).filter(Boolean))).sort()
    if (!technologies.length || !report.interview?.level || !report.interview.specialization || !report.theory_total) return null
    return JSON.stringify([technologies, report.interview.specialization, report.interview.level, report.theory_total, report.task_total || 0])
}
export function previousComparableReport(reports: ReportWithInterview[]) {
    if (!reports.length) return undefined
    const key = reportComparisonKey(reports[0])
    return key ? reports.slice(1).find(item => reportComparisonKey(item) === key) : undefined
}
