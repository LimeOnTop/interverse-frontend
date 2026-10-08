export type SubscriptionPlanId = 'free' | 'paid'

export type SubscriptionPlanLabel = 'Basic' | 'Pro'

export type PaidProductId = 'paid_1m' | 'paid_3m' | 'paid_6m' | 'paid_1y'

export function resolveSubscriptionPlan(user?: {
    subscription_plan?: string
    subscription_active?: boolean
} | null): SubscriptionPlanId {
    if (user?.subscription_active) {
        return 'paid'
    }
    return 'free'
}

export function subscriptionPlanLabel(plan: SubscriptionPlanId): SubscriptionPlanLabel {
    return plan === 'paid' ? 'Pro' : 'Basic'
}

export function formatRub(amount: string | number): string {
    const raw = String(amount).replace(',', '.').trim()
    const value = Number.parseFloat(raw)
    if (!Number.isFinite(value)) {
        return `${amount} ₽`
    }
    return `${Math.round(value).toLocaleString('ru-RU')} ₽`
}

export const FREE_PLAN = {
    id: 'free' as const,
    name: 'Basic',
    price: 'Бесплатно',
    priceHint: 'Без срока действия',
    description: 'Попробуйте формат: одна полноценная тренировка с итоговой оценкой.',
    features: [
        '1 тренировка с вопросами и задачами по вашему стеку',
        'Итоговый результат в процентах и общий отзыв',
        'Число выявленных слабых мест',
        'Импорт резюме из hh.ru',
        'Профиль и персонализация',
    ],
    paid: false as const,
}

/** Must match paidTrainingsPerDay in interverse-interview. */
export const PRO_TRAININGS_PER_DAY = 5

export const PRO_FEATURES = [
    `До ${PRO_TRAININGS_PER_DAY} тренировок в день`,
    'Детальный анализ тренировок: слабые места и объяснение правильных ответов',
    'Ссылки на материалы для изучения каждой темы',
    'Подборка вакансий по навыкам профиля',
    'Скачивание отчёта в PDF',
    'Вопросы и задачи по выбранному стеку',
    'Импорт резюме из hh.ru',
] as const

export type PaidOffer = {
    id: PaidProductId | string
    name: string
    price: string
    regularPrice?: string
    priceHint: string
    description: string
    badge?: string
    earlyBird?: boolean
    durationDays: number
    paid: true
    features: readonly string[]
}

export type PricingCard = typeof FREE_PLAN | PaidOffer

/** Fallback catalog used when offers API is unavailable. */
export const FALLBACK_PAID_OFFERS: PaidOffer[] = [
    {
        id: 'paid_1m',
        name: 'Pro · 1 месяц',
        price: '390.00',
        regularPrice: '690.00',
        priceHint: 'спеццена для первых 100 пользователей',
        description: 'Расширенный лимит для интенсивной подготовки к собеседованиям.',
        earlyBird: true,
        durationDays: 30,
        paid: true,
        features: PRO_FEATURES,
    },
    {
        id: 'paid_3m',
        name: 'Pro · 3 месяца',
        price: '1890.00',
        regularPrice: '1890.00',
        priceHint: 'за 3 месяца',
        description: 'Оптимальный старт для подготовки к нескольким собеседованиям подряд.',
        badge: 'Хит',
        durationDays: 90,
        paid: true,
        features: PRO_FEATURES,
    },
    {
        id: 'paid_6m',
        name: 'Pro · 6 месяцев',
        price: '3390.00',
        regularPrice: '3390.00',
        priceHint: 'за 6 месяцев',
        description: 'Длинный цикл практики со скидкой относительно помесячной оплаты.',
        durationDays: 180,
        paid: true,
        features: PRO_FEATURES,
    },
    {
        id: 'paid_1y',
        name: 'Pro · 1 год',
        price: '5890.00',
        regularPrice: '5890.00',
        priceHint: 'за год',
        description: 'Максимальная выгода для системной подготовки в течение года.',
        badge: 'Выгодно',
        durationDays: 365,
        paid: true,
        features: PRO_FEATURES,
    },
]

/** @deprecated kept for callers that still expect Basic + single Pro */
export const SUBSCRIPTION_PLANS = [
    FREE_PLAN,
    {
        id: 'paid' as const,
        name: 'Pro' as const,
        price: '690 ₽',
        priceHint: 'в месяц',
        description: FALLBACK_PAID_OFFERS[0].description,
        features: [...PRO_FEATURES],
        paid: true as const,
    },
] as const

export type OffersResponse = {
    offers: Array<{
        id: string
        name: string
        price: string
        regular_price?: string
        duration_days: number
        price_hint?: string
        description?: string
        badge?: string
        early_bird?: boolean
    }>
    early_bird_remaining: number
    early_bird_limit: number
}

export function mapOffersResponse(data: OffersResponse): {
    paidOffers: PaidOffer[]
    earlyBirdRemaining: number
    earlyBirdLimit: number
} {
    const paidOffers = (data.offers || []).map((offer) => ({
        id: offer.id,
        name: offer.name,
        price: offer.price,
        regularPrice: offer.regular_price || offer.price,
        priceHint: offer.price_hint || '',
        description: offer.description || '',
        badge: offer.badge || undefined,
        earlyBird: Boolean(offer.early_bird),
        durationDays: offer.duration_days,
        paid: true as const,
        features: PRO_FEATURES,
    }))

    return {
        paidOffers: paidOffers.length > 0 ? paidOffers : FALLBACK_PAID_OFFERS,
        earlyBirdRemaining: data.early_bird_remaining ?? 27,
        earlyBirdLimit: data.early_bird_limit ?? 100,
    }
}

/** Pro Track: upcoming subscription with access to all specialization tracks. Not on sale yet. */
export const PRO_TRACK_PLAN = {
    id: 'pro_track' as const,
    name: 'Pro Track',
    price: '1890.00',
    coursePrice: '90000.00',
    priceHint: 'в месяц, доступ ко всем траекториям сразу',
    badge: 'Скоро',
    description:
        'Доступ к траекториям специальностей: осваивайте новые профессии и проверяйте свои навыки.',
    features: [
        'Все траектории специальностей в одной подписке',
        'Освоение новых профессий шаг за шагом',
        'Проверка навыков на каждом этапе траектории',
        'Все возможности тарифа Pro',
    ],
    proUpgradeNote:
        'Действующие подписчики Pro автоматически и бесплатно перейдут на Pro Track, а цена их подписки сохранится навсегда.',
} as const
