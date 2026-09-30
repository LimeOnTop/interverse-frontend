import { Link } from 'react-router-dom'

const CONTACTS = {
    legalName: 'Самозанятый Щеглов Константин Михайлович',
    email: 'info@inter-verse.ru',
    phoneDisplay: '+7 (999) 197-97-66',
    phoneHref: 'tel:+79991979766',
    inn: '772974697900',
    city: 'г. Москва',
} as const

interface SiteFooterProps {
    className?: string
}

export default function SiteFooter({ className = '' }: SiteFooterProps) {
    return (
        <footer
            className={`iv-landing-section py-8 border-t border-gray-200 dark:border-gray-600 ${className}`}
        >
            <div className="max-w-content mx-auto px-6 lg:px-8 flex flex-col gap-4 text-sm text-secondary">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <span>&copy; {new Date().getFullYear()} InterVerse. Все права защищены.</span>
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                        <Link
                            to="/pricing"
                            className="font-medium text-inter-verse-green dark:text-purple-400 hover:underline"
                        >
                            Тарифы
                        </Link>
                        <a
                            href="/legal/oferta.html"
                            className="font-medium text-inter-verse-green dark:text-purple-400 hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Публичная оферта
                        </a>
                        <a
                            href="/privacy"
                            className="font-medium text-inter-verse-green dark:text-purple-400 hover:underline"
                        >
                            Политика ПДн
                        </a>
                        <a
                            href="/legal/refund.html"
                            className="font-medium text-inter-verse-green dark:text-purple-400 hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Возврат
                        </a>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <div className="flex flex-col sm:flex-row sm:flex-wrap gap-x-6 gap-y-1">
                        <span>{CONTACTS.legalName}</span>
                        <span>ИНН {CONTACTS.inn}</span>
                        <span>{CONTACTS.city}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:flex-wrap gap-x-6 gap-y-1">
                        <a
                            href={`mailto:${CONTACTS.email}`}
                            className="hover:text-inter-verse-green dark:hover:text-purple-400 transition-iv"
                        >
                            {CONTACTS.email}
                        </a>
                        <a
                            href={CONTACTS.phoneHref}
                            className="hover:text-inter-verse-green dark:hover:text-purple-400 transition-iv"
                        >
                            {CONTACTS.phoneDisplay}
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    )
}
