import { create } from 'zustand'

interface PromoState {
    limitPromoOpen: boolean
    openLimitPromo: () => void
    closeLimitPromo: () => void
}

export const usePromoStore = create<PromoState>((set) => ({
    limitPromoOpen: false,
    openLimitPromo: () => set({ limitPromoOpen: true }),
    closeLimitPromo: () => set({ limitPromoOpen: false }),
}))

/** True for the 429 the gateway returns when the plan's training quota is used up. */
export function isTrainingLimitError(error: unknown): boolean {
    const response = (error as { response?: { status?: number; data?: { code?: unknown } } } | null)?.response
    return response?.status === 429 && response.data?.code === 'training_limit_exceeded'
}
