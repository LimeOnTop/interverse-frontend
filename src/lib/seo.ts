import { preparations, jobTracks } from '../data/preparation'
import { pythonPreparation } from '../data/pythonPreparation'

export const SITE_URL = 'https://inter-verse.ru'
export const INDEX_ROBOTS = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
export const PRIVATE_ROBOTS = 'noindex, follow'
const allPreparations = [pythonPreparation, ...preparations]

export type SeoConfig = { title: string; description: string; path: string; noindex?: boolean }

const ROUTES: Record<string, SeoConfig> = {
    '/': {
        title: 'Тренажёр IT-собеседований онлайн — подготовка к интервью | InterVerse',
        description: 'Подготовься к собеседованию в IT: тренировки по своему стеку, технические вопросы и задачи, оценка ответов. Найди вакансии и повтори темы перед интервью.',
        path: '/',
    },
    '/preparation': {
        title: 'Подготовка к собеседованию в IT — вопросы с ответами | InterVerse',
        description: 'Вопросы на собеседовании с ответами и практические задачи по Python, Java, React, Frontend и QA. Проверь знания и начни онлайн-тренировку под свой уровень.',
        path: '/preparation',
    },
    '/preparation/system-design': {
        title: 'System Design — задачи и тренажёр архитектуры систем | InterVerse',
        description: 'Подготовка к System Design интервью: 25 задач на интерактивной доске. Балансировка, кеширование, очереди и репликация. Первый уровень бесплатно.',
        path: '/preparation/system-design',
    },
    '/jobs': {
        title: 'IT-вакансии и поиск работы в IT — вакансии разработчиков | InterVerse',
        description: 'Ищи работу в IT по стеку: вакансии Python, Java, React и Frontend. Сравни требования, выбери удалённый формат или Junior и подготовься к собеседованию.',
        path: '/jobs',
    },
    ...Object.fromEntries(allPreparations.map(item => ['/preparation/' + item.slug, {
        title: item.slug === 'qa'
            ? 'Собеседование тестировщика QA — вопросы с ответами и практика | InterVerse'
            : `Собеседование ${item.name} — вопросы с ответами и задачи | InterVerse`,
        description: item.slug === 'qa'
            ? 'Подготовка к собеседованию тестировщика: тест-дизайн, API и Selenium. Открытые вопросы с ответами, задание и тренировка для Junior, Middle и Senior.'
            : `Подготовка к собеседованию ${item.name}: вопросы с ответами, практическая задача и план повторения. Тренируйся онлайн под уровень Junior, Middle или Senior.`,
        path: '/preparation/' + item.slug,
    }])),
    ...Object.fromEntries(jobTracks.map(item => ['/jobs/' + item.slug, {
        title: `Вакансии ${item.name} — работа ${item.jobTitle} | InterVerse`,
        description: item.lead,
        path: '/jobs/' + item.slug,
    }])),
    '/pricing': {
        title: 'Тарифы тренажёра собеседований — Basic и Pro | InterVerse',
        description: 'Сравни тарифы InterVerse: бесплатный Basic и Pro с подробным разбором ответов и расширенным лимитом тренировок к техническим собеседованиям.',
        path: '/pricing',
    },
    '/pro-trial': {
        title: 'Пробный Pro за 1 ₽ на 3 дня — условия | InterVerse',
        description: 'Условия пробного доступа Pro: 1 ₽ за 72 часа, затем 390 ₽ в месяц. Управление автопродлением в профиле.',
        path: '/pro-trial',
    },
    '/privacy': {
        title: 'Политика конфиденциальности — InterVerse',
        description: 'Как InterVerse обрабатывает персональные данные пользователей сервиса подготовки к собеседованиям.',
        path: '/privacy',
    },
    '/about-contractor': {
        title: 'Об исполнителе — InterVerse',
        description: 'Реквизиты исполнителя услуг InterVerse: ФИО, статус самозанятого, ИНН и контакты для обращений.',
        path: '/about-contractor',
    },
}

export const PUBLIC_PATHS = Object.keys(ROUTES)

export function resolveSeo(pathname: string): SeoConfig {
    const normalized = pathname.replace(/\/index\.html$/, '').replace(/\/+$/, '') || '/'
    if (ROUTES[normalized]) return ROUTES[normalized]
    return {
        title: pathname === '/login' ? 'Вход — InterVerse' : pathname === '/register' ? 'Регистрация — InterVerse' : 'InterVerse',
        description: 'Личный кабинет InterVerse для подготовки к техническим собеседованиям.',
        path: pathname,
        noindex: true,
    }
}

export function structuredData(pathname: string) {
    const seo = resolveSeo(pathname)
    if (seo.noindex) return null
    const url = SITE_URL + seo.path
    const isCollection = seo.path === '/jobs' || seo.path === '/preparation'
    const breadcrumbs = [{ '@type': 'ListItem', position: 1, name: 'InterVerse', item: SITE_URL + '/' }]
    if (seo.path.startsWith('/jobs/')) breadcrumbs.push({ '@type': 'ListItem', position: 2, name: 'IT-вакансии', item: SITE_URL + '/jobs' })
    if (seo.path.startsWith('/preparation/')) breadcrumbs.push({ '@type': 'ListItem', position: 2, name: 'Подготовка к собеседованию', item: SITE_URL + '/preparation' })
    if (seo.path !== '/') breadcrumbs.push({ '@type': 'ListItem', position: breadcrumbs.length + 1, name: seo.title.replace(/ \| InterVerse$/, ''), item: url })
    const collectionItems = seo.path === '/jobs'
        ? jobTracks.map(item => ({ name: `Вакансии ${item.name}`, url: SITE_URL + '/jobs/' + item.slug }))
        : seo.path === '/preparation'
            ? [...allPreparations.map(item => ({ name: `Собеседование ${item.name}`, url: SITE_URL + '/preparation/' + item.slug })), { name: 'System Design', url: SITE_URL + '/preparation/system-design' }]
            : []
    return {
        '@context': 'https://schema.org',
        '@graph': [
            { '@type': 'Organization', '@id': SITE_URL + '/#organization', name: 'InterVerse', url: SITE_URL + '/', logo: { '@type': 'ImageObject', url: SITE_URL + '/images/interverse-logo-square.png', width: 260, height: 260 }, email: 'info@inter-verse.ru' },
            { '@type': 'WebSite', '@id': SITE_URL + '/#website', url: SITE_URL + '/', name: 'InterVerse', publisher: { '@id': SITE_URL + '/#organization' }, inLanguage: 'ru-RU' },
            { '@type': isCollection ? 'CollectionPage' : 'WebPage', '@id': url + '#page', url, name: seo.title, description: seo.description, inLanguage: 'ru-RU', isPartOf: { '@id': SITE_URL + '/#website' }, ...(seo.path !== '/' ? { breadcrumb: { '@id': url + '#breadcrumbs' } } : {}), ...(isCollection ? { mainEntity: { '@id': url + '#list' } } : {}) },
            ...(seo.path === '/' ? [{ '@type': 'SoftwareApplication', '@id': SITE_URL + '/#application', name: 'InterVerse', applicationCategory: 'EducationalApplication', operatingSystem: 'Web', url: SITE_URL + '/', description: seo.description, offers: { '@type': 'Offer', price: '0', priceCurrency: 'RUB', description: 'Базовый тариф бесплатно' }, inLanguage: 'ru-RU' }] : []),
            ...(seo.path === '/' ? [] : [{ '@type': 'BreadcrumbList', '@id': url + '#breadcrumbs', itemListElement: breadcrumbs }]),
            ...(isCollection ? [{ '@type': 'ItemList', '@id': url + '#list', numberOfItems: collectionItems.length, itemListElement: collectionItems.map((item, i) => ({ '@type': 'ListItem', position: i + 1, name: item.name, url: item.url })) }] : []),
        ],
    }
}

export function serializeStructuredData(pathname: string) {
    const graph = structuredData(pathname)
    return graph ? JSON.stringify(graph).replace(/</g, '\\u003c') : ''
}
