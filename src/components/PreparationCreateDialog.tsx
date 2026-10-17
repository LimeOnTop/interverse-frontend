import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, X } from 'lucide-react';
import { api } from '../services/api';
import { LEVELS, SPECIALIZATIONS } from './InterviewWizard/options';
import type { VacancyCardData } from './VacancyCard';
import { inferLevel } from './VacancyCard';
import type { Preparation, PreparationStep } from '../lib/preparations';
import '../styles/vacancy-path.css';
function direction(technology: string) { const t = technology.toLowerCase(); if (/^(docker|kubernetes|k8s|terraform|ansible|jenkins|aws|azure|gcp|prometheus|grafana|gitlab ci|github actions)$/.test(t))
    return 'devops'; if (/^(react|vue|angular|javascript|typescript|css|html|next.js)$/.test(t))
    return 'frontend'; if (/^(selenium|cypress|playwright|junit|pytest|postman)$/.test(t))
    return 'qa'; if (/^(pandas|numpy|tensorflow|pytorch|scikit-learn|r)$/.test(t))
    return 'data_science'; return 'backend'; }
export default function PreparationCreateDialog({ vacancy, onClose }: {
    vacancy: VacancyCardData;
    onClose: () => void;
}) {
    const dialog = useRef<HTMLDialogElement>(null);
    const navigate = useNavigate();
    const manual = vacancy.source === 'manual';
    const manualKey = useRef(crypto.randomUUID());
    const [title, setTitle] = useState(vacancy.title);
    const [url, setURL] = useState(vacancy.url);
    const [level, setLevel] = useState(manual ? 'junior' : inferLevel(vacancy.experience));
    const [steps, setSteps] = useState<PreparationStep[]>(() => Array.from(new Set(vacancy.skills || [])).slice(0, 30).map(technology => ({ technology, specialization: direction(technology) })));
    const [technology, setTechnology] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    useEffect(() => { const d = dialog.current; d?.showModal(); return () => d?.close(); }, []);
    function add() { const t = technology.trim(); if (!t || steps.some(s => s.technology.toLowerCase() === t.toLowerCase()))
        return; setSteps(v => [...v, { technology: t, specialization: direction(t) }]); setTechnology(''); }
    async function save() { if (busy || !steps.length || !title.trim())
        return; setBusy(true); setError(''); try {
        const { data } = await api.post<Preparation>('/preparations', { vacancy_key: manual ? `manual:${url.trim() || manualKey.current}` : `${vacancy.source}:${vacancy.external_id || vacancy.id}`, title: title.trim(), company: vacancy.company_name || '', url: url.trim(), level, steps });
        navigate(`/dashboard?preparation=${data.id}`);
    }
    catch (e) {
        const a = e as {
            response?: {
                data?: {
                    error?: string;
                };
            };
        };
        setError(a.response?.data?.error || 'Не удалось сохранить подготовку. Попробуйте ещё раз.');
    }
    finally {
        setBusy(false);
    } }
    return <dialog ref={dialog} className="vp-dialog" onCancel={e => { if (busy)
        e.preventDefault();
    else
        onClose(); }} aria-labelledby="prep-title"><div className="vp-dialog-head"><span className="vp-label">Подготовка по вакансии</span><button aria-label="Закрыть" onClick={onClose} disabled={busy}><X size={18}/></button></div><h2 id="prep-title">{manual ? 'Подготовка к своей вакансии' : vacancy.title}</h2>{manual && <div className="vp-manual"><label>Название позиции<input value={title} maxLength={250} onChange={e => setTitle(e.target.value)} autoFocus placeholder="Например, Python-разработчик" disabled={busy}/></label><label>Ссылка на вакансию (необязательно)<input type="url" value={url} maxLength={2000} onChange={e => setURL(e.target.value)} placeholder="https://…" disabled={busy}/></label></div>}<p className="vp-muted">{vacancy.company_name ? `${vacancy.company_name} · ` : ''}Проверьте технологии и уровень перед началом.</p><div className="vp-notice">{manual ? 'Добавьте технологии из требований вакансии и проверьте направление для каждой.' : vacancy.skills?.length ? 'Список технологий получен из карточки вакансии. Его можно уточнить.' : 'Источник не указал технологии. Добавьте их из описания вакансии — навыки профиля не подставляются.'}</div><label className="vp-level">Уровень подготовки<select value={level} onChange={e => setLevel(e.target.value)} disabled={busy}>{LEVELS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select></label><div className="vp-edit-steps">{steps.map((s, i) => <div className="vp-edit-step" key={s.technology}><b>{i + 1}. {s.technology}</b><select aria-label={`Направление для ${s.technology}`} value={s.specialization} disabled={busy} onChange={e => setSteps(v => v.map((x, j) => j === i ? { ...x, specialization: e.target.value } : x))}>{SPECIALIZATIONS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select><button aria-label={`Убрать ${s.technology}`} disabled={busy} onClick={() => setSteps(v => v.filter((_, j) => j !== i))}><X size={16}/></button></div>)}</div><form className="vp-add" onSubmit={e => { e.preventDefault(); add(); }}><input aria-label="Технология" placeholder="Добавить технологию, например Python" value={technology} maxLength={100} onChange={e => setTechnology(e.target.value)} disabled={busy || steps.length >= 30}/><button disabled={busy || !technology.trim() || steps.length >= 30}>Добавить</button></form><p className="vp-muted">Вся подготовка считается за одну попытку в лимите. Все технологии, продолжения и повторы входят в неё. Начинайте с любой технологии.</p>{error && <p role="alert" className="vp-error">{error}</p>}<div className="vp-actions" style={{ marginTop: 20 }}><button className="vp-btn" disabled={busy} onClick={onClose}>Отмена</button><button className="vp-btn primary" disabled={busy || !steps.length || !title.trim()} onClick={() => void save()}>{busy && <Loader2 size={16} className="animate-spin"/>}Создать подготовку · 1 попытка</button></div></dialog>;
}
