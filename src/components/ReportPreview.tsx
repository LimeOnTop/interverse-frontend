import { pluralRu } from '../lib/dashboard'
import { freeTrainingCaption } from '../lib/trainingLimits'
import { useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, Check, FileText } from 'lucide-react'
import { preparations } from '../data/preparation'
import { pythonPreparation } from '../data/pythonPreparation'
import '../styles/report-preview.css'

const tabs = ['Результат', 'Разбор ответа', 'Что повторить'] as const
const roles: Record<string, string> = { frontend: 'Frontend', backend: 'Backend', qa: 'QA' }

/** Public, fictional Pro report. No account data or API requests. */
export default function ReportPreview({ slug = 'react', ctaHref = '#start' }: { slug?: string; ctaHref?: string }) {
    const content = [pythonPreparation, ...preparations].find(item => item.slug === slug) || preparations.find(item => item.slug === 'react')!
    const [tab, setTab] = useState(0)
    const id = useId()
    const panel = useRef<HTMLDivElement>(null)
    const buttons = useRef<(HTMLButtonElement | null)[]>([])
    const topics = [...new Set(content.questions.map(question => question.tag))].slice(0, 3)
    const wrongAnswer = content.quiz.options[(content.quiz.correct + 1) % content.quiz.options.length]
    const select = (next: number, keyboard = false) => {
        panel.current?.getAnimations().forEach(animation => animation.cancel())
        setTab(next)
        if (!keyboard && typeof window !== 'undefined' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            panel.current?.animate([{ opacity: 0.35, transform: 'translateY(4px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 180, easing: 'cubic-bezier(.23,1,.32,1)' })
        }
    }
    const cta = <>{'Получить свой первый отчёт'} <ArrowRight size={18} /></>
    return <section id="example-report" className="iv-home-container rd-section" aria-labelledby={`${id}-title`}>
        <div className="rd-copy">
            <span className="rd-eyebrow">ПОСЛЕ ТРЕНИРОВКИ</span>
            <h2 id={`${id}-title`}>Не просто оценка.<br /><em>Понятно, что<br />повторить дальше.</em></h2>
            <p className="rd-intro">Посмотри, как выглядит результат{slug === 'react' && ctaHref === '#start' ? '' : ` по ${content.name}`}: что уже получается, в каких темах есть ошибки и как разобраться в сложной теме.</p>
            <ul className="rd-benefits">
                <li><Check size={17} /><div><strong>Результат без догадок</strong><small>Итоговая оценка и общий отзыв</small></div></li>
                <li><Check size={17} /><div><strong>Ошибка с объяснением</strong><small>Твой ответ, правильный ответ и разбор в Pro</small></div></li>
                <li><Check size={17} /><div><strong>Материалы по слабым темам</strong><small>Ссылки для повторения в Pro</small></div></li>
            </ul>
            {ctaHref.startsWith('#') ? <a className="iv-landing-button" href={ctaHref}>{cta}</a> : <Link className="iv-landing-button" to={ctaHref}>{cta}</Link>}
            <p className="rd-note">{freeTrainingCaption()} бесплатно. Детальный разбор и материалы доступны с подпиской Pro.</p>
        </div>
        <div className="rd-stage">
            <div className="rd-stage-top"><span><i /> ПРИМЕР ОТЧЁТА</span><span className="rd-pro">Pro</span></div>
            <article className="rd-report">
                <header className="rd-head"><div><h3>{roles[content.specialization] === content.name ? content.name : `${roles[content.specialization] || content.specialization} · ${content.name}`}</h3><p>Junior · 10 вопросов · 2 задачи</p></div><span className="rd-doc" aria-hidden="true"><FileText size={19} /></span></header>
                <div className="rd-tabs" role="tablist" aria-label={`Пример отчёта по ${content.name}`}>
                    {tabs.map((label, index) => <button key={label} type="button" role="tab" id={`${id}-tab-${index}`} aria-selected={tab === index} aria-controls={`${id}-panel`} tabIndex={tab === index ? 0 : -1} ref={node => { buttons.current[index] = node }} onClick={event => select(index, event.detail === 0)} onKeyDown={event => {
                        let next: number
                        if (event.key === 'ArrowRight') next = (index + 1) % tabs.length
                        else if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length
                        else if (event.key === 'Home') next = 0
                        else if (event.key === 'End') next = tabs.length - 1
                        else return
                        event.preventDefault(); buttons.current[next]?.focus(); select(next, true)
                    }}>{label}</button>)}
                </div>
                <div className="rd-content" role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab-${tab}`} ref={panel}>
                    {tab === 0 && <>
                        <div className="rd-score"><div className="rd-ring" role="img" aria-label="Итоговая оценка: 68 из 100"><svg viewBox="0 0 104 104" aria-hidden="true"><circle cx="52" cy="52" r="47" /><circle cx="52" cy="52" r="47" /></svg><span>68<small>ИЗ 100</small></span></div><div><h4>Основа есть.<br />Детали стоит закрепить.</h4><p>Ты уверенно отвечаешь на базовые вопросы по {content.name}. Повтори темы, в которых возникли ошибки.</p></div></div>
                        <div className="rd-scores">{[['Теория · 7 из 10', 70], ['Практика · 2 задачи', 65]].map(([label, score]) => <div key={label}><header><span>{label}</span><strong>{score}%</strong></header><div className="rd-bar"><i style={{ width: `${score}%` }} /></div></div>)}</div>
                        <div className="rd-focus"><div><span>Слабые темы</span><span>{topics.length} {pluralRu(topics.length, ['тема', 'темы', 'тем'])}</span></div><ul>{topics.map(topic => <li key={topic}>{topic}</li>)}</ul><p>{content.recommendation}</p></div>
                    </>}
                    {tab === 1 && <>
                        <div className="rd-question-label"><span>ВОПРОС 04 / 10 · {content.name.toUpperCase()}</span><span>Есть ошибка</span></div>
                        <h4 className="rd-question">{content.slug === 'qa' ? 'Какой набор проверок подходит для этого случая?' : 'Что выведет этот код?'}</h4>
                        <pre className="rd-code"><code>{content.quiz.code}</code></pre>
                        <div className="rd-answer"><small>Твой ответ</small>{wrongAnswer}</div>
                        <div className="rd-answer rd-correct"><small>Правильный ответ</small>{content.quiz.options[content.quiz.correct]}</div>
                        <p className="rd-explanation">{content.quiz.explanation}</p>
                        <a className="rd-material" href={content.reference} target="_blank" rel="noopener noreferrer">Материал по {content.name} <ArrowUpRight size={14} /></a>
                    </>}
                    {tab === 2 && <div className="rd-topics">{content.questions.slice(0, 3).map((question, index) => <div key={question.title}><span>0{index + 1}</span><div><h4>{question.tag}</h4><p>{question.title}</p><a className="rd-material" href={content.reference} target="_blank" rel="noopener noreferrer">Открыть документацию <ArrowUpRight size={14} /></a></div></div>)}</div>}
                </div>
                <footer className="rd-footer"><span>Результат одной тренировки</span><span>Детальный отчёт · Pro</span></footer>
            </article>
            <div className="rd-caption"><span>Демонстрационные данные.<br />Твой отчёт зависит от выбранного стека и ответов.</span><span>Попробуй переключить разделы ↑</span></div>
        </div>
    </section>
}
