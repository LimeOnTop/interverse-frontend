import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import PublicNav from '../components/PublicNav'
import SiteFooter from '../components/SiteFooter'
import { preparations, jobTracks } from '../data/preparation'
import { pythonPreparation } from '../data/pythonPreparation'
import '../styles/home.css'
import '../styles/preparation.css'

export default function PublicCatalogPage({ jobs = false }: { jobs?: boolean }) {
    const items = jobs ? jobTracks : [pythonPreparation, ...preparations]
    return <div className="iv-home iv-preparation">
        <PublicNav landing />
        <main className="iv-home-container public-catalog">
            <nav className="prep-breadcrumb" aria-label="Хлебные крошки"><Link to="/">Главная</Link><span aria-hidden="true">/</span><span aria-current="page">{jobs ? 'IT-вакансии' : 'Подготовка к собеседованию'}</span></nav>
            <span className="iv-eyebrow">{jobs ? 'ПОИСК РАБОТЫ ПО СВОЕМУ СТЕКУ' : 'ТРЕНАЖЁР ТЕХНИЧЕСКИХ ИНТЕРВЬЮ'}</span>
            <h1>{jobs ? 'Работа в IT: вакансии разработчиков' : 'Подготовка к собеседованию в IT'}</h1>
            <p>{jobs
                ? 'Найди IT-вакансии по своему направлению: Python, Java, React или Frontend. В подборке можно выбрать удалённую работу и позиции Junior, сравнить требования и перейти к отклику у источника.'
                : 'Выбери направление технического интервью. Вопросы с ответами, практические задачи и план повторения открыты без регистрации. Для персональной тренировки выбери стек и уровень.'}</p>
            <div className="public-catalog-grid">{items.map(item => <Link to={(jobs ? '/jobs/' : '/preparation/') + item.slug} key={item.slug}>
                <span>{jobs ? 'ВАКАНСИИ И ТРЕБОВАНИЯ' : 'ВОПРОСЫ И ПРАКТИКА'}</span>
                <h2>{jobs ? 'Вакансии ' + item.name : item.slug === 'qa' ? 'Собеседование тестировщика QA' : 'Собеседование ' + item.name}<ArrowUpRight size={22} /></h2>
                <p>{item.lead}</p>
            </Link>)}</div>
            {jobs ? <section className="prep-section catalog-next-step" aria-labelledby="job-search-next">
                <h2 id="job-search-next">От поиска работы к собеседованию</h2>
                <p className="prep-section-intro">Открой подборку по технологии, выбери формат и опыт. Перед откликом проверь обязанности, зарплату и актуальность объявления на сайте источника.</p>
                <div className="prep-related"><Link to="/jobs/frontend?format=remote">Удалённая работа Frontend</Link><Link to="/jobs/python?experience=junior">Вакансии Python для Junior</Link><Link to="/jobs/java?experience=junior">Вакансии Java для Junior</Link></div>
                <p className="prep-section-intro">Ищешь первую работу в IT? Фильтр Junior / без опыта помогает сузить подборку, но требования отличаются у каждого работодателя. Доступность таких вакансий зависит от источников.</p>
                <Link to="/preparation" className="iv-landing-text-button">Подготовиться к техническому собеседованию<ArrowUpRight size={17} /></Link>
            </section> : <section className="prep-section catalog-next-step" aria-labelledby="interview-next">
                <h2 id="interview-next">Проверь знания перед техническим интервью</h2>
                <p className="prep-section-intro">Ответь на вопросы своими словами, реши задачу и сверь решение с разбором. Затем настрой тренировку под Intern, Junior, Middle или Senior. Итоговая оценка помогает выбрать темы для повторения.</p>
                <div className="prep-related"><Link to="/#start">Настроить онлайн-тренировку</Link><Link to="/jobs">Найти работу в IT по своему стеку</Link><Link to="/pricing">Сравнить бесплатный тариф и Pro</Link></div>
            </section>}
        </main>
        <SiteFooter />
    </div>
}
