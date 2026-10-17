import PageTransition from '../components/ui/PageTransition'
import PublicNav from '../components/PublicNav'
import SiteFooter from '../components/SiteFooter'

export default function ContractorPage() {
    return (
        <PageTransition>
            <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-iv-dark-bg">
                <PublicNav />
                <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
                    <p className="iv-eyebrow">InterVerse / Реквизиты</p>
                    <h1 className="mt-3 text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">Об исполнителе</h1>
                    <p className="mt-4 mb-8 text-secondary">Сведения об исполнителе услуг сервиса InterVerse и контакты для обращений.</p>
                    <dl className="iv-panel rounded-2xl p-6 sm:p-8 space-y-6">
                        {[
                            ['Исполнитель', 'Щеглов Константин Михайлович'],
                            ['Статус', 'Самозанятый — плательщик налога на профессиональный доход'],
                            ['ИНН', '772974697900'],
                            ['Город', 'г. Москва'],
                        ].map(([label, value]) => (
                            <div key={label} className="grid sm:grid-cols-[8rem_1fr] gap-1 sm:gap-4">
                                <dt className="text-sm text-secondary">{label}</dt>
                                <dd className="text-gray-900 dark:text-gray-100 font-medium break-words">{value}</dd>
                            </div>
                        ))}
                        <div className="grid sm:grid-cols-[8rem_1fr] gap-1 sm:gap-4">
                            <dt className="text-sm text-secondary">Email</dt>
                            <dd><a className="text-inter-verse-green dark:text-purple-400 underline" href="mailto:info@inter-verse.ru">info@inter-verse.ru</a></dd>
                        </div>
                        <div className="grid sm:grid-cols-[8rem_1fr] gap-1 sm:gap-4">
                            <dt className="text-sm text-secondary">Телефон</dt>
                            <dd><a className="text-inter-verse-green dark:text-purple-400 underline" href="tel:+79991979766">+7 (999) 197-97-66</a></dd>
                        </div>
                    </dl>
                    <p className="mt-8 text-secondary text-sm">По вопросам услуг, оплаты и возврата обращайтесь по указанным контактам.</p>
                    <div className="mt-5 flex flex-wrap gap-6 text-sm text-inter-verse-green dark:text-purple-400">
                        <a href="/legal/oferta.html" className="underline">Публичная оферта</a>
                        <a href="/legal/refund.html" className="underline">Условия возврата</a>
                        <a href="/privacy" className="underline">Политика обработки ПДн</a>
                    </div>
                </main>
                <SiteFooter />
            </div>
        </PageTransition>
    )
}
