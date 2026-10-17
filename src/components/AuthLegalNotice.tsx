import { Link } from 'react-router-dom'

export default function AuthLegalNotice() {
    const linkClass = 'font-medium text-inter-verse-green dark:text-purple-400 hover:underline'
    return (
        <p className="text-xs text-secondary leading-relaxed">
            Ты соглашаешься с{' '}
            <a href="/legal/oferta.html#account" target="_blank" rel="noopener noreferrer" className={linkClass}>офертой</a>
            {' '}и <Link to="/privacy" target="_blank" rel="noopener noreferrer" className={linkClass}>политикой обработки персональных данных</Link>.
        </p>
    )
}
