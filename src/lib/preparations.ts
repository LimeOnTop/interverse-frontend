import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import type { ReportWithInterview } from './dashboard';
export interface PreparationStep {
    id?: string;
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
    revision?: number;
    archived?: boolean;
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
    const owner = useAuthStore(state => state.user?.id);
    const loaded = useRef(false);
    const [loadedOwner,setLoadedOwner] = useState(owner);
    const [preparations, setPreparations] = useState<Preparation[]>([]);
    const [reports, setReports] = useState<ReportWithInterview[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const reload = useCallback(async () => { if(!owner)return; if(!loaded.current)setLoading(true); setError(''); try {
        const [p, r] = await Promise.all([api.get('/preparations'), api.get('/reports/', { params: { limit: 1000 } })]);
        if(useAuthStore.getState().user?.id!==owner)return;
        loaded.current=true;setLoadedOwner(owner);
        setPreparations(p.data || []);
        setReports(r.data.reports || []);
    }
    catch {
        if(useAuthStore.getState().user?.id!==owner)return;
        setError('Не удалось загрузить подготовки и результаты. Повторите загрузку.');
    }
    finally {
        if(useAuthStore.getState().user?.id===owner)setLoading(false);
    } }, [owner]);
    useEffect(() => { loaded.current=false;setPreparations([]);setReports([]); void reload(); }, [reload]);
    const interviewIds = useMemo(() => new Set(preparations.flatMap(p => p.attempts.map(a => a.interview_id))), [preparations]);
    return { preparations: loadedOwner===owner?preparations:[], reports: loadedOwner===owner?reports:[], loading: loadedOwner!==owner||loading, error, reload, interviewIds };
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
