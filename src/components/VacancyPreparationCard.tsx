import { useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Check, ChevronDown, ExternalLink, Loader2, Play } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../services/api';
import { startInterviewSession, formatSessionStartError } from '../lib/interviewSession';
import { stepResults, type Preparation, type PreparationsState } from '../lib/preparations';
import type { ReportWithInterview } from '../lib/dashboard';
import { levelLabel, formatDay, pluralRu } from '../lib/dashboard';
import { isTrainingLimitError } from '../store/promoStore';
import '../styles/vacancy-path.css';
export function PreparationSection({ data, mode = 'training', query = '', scope = 'all', level = 'all' }: {
    data: PreparationsState;
    mode?: 'dashboard' | 'training' | 'reports';
    query?: string;
    scope?: string;
    level?: string;
}) {
    const { preparations, reports, error, loading, reload } = data;
    if (error)
        return <section className="vp-notice" role="status">{error} <button type="button" onClick={() => void reload()}>Повторить</button></section>;
    if (loading)
        return <p className="vp-muted" role="status">Загружаем подготовки по вакансиям…</p>;
    const visible = preparations.filter(p => { const done = p.steps.every((_, i) => p.attempts.some(a => a.step_index === i && a.status === 'completed')); return (scope !== 'done' || done) && (scope !== 'active' || !done) && (level === 'all' || p.level === level) && [p.title, p.company, ...p.steps.map(s => s.technology)].join(' ').toLowerCase().includes(query.trim().toLowerCase()); });
    if (!visible.length)
        return null;
    return <section className="vp-section" aria-label={mode === 'reports' ? 'Отчёты по вакансиям' : 'Подготовка по вакансиям'}><div className="vp-section-title"><h2>{mode === 'reports' ? 'Отчёты по вакансиям' : 'Подготовка по вакансиям'}</h2><span>{visible.length}</span></div>{visible.map(p => <VacancyPreparationCard key={p.id} preparation={p} reports={reports} mode={mode} onReload={reload}/>)}</section>;
}
function VacancyPreparationCard({ preparation: p, reports, mode, onReload }: {
    preparation: Preparation;
    reports: ReportWithInterview[];
    mode: string;
    onReload: () => Promise<void>;
}) {
    const location = useLocation();
    const navigate = useNavigate();
    const [expanded, setExpanded] = useState(mode !== 'dashboard' || new URLSearchParams(location.search).get('preparation') === p.id);
    const [busy, setBusy] = useState<number | null>(null);
    const pending = useRef<Record<number, string>>({});
    const lock = useRef(false);
    const passed = p.steps.filter((_, i) => stepResults(p, i, reports).passed).length;
    async function start(index: number) {
        if (lock.current)
            return;
        lock.current = true;
        setBusy(index);
        try {
            const request = pending.current[index] ?? crypto.randomUUID();
            pending.current[index] = request;
            const { data } = await api.post(`/preparations/${p.id}/steps/${index}/prepare`, { request_id: request });
            const id = data.interview_id;
            if (!id)
                throw new Error('Не удалось создать тренировку');
            await startInterviewSession(api, id);
            delete pending.current[index];
            navigate(`/interview/${id}`);
        }
        catch (e) {
            if (!isTrainingLimitError(e))
                toast.error(formatSessionStartError(e));
            await onReload();
        }
        finally {
            lock.current = false;
            setBusy(null);
        }
    }
    return <article className="vp-card" id={`preparation-${p.id}`}><header className="vp-head"><span className="vp-mark" aria-hidden="true">{(p.company || p.title).slice(0, 2).toUpperCase()}</span><div><span className="vp-label">Подготовка по вакансии</span><h3>{p.title}</h3><p>{[p.company, levelLabel(p.level), `${p.steps.length} ${pluralRu(p.steps.length, ['технология', 'технологии', 'технологий'])}`].filter(Boolean).join(' · ')}</p></div><button className="vp-expand" type="button" aria-expanded={expanded} aria-controls={`vp-${p.id}-${mode}`} onClick={() => setExpanded(v => !v)}>{expanded ? 'Свернуть' : mode === 'reports' ? 'Отчёты по этапам' : 'Открыть путь'}<ChevronDown size={16} className={expanded ? 'vp-rotated' : ''}/></button></header><div className="vp-summary"><div className="vp-mini" aria-label={`${passed} из ${p.steps.length} этапов засчитано`}>{p.steps.map((s, i) => <span key={i} title={s.technology} className={stepResults(p, i, reports).passed ? 'is-passed' : ''}>{stepResults(p, i, reports).passed ? <Check size={14}/> : i + 1}</span>)}</div><small>{passed} из {p.steps.length} этапов засчитано</small></div>
 {expanded && <div className="vp-content" id={`vp-${p.id}-${mode}`}><div className="vp-instructions"><h4>{mode === 'reports' ? 'Результаты по технологиям' : 'Ваш путь к собеседованию'}</h4><p>Для зачёта нужно больше 80%. Сохраняем лучший результат.</p>{mode !== 'reports' && <small>Вся подготовка — одна попытка, включая повторы. Теория · около 10 минут на этап.</small>}</div>
 {mode === 'reports' ? <div>{p.steps.map((s, i) => { const r = stepResults(p, i, reports); return <details className="vp-report-step" key={i} open={new URLSearchParams(location.search).get('preparation') === p.id && r.attempts.some(a => a.interview_id === new URLSearchParams(location.search).get('stage'))}><summary><span className={`vp-node ${r.passed ? 'is-passed' : ''}`}>{r.passed ? <Check size={16}/> : i + 1}</span><span className="vp-report-name">{s.technology}<small>{r.results.length ? `${r.results.length} ${pluralRu(r.results.length, ['отчёт', 'отчёта', 'отчётов'])}` : r.active ? 'Тренировка не завершена' : 'Пока нет отчёта'}</small></span><span>{r.best !== null ? `${Math.round(r.best)}%` : ''}</span><ChevronDown size={16}/></summary><div className="vp-report-body">{r.results.length ? <><p>{r.passed ? 'Этап засчитан. Можно перейти к следующей технологии.' : 'Повторите сложные темы: для зачёта нужно больше 80%.'}</p>{r.results.map(report => <div className="vp-attempt" key={report.id}><div><b>{Math.round(report.overall_score)}%</b><small>{formatDay(report.created_at)} · {report.overall_score > 80 ? 'Засчитано' : 'Стоит повторить'}</small></div><Link className="vp-btn primary" to={`/reports/${report.id}?preparation=${p.id}`}>Открыть полный отчёт</Link></div>)}</> : <p>{r.active ? 'Завершите тренировку, чтобы получить отчёт.' : 'Пройдите тренировку по технологии, чтобы увидеть результат и разбор ответов.'}</p>}<button className="vp-btn" disabled={busy !== null} onClick={() => void start(i)}>{busy === i ? <Loader2 size={16} className="animate-spin"/> : null}{r.active ? 'Продолжить тренировку' : r.results.length ? 'Повторить тренировку' : 'Начать тренировку'}</button></div></details>; })}</div> : <ol className="vp-path">{p.steps.map((s, i) => { const r = stepResults(p, i, reports); return <li key={i}><span className={`vp-node ${r.passed ? 'is-passed' : ''}`}>{r.passed ? <Check size={17}/> : String(i + 1).padStart(2, '0')}</span><div className={`vp-step ${r.passed ? 'is-complete' : ''}`}><div className="vp-step-title"><h4>{s.technology}</h4><span>{r.passed ? `${Math.round(r.best!)}% · Засчитано` : r.active ? 'В процессе' : r.best !== null ? `${Math.round(r.best)}% · Стоит повторить` : 'Не начато'}</span></div><p>Теория · {levelLabel(p.level)}</p><div className="vp-actions"><button className="vp-btn" disabled={busy !== null} onClick={() => void start(i)}>{busy === i ? <Loader2 size={16} className="animate-spin"/> : <Play size={14}/>} {r.active ? 'Продолжить' : r.attempts.some(a => a.status === 'completed') ? 'Повторить тренировку' : 'Начать тренировку'}</button>{r.results.length > 0 && <Link className="vp-link" to={`/reports/${r.results[0].id}?preparation=${p.id}`}>Отчёт по этапу →</Link>}{!r.results.length && r.attempts.some(a => a.status === 'completed') && <Link className="vp-link" to={`/reports?preparation=${p.id}`}>Проверить отчёт →</Link>}</div></div></li>; })}</ol>}</div>}
 <footer className="vp-footer"><span>{mode === 'reports' ? 'Полный разбор открывается в обычном отчёте тренировки' : 'Все этапы доступны независимо друг от друга'}</span>{p.url && <a href={p.url} target="_blank" rel="noopener noreferrer">Исходная вакансия <ExternalLink size={12}/></a>}</footer></article>;
}
