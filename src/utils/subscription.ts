export type SubscriptionPlanId = 'free' | 'paid'

export type SubscriptionPlanLabel = 'Basic' | 'Pro'

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

export const SUBSCRIPTION_PLANS = [
    {
        id: 'free' as const,
        name: 'Basic' as const,
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
        paid: false,
    },
    {
        id: 'paid' as const,
        name: 'Pro' as const,
        price: '399 ₽',
        priceHint: 'в месяц',
        description: 'Расширенный лимит для интенсивной подготовки к собеседованиям.',
        features: [
            'До 20 тренировок в день',
            'Поиск вакансий по навыкам профиля',
            'Вопросы и задачи по выбранному стеку',
            'Отчёты по пройденным сессиям',
            'Импорт резюме из hh.ru',
            'Приоритетный доступ к новым форматам тренировок',
        ],
        paid: true,
    },
] as const
