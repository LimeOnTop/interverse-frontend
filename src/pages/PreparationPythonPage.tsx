import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, Check, ChevronDown, Code2, BookOpen, Target } from 'lucide-react'
import PublicNav from '../components/PublicNav'
import ReportPreview from '../components/ReportPreview'
import SiteFooter from '../components/SiteFooter'
import { useLandingMotion } from '../hooks/useLandingMotion'
import { useAuthStore } from '../store/authStore'
import { saveTrainingIntent } from '../lib/trainingIntent'
import { formatUserFacingError } from '../lib/interviewSession'
import '../styles/home.css'
import '../styles/preparation.css'
import { preparations, jobTracks } from '../data/preparation'
import { pythonPreparation } from '../data/pythonPreparation'

export default function PreparationPage({ slug = 'python' }: { slug?: string }) {
    const content = [pythonPreparation, ...preparations].find(item => item.slug === slug)!
    const questions = content.questions
    const quizOptions = content.quiz.options
    const root = useRef<HTMLDivElement>(null)
    useLandingMotion(root)
    const [answer, setAnswer] = useState<number | null>(null)
    const [level, setLevel] = useState('junior')
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')
    const [done, setDone] = useState<number[]>([])
    const authenticated = useAuthStore(s => s.isAuthenticated)
    const navigate = useNavigate()
    const start = async (event: React.FormEvent) => {
        event.preventDefault()
        if (busy) return
        setBusy(true); setError('')
        try {
            await saveTrainingIntent(content.specialization, content.technology, level)
            navigate(authenticated ? '/training/resume' : '/register')
        } catch (e) { setError(formatUserFacingError(e, 'Не удалось сохранить тренировку. Попробуй ещё раз.')) }
        finally { setBusy(false) }
    }
    return <div className="iv-home iv-preparation" ref={root}>
        <PublicNav landing />
        <main>
            <div className="iv-home-container prep-breadcrumb"><Link to="/">Главная</Link><span aria-hidden="true">/</span><span>Подготовка к собеседованию {content.name}</span></div>
            <section className="iv-home-container prep-hero">
                <div>
                    <div className="iv-hero-label"><span /> {content.name.toUpperCase()} · {content.specialization.toUpperCase()} · ПРАКТИКА</div>
                    <h1>Собеседование<br />{content.slug === 'qa' ? 'тестировщика QA' : 'по ' + content.name}.<br /><em>Начни с практики.</em></h1>
                    <p className="prep-lead">{content.lead}</p>
                    <div className="iv-hero-actions"><a href="#training" className="iv-landing-button">Настроить тренировку <ArrowUpRight size={18} /></a><a href="#questions" className="iv-landing-text-button">Посмотреть вопросы <ArrowRight size={16} /></a></div>
                    <p className="prep-open-note"><Check size={15} /> Примеры открыты без регистрации</p>
                </div>
                <div className="prep-quiz" data-reveal>
                    <div className="prep-panel-label"><span>ПОПРОБУЙ ПРЯМО СЕЙЧАС</span><Code2 size={20} /></div>
                    <h2>{content.slug === 'qa' ? 'Какие проверки выбрать?' : 'Что выведет код?'}</h2>
                    <pre><code>{content.quiz.code}</code></pre>
                    <fieldset><legend>Выбери ответ</legend>{quizOptions.map((option, i) => <button type="button" key={option} aria-pressed={answer === i} className={`prep-quiz-option ${answer === i ? 'selected' : ''}`} onClick={() => setAnswer(i)}><span>{String.fromCharCode(65 + i)}</span>{option}{answer === i && <Check size={16} />}</button>)}</fieldset>
                    <div className="prep-quiz-feedback" aria-live="polite">{answer === null ? 'Выбери вариант, чтобы проверить ответ и прочитать объяснение.' : <><strong>{answer === content.quiz.correct ? 'Верно.' : 'Правильный ответ: ' + content.quiz.options[content.quiz.correct]}</strong><p>{content.quiz.explanation}</p></>}</div>
                </div>
            </section>
            <nav className="iv-home-container prep-section-nav" aria-label="Разделы подготовки"><a href="#questions"><BookOpen size={16} /> Вопросы и ответы</a><a href="#task"><Code2 size={16} /> Практическая задача</a><a href="#plan"><Target size={16} /> План подготовки</a></nav>
            <div className="iv-home-container prep-content">
                <div className="prep-reading">
                    <section id="questions" className="prep-section">
                        <span className="iv-eyebrow">01 / ПРОВЕРЬ ОСНОВЫ</span><h2>Вопросы на собеседовании {content.slug === 'qa' ? 'тестировщика QA' : content.name}</h2>
                        <p className="prep-section-intro">Начни с ответа своими словами. Затем открой разбор и проверь, можешь ли объяснить не только правило, но и пример его применения.</p>
                        <div className="prep-questions">{questions.map((q, i) => <details key={q.title}><summary><span className="prep-q-number">0{i + 1}</span><span><small>{q.tag}</small>{q.title}</span><ChevronDown size={19} /></summary><div className="prep-answer"><p>{q.answer}</p><div><strong>Уточнение на интервью</strong><p>{q.follow}</p></div></div></details>)}</div>
                    </section>
                    <section id="task" className="prep-section" data-reveal>
                        <span className="iv-eyebrow">02 / ОТ ОБЪЯСНЕНИЯ К РЕШЕНИЮ</span><h2>{content.task.title}</h2>
                        <p className="prep-section-intro">{content.task.description}</p>
                        <div className="prep-task"><div className="prep-panel-label"><span>ПРАКТИЧЕСКАЯ ЗАДАЧА</span><span>{content.name.toUpperCase()}</span></div><pre><code>{content.task.example}</code></pre><p>Проверь основной сценарий и крайние случаи. Объясни ход решения и ограничения выбранного подхода.</p><details><summary>Посмотреть решение и разбор <ChevronDown size={17} /></summary><pre><code>{content.task.solution}</code></pre><p>{content.task.explanation}</p></details></div>
                    </section>
                    <section id="plan" className="prep-section" data-reveal>
                        <span className="iv-eyebrow">03 / СЛЕДУЮЩИЙ ШАГ ПОНЯТЕН</span><h2>Собери план подготовки</h2><p className="prep-section-intro">Отметь пройденные темы. Это пример маршрута: глубину и темп выбирай под свою вакансию и уровень.</p>
                        <div className="prep-checklist">{content.plan.map((text, i) => <label key={text}><input type="checkbox" checked={done.includes(i)} onChange={() => setDone(items => items.includes(i) ? items.filter(item => item !== i) : [...items, i])} /><span>{text}</span></label>)}</div><p className="prep-check-progress" aria-live="polite">Повторено {done.length} из 5 блоков</p>
                    </section>
                    <section className="prep-section prep-result" data-reveal><span className="iv-eyebrow">ОТ ПРАКТИКИ К ПЛАНУ</span><h2>Что будет после тренировки?</h2><p>После тренировки появятся итоговая оценка и общий отзыв. В Pro — подробный разбор ответов, материалы для повторения и все тренировки по System Design.</p><div className="prep-report-example"><span>ПРИМЕР РЕКОМЕНДАЦИИ</span><strong>Следующий шаг в подготовке</strong><p>{content.recommendation}</p></div></section>
                    <section className="prep-section prep-faq"><span className="iv-eyebrow">ПЕРЕД ТРЕНИРОВКОЙ</span><h2>Частые вопросы</h2><details><summary>Подойдёт ли подготовка для Junior?<ChevronDown size={18} /></summary><p>Да. Выбери Junior и начни с основ направления. Глубину вопросов и список тем сверяй с требованиями вакансии.</p></details><details><summary>Это курс с нуля?<ChevronDown size={18} /></summary><p>Это подготовка к техническому интервью и практика уже изученных навыков. Для старта пригодятся базовые знания выбранного направления.</p></details><details><summary>Что доступно без аккаунта?<ChevronDown size={18} /></summary><p>Все вопросы, разборы, задача и план на этой странице. Для персональной тренировки и сохранения результатов понадобится аккаунт. Условия — на <Link to="/pricing">странице тарифов</Link>.</p></details></section>
                <div className="prep-related"><h2>Продолжи подготовку</h2><Link to="/preparation">Все направления</Link>{jobTracks.filter(item => item.prep === content.slug).map(item => <Link key={item.slug} to={'/jobs/' + item.slug}>Вакансии {item.name}</Link>)}<a href={content.reference} target="_blank" rel="noopener noreferrer">Официальная документация</a></div></div>
                <aside className="prep-training" id="training">
                    <form className="iv-start-form" onSubmit={start}>
                        <div className="iv-form-heading"><span>ТВОЯ ТРЕНИРОВКА</span><ArrowUpRight size={20} /></div><h2>Проверь себя<br />в своём темпе.</h2><p className="prep-training-copy">Вопросы и задачи по {content.technology} под выбранный уровень.</p>
                        <div className="prep-fixed-stack"><Code2 size={17} /><span>{content.specialization === 'backend' ? 'Backend' : content.specialization === 'qa' ? 'QA' : 'Frontend'} <span aria-hidden="true">/</span> {content.technology}</span></div>
                        <fieldset><legend>Твой уровень</legend><div className="iv-levels">{['intern', 'junior', 'middle', 'senior'].map(item => <button type="button" key={item} aria-pressed={level === item} className={level === item ? 'selected' : ''} onClick={() => setLevel(item)}>{item[0].toUpperCase() + item.slice(1)}</button>)}</div></fieldset>
                        <div className="iv-form-summary">{content.technology} · {level[0].toUpperCase() + level.slice(1)}</div><button className="iv-landing-button" type="submit" disabled={busy} aria-busy={busy}>{busy ? 'Сохраняем параметры…' : 'Начать тренировку'}<ArrowRight size={17} /></button>{error && <p role="alert" className="prep-form-error">{error}</p>}<p className="iv-form-note">{authenticated ? 'Откроем тренировку с выбранным уровнем' : 'После регистрации и подтверждения почты откроем тренировку'}</p><Link className="prep-pricing" to="/pricing">Посмотреть тарифы</Link>
                    </form>
                    <p className="prep-aside-note">Объясняй ход мысли, проверяй крайние случаи и возвращайся к темам, в которых сомневаешься.</p>
                </aside>
            </div>
            <ReportPreview slug={slug} ctaHref="#training" />
            <section className="iv-home-container prep-bottom"><p>Другая технология или направление?</p><Link to="/#start" className="iv-landing-text-button">Настроить подготовку под свой стек <ArrowRight size={17} /></Link></section>
        </main>
        <SiteFooter />
    </div>
}
