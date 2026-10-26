import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, Check, ChevronDown } from 'lucide-react'
import PublicNav from '../components/PublicNav'
import SiteFooter from '../components/SiteFooter'
import SystemDesignPreview from '../components/SystemDesignPreview'
import { useLandingMotion } from '../hooks/useLandingMotion'
import { useAuthStore } from '../store/authStore'
import { rememberSystemDesignReturn } from '../lib/trainingIntent'
import { reachGoal } from '../lib/analytics'
import '../styles/home.css'
import '../styles/preparation.css'
import '../styles/system-design-landing.css'

export const systemDesignFaq = [
    ['Что такое тренировка по System Design?', 'Ты получаешь задачу с проблемой в архитектуре, добавляешь блоки, соединяешь их и проверяешь решение. Проверка показывает, какие условия выполнены и что ещё нужно исправить.'],
    ['Нужно ли уметь программировать?', 'Код писать не нужно. Пригодится базовое понимание API, базы данных и запросов. Начни с первого уровня и используй подсказку, если застрянешь.'],
    ['Что доступно бесплатно?', 'Первый уровень «Сервис не выдержал запуск» доступен на Basic. Все 25 уровней открываются в Pro. Актуальные условия есть на странице тарифов.'],
    ['Можно ли заниматься с телефона?', 'Да. На доске есть полноэкранный режим, добавление блоков и выбор связей. Для больших схем удобнее планшет или компьютер.'],
    ['Сохранится ли решение?', 'Да. После входа в аккаунт схемы и пройденные уровни будут доступны с другого устройства.'],
]

export default function PreparationSystemDesignPage() {
    const root = useRef<HTMLDivElement>(null)
    const authenticated = useAuthStore(s => s.isAuthenticated)
    useLandingMotion(root)
    const start = () => { if (!authenticated) rememberSystemDesignReturn(); reachGoal('system_design_landing_start') }
    return <div className="iv-home iv-preparation sd-landing" ref={root}>
        <PublicNav landing />
        <main>
            <nav className="iv-home-container prep-breadcrumb" aria-label="Хлебные крошки"><Link to="/">Главная</Link><span>/</span><Link to="/preparation">Подготовка</Link><span>/</span><span aria-current="page">System Design</span></nav>
            <section className="iv-home-container sd-landing-hero">
                <div><div className="iv-hero-label"><span /> SYSTEM DESIGN · ПРАКТИКА АРХИТЕКТУРЫ</div><h1>System Design.<br />Собери решение.<br /><em>Проверь себя.</em></h1><p className="iv-hero-description">Сервис не выдержал нагрузку? Собери архитектуру на доске, найди узкое место и проверь своё решение перед собеседованием.</p><div className="iv-hero-actions"><Link onClick={start} to={authenticated ? '/system-design/traffic' : '/register'} className="iv-landing-button">Попробовать бесплатно <ArrowUpRight size={18} /></Link><a href="#tasks" className="iv-landing-text-button">Посмотреть задачи <ArrowRight size={16} /></a></div><p className="sd-offer-note"><Check size={15} /> Первый уровень бесплатно · Все 25 в Pro</p></div>
                <div data-reveal><SystemDesignPreview /></div>
            </section>
            <section className="iv-home-container sd-topics" aria-label="Темы System Design">{[['01', 'Нагрузка', 'Балансировка и масштабирование'], ['02', 'Кеширование', 'Быстрые чтения и актуальность данных'], ['03', 'Очереди', 'Доставка событий и обработка повторов'], ['04', 'Надёжность', 'Репликация, кворум и отказоустойчивость']].map(([n, title, text]) => <div key={n}><small>{n}</small><h2>{title}</h2><p>{text}</p></div>)}</section>
            <section className="iv-home-container iv-home-section" id="tasks"><div className="iv-section-heading"><div><span className="iv-eyebrow">25 ЗАДАЧ ПО SYSTEM DESIGN</span><h2>Одна проблема.<br />Твоё решение.</h2></div><p>От первого перегруженного API до распределённых систем.<br />Не только назови компонент, но и найди ему место.</p></div><div className="sd-task-samples">{[['01', 'Сервис не выдержал запуск', 'Распредели трафик между серверами и сохрани путь до базы данных.', 'Бесплатно'], ['02', 'Каталог тормозит', 'Сними нагрузку с базы данных и ускорь повторные чтения.', 'Pro'], ['03', 'Письма блокируют API', 'Отдели долгую обработку от ответа пользователю.', 'Pro']].map(([n, title, text, badge]) => <Link key={n} to={authenticated ? n === '01' ? '/system-design/traffic' : '/system-design' : '/register'} onClick={start}><div><span>{n}</span><span className={badge === 'Pro' ? 'sd-pro-badge' : 'sd-free-badge'}>{badge}</span></div><h3>{title}</h3><p>{text}</p><span className="sd-task-link">{n === '01' ? 'Начать с первого уровня' : 'Посмотреть уровни'} <ArrowRight size={16} /></span></Link>)}</div></section>
            <section className="iv-home-container iv-home-section sd-how"><span className="iv-eyebrow">ОТ ЗАДАНИЯ К РЕШЕНИЮ</span><h2>Думай. Собирай. Проверяй.</h2><ol>{[['Прочитай условия', 'Найди причину проблемы и ограничения системы.'], ['Собери архитектуру', 'Добавь компоненты, измени связи и проверь путь запроса.'], ['Проверь решение', 'Посмотри результат, исправь ошибки и переходи к следующей задаче.']].map(([title, body], i) => <li key={title}><span>0{i + 1}</span><div><h3>{title}</h3><p>{body}</p></div></li>)}</ol></section>
            <section className="iv-home-container iv-home-section iv-faq-section"><div><span className="iv-eyebrow">ПЕРЕД ПЕРВОЙ СХЕМОЙ</span><h2>Частые вопросы</h2></div><div className="iv-faq">{systemDesignFaq.map(([q, a]) => <details key={q}><summary>{q}<ChevronDown size={18} /></summary><p>{a}</p></details>)}<Link to="/pricing" className="iv-landing-text-button">Сравнить Basic и Pro <ArrowRight size={16} /></Link></div></section>
            <section className="iv-home-container iv-final-cta"><span className="iv-eyebrow">ПЕРВЫЙ УРОВЕНЬ БЕСПЛАТНО</span><h2>Как бы ты справился<br />с 1 600 запросами в секунду?</h2><Link onClick={start} to={authenticated ? '/system-design/traffic' : '/register'} className="iv-landing-button">Открыть первую задачу <ArrowUpRight size={18} /></Link></section>
        </main><SiteFooter />
    </div>
}
