import { reachGoal } from '../lib/analytics'
import { writePrivateCache } from '../lib/privateStorage'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { clearTrainingIntent, pendingTrainingIntent } from '../lib/trainingIntent'
import { formatSessionStartError, getSessionStorageKey, parseSessionResponse } from '../lib/interviewSession'
import PublicNav from '../components/PublicNav'

export default function ResumeTrainingPage() {
    const navigate = useNavigate()
    const running = useRef(false)
    const [error, setError] = useState('')
    const [attempt, setAttempt] = useState(0)
    useEffect(() => {
        const id = pendingTrainingIntent()
        if (!id) { navigate('/interviews/create', { replace: true }); return }
        if (running.current) return
        running.current = true
        reachGoal('training_resume_submit')
        void api.post(`/training-intents/${id}/resume`).then(({ data }) => {
            const session = parseSessionResponse(data)
            if (!session.steps.length) throw new Error('Пустая тренировка')
            writePrivateCache(localStorage, getSessionStorageKey(session.interview.id), session)
            reachGoal('training_resume_complete', {}, `resume:${session.interview.id}`)
            clearTrainingIntent()
            navigate(`/interview/${session.interview.id}`, { replace: true })
        }).catch((err: unknown) => {
            reachGoal('training_resume_error')
            setError(formatSessionStartError(err))
            running.current = false
        })
    }, [navigate, attempt])
    return <><PublicNav /><main className="iv-home iv-home-container" style={{ paddingTop: 100, paddingBottom: 100 }}><h1>{error ? 'Не удалось начать тренировку' : 'Готовим твою тренировку…'}</h1><p role={error ? 'alert' : 'status'}>{error || 'Загружаем вопросы и задачи с выбранными параметрами.'}</p>{error && <div className="iv-hero-actions"><button className="iv-landing-button" onClick={() => { setError(''); setAttempt(n => n + 1) }}>Попробовать ещё раз</button><Link className="iv-landing-text-button" to="/interviews/create" onClick={clearTrainingIntent}>Изменить параметры</Link></div>}</main></>
}
