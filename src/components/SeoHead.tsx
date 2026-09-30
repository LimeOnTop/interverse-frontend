import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const SITE = 'https://inter-verse.ru'
const DEFAULT_TITLE = 'InterVerse — подготовка к техническим собеседованиям IT'
const DEFAULT_DESCRIPTION =
    'InterVerse — онлайн-тренировки к техническим собеседованиям: Frontend, Backend, DevOps, QA и Data Science. Вопросы и задачи под ваш стек и уровень от Intern до Senior.'

type SeoConfig = {
    title: string
    description: string
    path: string
    noindex?: boolean
}

const ROUTES: Record<string, SeoConfig> = {
    '/': {
        title: DEFAULT_TITLE,
        description: DEFAULT_DESCRIPTION,
        path: '/',
    },
    '/pricing': {
        title: 'Тарифы InterVerse — Basic и Pro для подготовки к собеседованиям',
        description:
            'Сравните тарифы InterVerse: бесплатный Basic и Pro с расширенным лимитом тренировок к техническим интервью.',
        path: '/pricing',
    },
    '/privacy': {
        title: 'Политика конфиденциальности — InterVerse',
        description: 'Как InterVerse обрабатывает персональные данные пользователей сервиса подготовки к собеседованиям.',
        path: '/privacy',
    },
    '/login': {
        title: 'Вход — InterVerse',
        description: 'Войдите в InterVerse, чтобы продолжить подготовку к техническим собеседованиям.',
        path: '/login',
        noindex: true,
    },
    '/register': {
        title: 'Регистрация — InterVerse',
        description: 'Создайте аккаунт InterVerse и начните тренировки к IT-собеседованиям.',
        path: '/register',
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

function resolveSeo(pathname: string): SeoConfig {
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
