import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import type { ReportWithInterview } from './dashboard';
export interface PreparationStep {
    technology: string;
    specialization: string;
}
export interface PreparationAttempt {
    step_index: number;
    interview_id: string;
    status: string;
    created_at: string;
}
export interface Preparation {
    id: string;
    vacancy_key: string;
    title: string;
    company: string;
    url: string;
    level: string;
    steps: PreparationStep[];
    attempts: PreparationAttempt[];
    created_at: string;
}
export { stepResults } from './preparationProgress';
export function usePreparations() {
    const [preparations, setPreparations] = useState<Preparation[]>([]);
    const [reports, setReports] = useState<ReportWithInterview[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const reload = useCallback(async () => { setLoading(true); setError(''); try {
        const [p, r] = await Promise.all([api.get('/preparations'), api.get('/reports/', { params: { limit: 1000 } })]);
        setPreparations(p.data || []);
        setReports(r.data.reports || []);
    }
    catch {
        setError('Не удалось загрузить подготовки и результаты. Повторите загрузку.');
    }
    finally {
        setLoading(false);
    } }, []);
    useEffect(() => { void reload(); }, [reload]);
    const interviewIds = useMemo(() => new Set(preparations.flatMap(p => p.attempts.map(a => a.interview_id))), [preparations]);
    return { preparations, reports, loading, error, reload, interviewIds };
}
export type PreparationsState = ReturnType<typeof usePreparations>;
/** Resolve context from persisted membership, including direct links to an ordinary report. */
export function usePreparationContext(interviewId?: string) {
    const [preparation, setPreparation] = useState<Preparation | null>(null);
    useEffect(() => { let alive = true; setPreparation(null); if (!interviewId)
        return; api.get<Preparation[]>('/preparations').then(({ data }) => { if (alive)
        setPreparation(data.find(p => p.attempts.some(a => a.interview_id === interviewId)) || null); }).catch(() => { }); return () => { alive = false; }; }, [interviewId]);
    return preparation;
}
