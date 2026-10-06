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
    description: 'Базовый доступ для регулярной практики с умеренным лимитом тренировок.',
    features: [
        'До 3 тренировок в неделю',
        'Вопросы и задачи по выбранному стеку',
        'Отчёты по пройденным сессиям',
        'Импорт резюме из hh.ru',
        'Профиль и персонализация',
    ],
    paid: false as const,
}

export const PRO_FEATURES = [
    'До 20 тренировок в день',
    'Поиск вакансий по навыкам профиля',
    'Вопросы и задачи по выбранному стеку',
    'Отчёты по пройденным сессиям',
    'Импорт резюме из hh.ru',
    'Приоритетный доступ к новым форматам тренировок',
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
        earlyBirdRemaining: data.early_bird_remaining ?? 100,
        earlyBirdLimit: data.early_bird_limit ?? 100,
    }
}
