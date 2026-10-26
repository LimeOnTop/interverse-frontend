import SystemDesignHomeSection from '../components/SystemDesignHomeSection'
import { freeTrainingCaption } from '../lib/trainingLimits'
import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, Play, Check, Code2, BarChart3, Briefcase, Activity, ChevronDown } from 'lucide-react'
import PublicNav from '../components/PublicNav'
import ReportPreview from '../components/ReportPreview'
import SiteFooter from '../components/SiteFooter'
import LandingVideo, { VIDEO_CHAPTERS } from '../components/LandingVideo'
import { SPECIALIZATIONS, TECH_STACKS, LEVELS } from '../components/InterviewWizard/options'
import { saveTrainingIntent } from '../lib/trainingIntent'
import { formatUserFacingError } from '../lib/interviewSession'
import { useAuthStore } from '../store/authStore'
import { useLandingMotion } from '../hooks/useLandingMotion'
import '../styles/home.css'
import '../styles/preparation.css'

const capabilities = [
    { icon: Code2, number: '01', title: 'Практика под тебя', text: 'Вопросы и задачи под твою роль, технологии и уровень.', tag: 'Онлайн-тренировки', time: 6 },
    { icon: BarChart3, number: '02', title: 'Разбор после тренировки', text: 'Разбирай ошибки, замечай слабые места и выбирай, что повторить дальше.', tag: 'Отчёты и прогресс', time: 12 },
    { icon: Briefcase, number: '03', title: 'Вакансии под твой стек', text: 'Находи вакансии, используй фильтры и сохраняй интересные предложения.', tag: 'Вакансии', time: 19 },
    { icon: Activity, number: '04', title: 'Подготовка в своём ритме', text: 'Следи за активностью и возвращайся к практике в удобном темпе.', tag: 'Ритм подготовки', time: 25 },
]

export default function HomePage() {
    const root = useRef<HTMLDivElement>(null)
    const [film, setFilm] = useState<number | null>(null)
    const [role, setRole] = useState('frontend')
    const [stack, setStack] = useState('React')
    const [level, setLevel] = useState('middle')
    const [submitting, setSubmitting] = useState(false)
    const [startError, setStartError] = useState('')
    const navigate = useNavigate()
    const isAuthenticated = useAuthStore(s => s.isAuthenticated)
    useLandingMotion(root)
    const start = async (event: React.FormEvent) => {
        event.preventDefault()
        if (submitting) return
        setSubmitting(true); setStartError('')
        try {
            await saveTrainingIntent(role, stack, level)
            navigate(isAuthenticated ? '/training/resume' : '/register')
        } catch (error) {
            setStartError(formatUserFacingError(error, 'Не удалось сохранить параметры. Попробуй ещё раз.'))
        } finally { setSubmitting(false) }
    }
    return <div ref={root} className="iv-home">
        <PublicNav landing />
        <main>
            <section className="iv-home-hero iv-home-container">
                <div className="iv-hero-copy">
                    <div className="iv-hero-label"><span /> ТВОЙ СЛЕДУЮЩИЙ КАРЬЕРНЫЙ ШАГ</div>
                    <h1>На IT-интервью —<br />с <em>уверенностью.</em></h1>
                    <p className="iv-hero-description">Тренажёр собеседований в IT.<br />Тренируйся под свой стек, разбирай ошибки<br className="iv-desktop-break" /> и готовься к вопросам на собеседовании.</p>
                    <div className="iv-hero-actions"><a className="iv-landing-button" href="#start">Настроить тренировку <ArrowUpRight size={19} /></a><button className="iv-landing-text-button" onClick={() => setFilm(0)}><Play size={16} /> Смотреть обзор <span>36 сек</span></button></div>
                    <div className="iv-hero-note"><Check size={15} /> В своём темпе <span /> Под свой уровень <span /> Без давления</div>
                </div>
                <div className="iv-hero-visual" data-reveal>
                    <div className="iv-video-topline"><span>ЗНАКОМСТВО С INTERVERSE</span><span>01 — 04</span></div>
                    <button className="iv-video-cover" data-tilt onClick={() => setFilm(0)} aria-label="Смотреть видео о платформе, 36 секунд">
                        <div className="iv-cover-grid" />
                        <div className="iv-cover-top"><span>INTER<span className="iv-cover-v">V</span>ERSE</span><span className="iv-cover-live">Практика → прогресс</span></div>
                        <div className="iv-cover-title">ТВОЙ СТЕК.<br />ТВОЙ РИТМ.<br /><span>ТВОЙ РОСТ.</span></div>
                        <div className="iv-cover-bars" aria-hidden="true">{[28,43,36,65,52,82,70,95,86,110,94,124,116,140,130,152].map((height, i) => <i key={i} style={{ height }} />)}</div>
                        <span className="iv-cover-play"><Play fill="currentColor" size={25} /></span>
                        <div className="iv-cover-bottom"><span>{freeTrainingCaption().toUpperCase()} БЕСПЛАТНО<br />ДО СЛЕДУЮЩЕГО ИНТЕРВЬЮ</span><span>00:36 <ArrowUpRight size={17} /></span></div>
                    </button>
                    <div className="iv-video-caption"><span>Обзор платформы за 36 секунд.</span><button onClick={() => setFilm(0)}>Включить звук и смотреть <ArrowRight size={15} /></button></div>
                </div>
            </section>
            <div className="iv-stack-strip iv-home-container"><span>ГОТОВЬСЯ К СВОЕЙ РОЛИ</span><div>{['Frontend', 'Backend', 'DevOps', 'QA', 'Data Science'].map(name => <span key={name}>{name}</span>)}</div><a href="#start" aria-label="Выбрать направление"><ArrowDownIcon /></a></div>
            <section className="iv-home-container prep-home-links" aria-label="Подготовка по направлениям"><span className="iv-eyebrow">ПОДГОТОВКА К СОБЕСЕДОВАНИЮ ОНЛАЙН</span><h2>Выбери направление.<br />Начни с понятного вопроса.</h2><div>{['Python','Java','React','Frontend','QA'].map(name => <Link key={name} to={'/preparation/'+name.toLowerCase()}>{name}<ArrowUpRight size={17}/></Link>)}</div><p>Вопросы с ответами, задачи и план повторения без регистрации. <Link to="/jobs">Смотри вакансии по своему стеку</Link> и тренируйся под требования.</p></section>
            <section className="iv-home-container iv-home-section" id="possibilities">
                <div className="iv-section-heading" data-reveal><div><span className="iv-eyebrow">НЕ ПРОСТО СПИСОК ВОПРОСОВ</span><h2>Всё, чтобы двигаться<br />вперёд.</h2></div><p>Практика, результаты и темы для повторения.<br />Подготовка, в которой понятен следующий шаг.</p></div>
                <div className="iv-capabilities">{capabilities.map(({ icon: Icon, ...item }) => <article key={item.number} className="iv-capability" data-reveal data-tilt><div className="iv-capability-top"><Icon size={24} strokeWidth={1.4} /><span>{item.number}</span></div><h3>{item.title}</h3><p>{item.text}</p><div className="iv-capability-bottom"><span>{item.tag}</span></div></article>)}</div>
            </section>
            <SystemDesignHomeSection />
            <ReportPreview />
            <section className="iv-home-container iv-home-section" id="start">
                <div className="iv-start-layout"><div className="iv-start-copy"><span className="iv-eyebrow">НАЧНИ СО СВОЕГО</span><h2>{freeTrainingCaption()} бесплатно.<br /><em>Понятный план роста.</em></h2><p>Не нужно готовиться ко всему сразу.<br />Выбери направление, технологию и уровень —<br />собери тренировку под свою цель.</p><ol><li><span>01</span><div>Выбери фокус<small>То, что действительно пригодится на интервью</small></div></li><li><span>02</span><div>Попробуй свои силы<small>Теория и практика в удобном темпе</small></div></li><li><span>03</span><div>Посмотри, где расти<small>Понятный разбор вместо догадок</small></div></li></ol></div>
                    <form className="iv-start-form" data-reveal data-tilt onSubmit={start}><div className="iv-form-heading"><span>ТВОЯ ТРЕНИРОВКА</span><Code2 size={21} /></div><h3>С чего начнём?</h3><label htmlFor="home-role">Направление</label><div className="iv-select-wrap"><select id="home-role" value={role} onChange={e => { setRole(e.target.value); setStack(TECH_STACKS[e.target.value][0]) }}>{SPECIALIZATIONS.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select><ChevronDown size={17} /></div><label htmlFor="home-stack">Технология</label><div className="iv-select-wrap"><select id="home-stack" value={stack} onChange={e => setStack(e.target.value)}>{TECH_STACKS[role].map(name => <option key={name}>{name}</option>)}</select><ChevronDown size={17} /></div><fieldset><legend>Целевой уровень</legend><div className="iv-levels">{LEVELS.slice(0, 4).map(item => <button key={item.id} type="button" aria-pressed={level === item.id} className={level === item.id ? 'selected' : ''} onClick={() => setLevel(item.id)}>{item.name}</button>)}</div></fieldset><div className="iv-form-summary" aria-live="polite"><span className="iv-summary-dot" /><span>{SPECIALIZATIONS.find(item => item.id === role)?.name} · {stack} · {LEVELS.find(item => item.id === level)?.name}</span></div><button className="iv-landing-button" type="submit" disabled={submitting} aria-busy={submitting}>{submitting ? 'Сохраняем параметры…' : isAuthenticated ? 'Перейти к тренировке' : 'Создать аккаунт и начать'} <ArrowRight size={18} /></button>{startError && <p role="alert">{startError}</p>}<p className="iv-form-note">{freeTrainingCaption()} бесплатно. После регистрации и подтверждения почты откроем тренировку с этими параметрами</p></form>
                </div>
            </section>
            <section className="iv-home-container iv-home-section iv-faq-section"><div><span className="iv-eyebrow">ЧАСТЫЕ ВОПРОСЫ</span><h2>Перед первым<br />шагом.</h2></div><div className="iv-faq">{[{ q: 'Для кого подходит InterVerse?', a: 'Для тех, кто готовится к техническим интервью: от Intern до Lead. Можно выбрать направление, уровень и технологии под свою цель.' }, { q: 'Что я получу после тренировки?', a: 'Итоговую оценку и общий отзыв. В Pro также доступны подробный разбор ответов, материалы по темам с ошибками и все 25 тренировок по System Design.' }, { q: 'Нужен ли строгий график?', a: 'Нет. Проходи тренировки в удобном темпе, планируй подготовку и следи за своей активностью.' }, { q: 'Сколько тренировок бесплатно?', a: `${freeTrainingCaption()} на аккаунт без срока действия. Для расширенного лимита, детального разбора и всех тренировок по System Design доступна подписка Pro.` }, { q: 'Где посмотреть тарифы?', a: <>Актуальные условия и доступность функций — на <Link to="/pricing">странице тарифов</Link>.</> }].map(item => <details key={item.q}><summary>{item.q}<ChevronDown size={18} /></summary><p>{item.a}</p></details>)}</div></section>
            <section className="iv-home-container iv-final-cta"><span className="iv-eyebrow">СЛЕДУЮЩИЙ ШАГ — ТВОЙ</span><h2>Уверенность начинается<br />с практики.</h2><a href="#start" className="iv-landing-button">Начать подготовку <ArrowUpRight size={19} /></a><button className="iv-landing-text-button" onClick={() => setFilm(VIDEO_CHAPTERS[0].time)}>Сначала посмотреть видео <Play size={15} /></button></section>
        </main>
        <SiteFooter />
        {film !== null && <LandingVideo startAt={film} onClose={() => setFilm(null)} />}
    </div>
}
function ArrowDownIcon() { return <ArrowRight size={20} style={{ transform: 'rotate(90deg)' }} /> }
