import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import PageTransition from '../components/ui/PageTransition'
import { PRO_TRACK_PLAN } from '../utils/subscription'

const TRACK_POINTS = [
    { title: 'Маршрут по профессии', text: 'Траектория делит профессию на этапы: от основ к задачам уровня работы.' },
    { title: 'Проверка на каждом этапе', text: 'Этап закрывается тренировкой с отчётом — видно, что уже освоено.' },
    { title: 'Все траектории сразу', text: 'Одна подписка Pro Track открывает все специальности.' },
]

export default function TracksPage() {
    return (
        <PageTransition>
            <header className="library-head">
                <div>
                    <span className="lib-eyebrow">Подготовка / {PRO_TRACK_PLAN.name}</span>
                    <h1>Траектории</h1>
                    <p>Освоение новых профессий шаг за шагом.</p>
                </div>
                <span className="lib-chip is-accent">Скоро</span>
            </header>

            <section className="lib-hero">
                <svg className="lib-hero-route" viewBox="0 0 210 150" fill="none" aria-hidden="true">
                    <path d="M12 130c40 0 38-52 78-52s40-60 108-64" stroke="currentColor" strokeWidth="2" strokeDasharray="5 7" strokeLinecap="round" />
                    <circle cx="12" cy="130" r="7" fill="currentColor" />
                    <circle cx="90" cy="78" r="7" stroke="currentColor" strokeWidth="2" />
                    <circle cx="198" cy="14" r="7" stroke="currentColor" strokeWidth="2" />
                </svg>
                <div>
                    <span className="lib-eyebrow">В разработке</span>
                    <h2>Профессиональные траектории появятся в {PRO_TRACK_PLAN.name}.</h2>
                    <p>
                        Сейчас доступны тренировки и отчёты. {PRO_TRACK_PLAN.proUpgradeNote}
                    </p>
                    <Link to="/interviews/create" className="lib-btn">
                        Перейти к тренировкам <ArrowRight />
                    </Link>
                </div>
            </section>

            <div className="track-points">
                {TRACK_POINTS.map((point, index) => (
                    <section key={point.title} className="track-point">
                        <b>{String(index + 1).padStart(2, '0')}</b>
                        <h3>{point.title}</h3>
                        <p>{point.text}</p>
                    </section>
                ))}
            </div>

            <p className="lib-note">Дату запуска траекторий сообщим отдельно. Действующие преимущества Pro от этого раздела не зависят.</p>
        </PageTransition>
    )
}
