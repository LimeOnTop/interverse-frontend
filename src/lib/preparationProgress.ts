import type { Preparation } from './preparations';
import type { ReportWithInterview } from './dashboard';
export function stepResults(p: Preparation, index: number, reports: ReportWithInterview[]) {
    const attempts = p.attempts.filter(a => a.step_index === index);
    const ids = new Set(attempts.map(a => a.interview_id));
    const results = reports.filter(r => ids.has(r.interview_id)).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const best = results.length ? Math.max(...results.map(r => r.overall_score)) : null;
    return { attempts, results, best, passed: best !== null && best > 80, active: attempts.find(a => a.status === 'scheduled' || a.status === 'in_progress') };
}
