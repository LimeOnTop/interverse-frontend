import ProTrialOffer from './ProTrialOffer'
import { Link } from 'react-router-dom'

const CONTACTS = {
    email: 'info@inter-verse.ru',
    phoneDisplay: '+7 (999) 197-97-66',
    phoneHref: 'tel:+79991979766',
} as const

interface SiteFooterProps {
    className?: string
}

export default function SiteFooter({ className = '' }: SiteFooterProps) {
    return (
        <footer
            className={`iv-landing-section py-8 border-t border-gray-200 dark:border-iv-dark-line ${className}`}
        >
            <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8"><ProTrialOffer /></div>
            <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-4 text-sm text-secondary">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <span>&copy; {new Date().getFullYear()} InterVerse. Все права защищены.</span>
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                        <Link to="/preparation/system-design">System Design</Link>
                    <Link to="/preparation" className="inline-flex items-center min-h-[44px] hover:underline">Подготовка</Link>
                        <a href="/about-contractor" className="inline-flex items-center min-h-[44px] hover:underline">Об исполнителе</a>
                        <Link to="/jobs" className="inline-flex items-center min-h-[44px] hover:underline">Вакансии IT</Link>
                        <Link
                            to="/pricing"
                            className="inline-flex items-center min-h-[44px] sm:min-h-0 font-medium text-inter-verse-green dark:text-purple-400 hover:underline"
                        >
                            Тарифы
                        </Link>
                        <a
                            href="/legal/oferta.html"
                            className="inline-flex items-center min-h-[44px] sm:min-h-0 font-medium text-inter-verse-green dark:text-purple-400 hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Публичная оферта
                        </a>
                        <a
                            href="/privacy"
                            className="inline-flex items-center min-h-[44px] sm:min-h-0 font-medium text-inter-verse-green dark:text-purple-400 hover:underline"
                        >
                            Политика конфиденциальности
                        </a>
                        <a
                            href="/legal/refund.html"
                            className="inline-flex items-center min-h-[44px] sm:min-h-0 font-medium text-inter-verse-green dark:text-purple-400 hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Возврат
                        </a>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <div className="flex flex-col sm:flex-row sm:flex-wrap gap-x-6 gap-y-1">
                        <a
                            href={`mailto:${CONTACTS.email}`}
                            className="inline-flex items-center min-h-[44px] sm:min-h-0 hover:text-inter-verse-green dark:hover:text-purple-400 transition-iv"
                        >
                            {CONTACTS.email}
                        </a>
                        <a
                            href={CONTACTS.phoneHref}
                            className="inline-flex items-center min-h-[44px] sm:min-h-0 hover:text-inter-verse-green dark:hover:text-purple-400 transition-iv"
                        >
                            {CONTACTS.phoneDisplay}
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    )
}
