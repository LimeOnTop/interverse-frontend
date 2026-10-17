import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { preparations, jobTracks } from '../data/preparation'
import { pythonPreparation } from '../data/pythonPreparation'

const SITE = 'https://inter-verse.ru'
const DEFAULT_TITLE = 'Подготовка к IT-собеседованию онлайн — тренировки | InterVerse'
const DEFAULT_DESCRIPTION =
    'InterVerse — онлайн-тренировки к техническим собеседованиям: Frontend, Backend, DevOps, QA и Data Science. Вопросы и задачи под твой стек и уровень от Intern до Senior.'

type SeoConfig = {
    title: string
    description: string
    path: string
    noindex?: boolean
}

const ROUTES: Record<string, SeoConfig> = {
    '/pro-trial': {title:'Пробный Pro за 1 ₽ на 3 дня — условия | InterVerse',description:'Условия пробного доступа Pro: 1 ₽ за 72 часа, затем 390 ₽ в месяц. Управление автопродлением в профиле.',path:'/pro-trial'},
    '/preparation': {title:'Подготовка к IT-собеседованию — вопросы и онлайн-тренировки | InterVerse',description:'Подготовка Python, Java, React, Frontend и QA: вопросы с ответами, задачи и онлайн-тренировки по уровню.',path:'/preparation'},
    '/jobs': {title:'Вакансии IT: Python, Java, React и Frontend | InterVerse',description:'Публичные подборки вакансий разработчиков. Сравни требования и подготовься к собеседованию по своему стеку.',path:'/jobs'},
    ...Object.fromEntries([pythonPreparation,...preparations].map(item => ['/preparation/'+item.slug,{title:`Подготовка к собеседованию ${item.name} — вопросы и задачи | InterVerse`,description:item.lead+' Онлайн-тренировка под выбранный уровень.',path:'/preparation/'+item.slug}])),
    ...Object.fromEntries(jobTracks.map(item => ['/jobs/'+item.slug,{title:`Вакансии ${item.name} разработчиков — работа и подготовка | InterVerse`,description:item.lead,path:'/jobs/'+item.slug}])),
    '/preparation/python': {
        title: 'Подготовка к собеседованию Python — вопросы, задачи и тренировки | InterVerse',
        description: 'Разбери вопросы на собеседовании Python с ответами, реши практическую задачу и настрой тренировку Backend под уровень Junior, Middle или Senior.',
        path: '/preparation/python',
    },
    '/': {
        title: DEFAULT_TITLE,
        description: DEFAULT_DESCRIPTION,
        path: '/',
    },
    '/pricing': {
        title: 'Тарифы InterVerse — Basic и Pro для подготовки к собеседованиям',
        description:
            'Сравни тарифы InterVerse: бесплатный Basic и Pro с расширенным лимитом тренировок к техническим интервью.',
        path: '/pricing',
    },
    '/about-contractor': {
        title: 'Об исполнителе — InterVerse',
        description: 'Реквизиты исполнителя услуг InterVerse: ФИО, статус самозанятого, ИНН и контакты для обращений.',
        path: '/about-contractor',
    },
    '/privacy': {
        title: 'Политика конфиденциальности — InterVerse',
        description: 'Как InterVerse обрабатывает персональные данные пользователей сервиса подготовки к собеседованиям.',
        path: '/privacy',
    },
    '/login': {
        title: 'Вход — InterVerse',
        description: 'Войди в InterVerse, чтобы продолжить подготовку к техническим собеседованиям.',
        path: '/login',
        noindex: true,
    },
    '/register': {
        title: 'Регистрация — InterVerse',
        description: 'Создай аккаунт InterVerse и начни тренировки к IT-собеседованиям.',
        path: '/register',
        noindex: true,
    },
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
    let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
    if (!el) {
        el = document.createElement('meta')
        el.setAttribute(attr, key)
        document.head.appendChild(el)
    }
    el.setAttribute('content', content)
}

function upsertLink(rel: string, href: string) {
    let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
    if (!el) {
        el = document.createElement('link')
        el.setAttribute('rel', rel)
        document.head.appendChild(el)
    }
    el.setAttribute('href', href)
}

export function resolveSeo(pathname: string): SeoConfig {
    if (ROUTES[pathname]) return ROUTES[pathname]
    if (
        pathname.startsWith('/dashboard') ||
        pathname.startsWith('/interviews') ||
        pathname.startsWith('/reports') ||
        pathname.startsWith('/profile') ||
        pathname.startsWith('/subscription') ||
        pathname.startsWith('/vacancies') ||
        pathname.startsWith('/admin') ||
        pathname.startsWith('/activity') ||
        pathname.startsWith('/calendar') ||
        pathname.startsWith('/grafana') ||
        pathname.startsWith('/metrics-login') ||
        pathname.startsWith('/oauth')
    ) {
        return {
            title: 'InterVerse',
            description: DEFAULT_DESCRIPTION,
            path: pathname,
            noindex: true,
        }
    }
    return {
        title: DEFAULT_TITLE,
        description: DEFAULT_DESCRIPTION,
        path: pathname,
        noindex: true,
    }
}

/** Updates document title/description/canonical for the current route (SPA SEO). */
export default function SeoHead() {
    const { pathname } = useLocation()

    useEffect(() => {
        const seo = resolveSeo(pathname)
        const url = `${SITE}${seo.path === '/' ? '/' : seo.path}`
        document.title = seo.title
        upsertMeta('name', 'description', seo.description)
        upsertMeta('name', 'robots', seo.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1')
        upsertMeta('property', 'og:title', seo.title)
        upsertMeta('property', 'og:description', seo.description)
        upsertMeta('property', 'og:url', url)
        upsertMeta('name', 'twitter:title', seo.title)
        upsertMeta('name', 'twitter:description', seo.description)
        upsertLink('canonical', url)
    }, [pathname])

    return null
}
