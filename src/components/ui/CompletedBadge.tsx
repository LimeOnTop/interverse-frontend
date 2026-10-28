import './CompletedBadge.css'

/** Shared borderless gradient status for every completed training and report. */
export default function CompletedBadge({ className = '' }: { className?: string }) {
    return <span className={`iv-status-completed ${className}`}><span className="iv-status-completed-label">Завершено</span></span>
}
