const MARKER = /^\s*(?:[-–—•*]|\d+[.)])\s+/

/** Renders LLM text as a list whose dashes use the accent colour. */
export default function AccentList({ text, className = '' }: { text?: string; className?: string }) {
    const lines = (text || '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)

    if (lines.length === 0) {
        return <p className={`text-secondary ${className}`}>—</p>
    }

    const isList = lines.some((line) => MARKER.test(line))
    if (!isList) {
        return <p className={`text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line ${className}`}>{lines.join('\n')}</p>
    }

    return (
        <ul className={`space-y-2 ${className}`}>
            {lines.map((line, index) => (
                <li key={index} className="flex items-start gap-3 text-gray-700 dark:text-gray-300 leading-relaxed">
                    <span className="font-bold text-inter-verse-green dark:text-purple-400 shrink-0" aria-hidden>—</span>
                    <span>{line.replace(MARKER, '')}</span>
                </li>
            ))}
        </ul>
    )
}
