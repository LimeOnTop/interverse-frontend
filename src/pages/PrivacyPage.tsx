import { Link } from 'react-router-dom'
import PageTransition from '../components/ui/PageTransition'
import SiteFooter from '../components/SiteFooter'
import PublicNav from '../components/PublicNav'

export default function PrivacyPage() {
    return (
        <PageTransition>
            <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-iv-dark-bg">
                <PublicNav />
                <main className="flex-1 max-w-3xl mx-auto px-6 lg:px-8 py-10">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                        Политика обработки персональных данных
                    </h1>
                    <div className="space-y-4 text-sm text-secondary leading-relaxed">
                        <p>
                            Настоящая Политика определяет порядок обработки и защиты персональных данных
                            пользователей сервиса InterVerse (сайт{' '}
                            <a href="https://inter-verse.ru" className="text-inter-verse-green dark:text-purple-400 hover:underline">
                                https://inter-verse.ru
                            </a>
                            ) в соответствии с Федеральным законом от 27.07.2006 № 152-ФЗ «О персональных данных».
                        </p>
                        <p>
                            <strong className="text-gray-900 dark:text-gray-100">Оператор:</strong> Самозанятый
                            Щеглов Константин Михайлович, г. Москва, ИНН 772974697900, e-mail:{' '}
                            <a href="mailto:info@inter-verse.ru" className="text-inter-verse-green dark:text-purple-400 hover:underline">
                                info@inter-verse.ru
                            </a>
                            , тел. +7 (999) 197-97-66.
                        </p>
                        <p>
                            <strong className="text-gray-900 dark:text-gray-100">Какие данные обрабатываются:</strong>{' '}
                            фамилия/имя (при указании), адрес электронной почты, данные профиля (навыки, опыт),
                            технические данные (IP, cookie, сведения о браузере), сведения об оплате подписки
                            в объёме, необходимом для исполнения договора.
                        </p>
                        <p>
                            <strong className="text-gray-900 dark:text-gray-100">Цели обработки:</strong> регистрация и
                            аутентификация; оказание услуг сервиса; оформление и сопровождение подписки Pro;
                            направление сервисных уведомлений; исполнение требований законодательства РФ.
                        </p>
                        <p>
                            <strong className="text-gray-900 dark:text-gray-100">Правовые основания:</strong> согласие
                            субъекта персональных данных; исполнение договора (публичной оферты); законные интересы
                            оператора в части обеспечения безопасности сервиса.
                        </p>
                        <p>
                            <strong className="text-gray-900 dark:text-gray-100">Передача третьим лицам:</strong>{' '}
                            платёжному провайдеру Robokassa (для приёма оплаты и фискализации чеков), хостинг- и
                            инфраструктурным подрядчикам — только в объёме, необходимом для оказания услуги.
                        </p>
                        <p>
                            <strong className="text-gray-900 dark:text-gray-100">Срок хранения:</strong> в течение срока
                            использования сервиса и сроков, установленных законодательством РФ. По запросу пользователя
                            данные могут быть уточнены, заблокированы или удалены, если иное не предусмотрено законом.
                        </p>
                        <p>
                            Запросы по персональным данным направляйте на{' '}
                            <a href="mailto:info@inter-verse.ru" className="text-inter-verse-green dark:text-purple-400 hover:underline">
                                info@inter-verse.ru
                            </a>
                            . Полные условия оказания услуг см. в{' '}
                            <a href="/legal/oferta.html" target="_blank" rel="noopener noreferrer" className="text-inter-verse-green dark:text-purple-400 hover:underline">
                                публичной оферте
                            </a>
                            .
                        </p>
                        <p>
                            <Link to="/" className="text-inter-verse-green dark:text-purple-400 hover:underline">
                                На главную
                            </Link>
                        </p>
                    </div>
                </main>
                <SiteFooter />
            </div>
        </PageTransition>
    )
}
