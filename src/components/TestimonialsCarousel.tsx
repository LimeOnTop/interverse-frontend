import { Quote } from 'lucide-react'
import Card from './ui/Card'

export interface Testimonial {
    id: number
    name: string
    role: string
    text: string
}

const TESTIMONIALS: Testimonial[] = [
    {
        id: 1,
        name: 'Алексей Морозов',
        role: 'Middle Frontend-разработчик',
        text: 'За две недели тренировок прошёл три симуляции по React и TypeScript. На реальном собеседовании вопросы показались знакомыми — оффер получил с первого раза.',
    },
    {
        id: 2,
        name: 'Мария Ковалёва',
        role: 'Junior Backend (Go)',
        text: 'Отчёт после каждой тренировки чётко показал слабые места в concurrency и SQL. Дотянула эти темы и спокойно прошла технический этап.',
    },
    {
        id: 3,
        name: 'Дмитрий Волков',
        role: 'Senior DevOps',
        text: 'Уровень Senior реально ощущается — system design, Kubernetes, сценарии на отказоустойчивость. Лучшая подготовка перед сменой работы за последние годы.',
    },
    {
        id: 4,
        name: 'Елена Сидорова',
        role: 'Middle QA Engineer',
        text: 'Тренировалась отвечать на вопросы по тест-дизайну и API. Перестала теряться на live-интервью — теперь структурирую ответы с первых секунд.',
    },
    {
        id: 5,
        name: 'Игорь Петров',
        role: 'Junior Fullstack',
        text: 'Начинал с уровня Intern, постепенно поднял сложность до Junior+. Видно прогресс в отчётах — мотивирует не бросать подготовку.',
    },
    {
        id: 6,
        name: 'Анна Новикова',
        role: 'Middle Data Engineer',
        text: 'Вопросы по Spark, SQL и пайплайнам совпали с тем, что спрашивали в компании мечты. Симуляция сняла панику перед созвоном с тимлидом.',
    },
]

export default function TestimonialsCarousel() {
    const items = [...TESTIMONIALS, ...TESTIMONIALS]

    return (
        <div
            className="testimonials-carousel relative"
            aria-label="Отзывы пользователей"
            aria-roledescription="carousel"
        >
            <div className="testimonials-carousel-fade testimonials-carousel-fade-left" aria-hidden />
            <div className="testimonials-carousel-fade testimonials-carousel-fade-right" aria-hidden />

            <div className="testimonials-carousel-track">
                {items.map((item, index) => (
                    <Card
                        key={`${item.id}-${index}`}
                        padding="lg"
                        className="testimonials-carousel-card shrink-0"
                    >
                        <Quote
                            className="w-8 h-8 text-inter-verse-green/30 dark:text-purple-400/40 mb-4"
                            strokeWidth={1.5}
                            aria-hidden
                        />
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                            «{item.text}»
                        </p>
                        <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                            <p className="font-semibold text-gray-900 dark:text-gray-100">{item.name}</p>
                            <p className="text-xs text-secondary mt-1">{item.role}</p>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    )
}
