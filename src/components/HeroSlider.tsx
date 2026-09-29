import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

import workstationBg from '../../images/3d-rendering-computer.webp'
import questionsBg from '../../images/hero-questions.webp'
import progressBg from '../../images/hero-progress.webp'
import reportBg from '../../images/hero-report.webp'

type SlideImageKey = 'workstation' | 'stack' | 'progress' | 'report'

const SLIDE_IMAGE_BACKGROUNDS: Record<SlideImageKey, string> = {
    workstation: workstationBg,
    stack: questionsBg,
    progress: progressBg,
    report: reportBg,
}

interface Slide {
    id: number
    eyebrow: string
    title: string
    highlight: string
    description: string
    illustration: SlideImageKey
}

const SLIDES: Slide[] = [
    {
        id: 0,
        eyebrow: 'Симуляция интервью',
        title: 'Тренируйся как на',
        highlight: 'настоящем собеседовании',
        description: 'Проходи реалистичные сценарии и снимай стресс до встречи с работодателем.',
        illustration: 'workstation',
    },
    {
        id: 1,
        eyebrow: 'Твой стек',
        title: 'Вопросы под',
        highlight: 'твои технологии',
        description: 'React, Go, Python, Kubernetes — задачи формируются под навыки из резюме.',
        illustration: 'stack',
    },
    {
        id: 2,
        eyebrow: 'Уровень сложности',
        title: 'Расти от Intern',
        highlight: 'до Senior',
        description: 'Подбирай глубину тренировки под целевую позицию и закрывай пробелы поэтапно.',
        illustration: 'progress',
    },
    {
        id: 3,
        eyebrow: 'Обратная связь',
        title: 'Отчёт после',
        highlight: 'каждой тренировки',
        description: 'Видишь слабые темы, отслеживаешь прогресс и готовишься точечно.',
        illustration: 'report',
    },
]

const AUTOPLAY_MS = 5500

export default function HeroSlider() {
    const [index, setIndex] = useState(0)
    const [paused, setPaused] = useState(false)

    const goTo = useCallback((i: number) => {
        setIndex((i + SLIDES.length) % SLIDES.length)
    }, [])

    useEffect(() => {
        if (paused) return
        const timer = setInterval(() => {
            setIndex((prev) => (prev + 1) % SLIDES.length)
        }, AUTOPLAY_MS)
        return () => clearInterval(timer)
    }, [paused])

    const slide = SLIDES[index]
    const slideImageBg = SLIDE_IMAGE_BACKGROUNDS[slide.illustration]

    // Preload active + next slide backgrounds so hero swaps stay snappy
    useEffect(() => {
        const urls = [
            SLIDE_IMAGE_BACKGROUNDS[SLIDES[index].illustration],
            SLIDE_IMAGE_BACKGROUNDS[SLIDES[(index + 1) % SLIDES.length].illustration],
        ]
        const links: HTMLLinkElement[] = []
        for (const href of urls) {
            const link = document.createElement('link')
            link.rel = 'preload'
            link.as = 'image'
            link.type = 'image/webp'
            link.href = href
            document.head.appendChild(link)
            links.push(link)
        }
        return () => {
            for (const link of links) {
                link.remove()
            }
        }
    }, [index])

    return (
        <section
            className="relative h-[90vh] overflow-hidden"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            aria-roledescription="carousel"
            aria-label="Преимущества InterVerse"
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={slide.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                    className="absolute inset-0"
                >
                    <div
                        className="absolute inset-0 bg-gray-50 dark:bg-iv-dark-bg lg:left-[38%]"
                        style={{
                            backgroundImage: `url(${slideImageBg})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        }}
                    />
                    <div
                        className="absolute inset-y-0 hidden lg:block pointer-events-none lg:left-[38%] w-24 xl:w-32 bg-gradient-to-r from-gray-50 to-transparent dark:from-iv-dark-bg"
                        aria-hidden
                    />
                </motion.div>
            </AnimatePresence>

            <div className="absolute inset-y-0 left-0 z-10 w-full lg:w-[60%] hero-slider-text-panel">
                <div className="h-full flex flex-col pt-20 pb-16 pl-6 pr-10 sm:pl-8 sm:pr-14 lg:pl-10 lg:pr-24 xl:pl-16 xl:pr-28">
                    <div className="flex-1 flex flex-col justify-center">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={slide.id}
                                initial={{ opacity: 0, x: -24 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 24 }}
                                transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
                                className="w-full max-w-md xl:max-w-lg"
                            >
                                <p className="text-xs font-medium uppercase tracking-widest text-secondary mb-4">
                                    {slide.eyebrow}
                                </p>
                                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 tracking-tight leading-tight mb-4">
                                    {slide.title}{' '}
                                    <span className="gradient-text-adaptive">{slide.highlight}</span>
                                </h1>
                                <p className="text-base lg:text-lg text-secondary leading-relaxed mb-8">
                                    {slide.description}
                                </p>
                                <div>
                                    <Link to="/register" className="hero-cta-btn btn-primary-adaptive">
                                        <span className="hero-cta-btn-content">
                                            Начать тренировку
                                            <ArrowRight className="w-6 h-6" strokeWidth={1.75} />
                                        </span>
                                        <span className="hero-cta-btn-shine" aria-hidden />
                                    </Link>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <div className="flex items-center gap-3 pt-6 lg:justify-start justify-center" role="tablist" aria-label="Слайды">
                        {SLIDES.map((s, i) => (
                            <button
                                key={s.id}
                                type="button"
                                role="tab"
                                aria-selected={i === index}
                                aria-label={`Слайд ${i + 1}`}
                                onClick={() => goTo(i)}
                                className={`hero-slider-dot ${i === index ? 'hero-slider-dot-active' : ''}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
