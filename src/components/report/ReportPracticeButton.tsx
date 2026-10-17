import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '../../services/api'
import { formatSessionStartError, getSessionStorageKey, parseSessionResponse } from '../../lib/interviewSession'
import { writePrivateCache } from '../../lib/privateStorage'
import { isTrainingLimitError } from '../../store/promoStore'

export default function ReportPracticeButton({ reportId, className = '', children = 'Повторить вопросы с ошибками' }: { reportId: string; className?: string; children?: React.ReactNode }) {
    const [busy, setBusy] = useState(false)
    const locked = useRef(false)
    const request = useRef<{ reportId: string; id: string } | null>(null)
    const navigate = useNavigate()
    const start = async () => {
        if (locked.current) return
        locked.current = true
        setBusy(true)
        if (request.current?.reportId !== reportId) request.current = { reportId, id: crypto.randomUUID() }
        try {
            const { data } = await api.post(`/reports/${reportId}/practice`, { request_id: request.current.id })
            const session = parseSessionResponse(data)
            if (!session.steps.length) throw new Error('В отчёте нет материала для повторения')
            writePrivateCache(localStorage, getSessionStorageKey(session.interview.id), session)
            navigate(`/interview/${session.interview.id}`)
        } catch (error) {
            if (!isTrainingLimitError(error)) toast.error(formatSessionStartError(error))
        } finally {
            locked.current = false
            setBusy(false)
        }
    }
    return <button type="button" onClick={() => void start()} disabled={busy} aria-busy={busy} className={`btn-primary-adaptive inline-flex items-center justify-center gap-2 rounded-lg disabled:opacity-60 ${className}`}>{busy ? <><Loader2 size={17} className="animate-spin" />Готовим повторение…</> : <>{children}<ArrowRight size={17} /></>}</button>
}
