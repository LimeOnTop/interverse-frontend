import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api } from '../../services/api'
import { startInterviewSession, formatSessionStartError } from '../../lib/interviewSession'
import { stepResults, type Preparation } from '../../lib/preparations'
import type { ReportWithInterview } from '../../lib/dashboard'
import { reminderChanged } from '../../lib/practiceReminders'
import { ReminderButton } from '../PracticeReminderDialog'
import ReportPracticeButton from './ReportPracticeButton'

export default function PreparationReportActions({ preparation, report, reports }: { preparation: Preparation; report: ReportWithInterview; reports: ReportWithInterview[] }) {
    const navigate = useNavigate()
    const [busy, setBusy] = useState(false)
    const lock = useRef(false)
    const request = useRef(crypto.randomUUID())
    const current = preparation.attempts.find(attempt => attempt.interview_id === report.interview_id)?.step_index ?? 0
    const currentPassed = stepResults(preparation, current, reports).passed || report.overall_score > 80
    const next = currentPassed ? preparation.steps.findIndex((_, index) => !stepResults(preparation, index, reports).passed) : current
    const stage = preparation.steps[next]
    async function start() {
        if (lock.current || !stage) return
        lock.current = true; setBusy(true)
        try {
            const { data } = await api.post(`/preparations/${preparation.id}/steps/${next}/prepare`, { request_id: request.current })
            await startInterviewSession(api, data.interview_id); reminderChanged(); navigate(`/interview/${data.interview_id}`)
        } catch (error) { toast.error(formatSessionStartError(error)) }
        finally { lock.current = false; setBusy(false) }
    }
    return <section data-report-block className="iv-panel p-5 sm:p-6"><p className="iv-eyebrow">Продолжение подготовки по вакансии</p><h2 className="mt-2 text-xl font-semibold">{preparation.archived ? 'Подготовка в архиве' : stage ? currentPassed ? `Следующий этап — ${stage.technology}` : `Закрепим ${stage.technology}` : 'Все этапы засчитаны'}</h2>
        <p className="mt-2 text-sm text-secondary">Все этапы и повторы входят в одну попытку. Дополнительная попытка не списывается.</p>
        {!preparation.archived && stage && <div className="vp-actions mt-4">{!currentPassed && (report.weak_points_count || report.focus?.length) ? <><ReportPracticeButton reportId={report.id} hidePlanning>Повторить ошибки этапа</ReportPracticeButton><button className="vp-btn" disabled={busy} onClick={() => void start()}>Повторить этап полностью</button></> : <button className="vp-btn primary" disabled={busy} onClick={() => void start()}>{busy ? 'Готовим практику…' : `Продолжить: ${stage.technology}`}</button>}<ReminderButton target={{ kind: 'preparation', target_id: preparation.id, step_index: next, title: stage.technology + ' · ' + preparation.title }} /></div>}
        <Link className="vp-link mt-3" to={`/reports?preparation=${preparation.id}&stage=${report.interview_id}#preparation-${preparation.id}`}>Все этапы и отчёты подготовки →</Link>
    </section>
}
