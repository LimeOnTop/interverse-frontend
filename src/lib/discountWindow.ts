/** Use the server's remaining duration with a monotonic client clock. */
export function discountDeadline(expiresAt: string | undefined, serverTime: string | undefined, now: number): number {
    const remaining = Date.parse(expiresAt || '') - Date.parse(serverTime || '')
    return now + (Number.isFinite(remaining) ? Math.max(0, remaining) : 0)
}
export function discountSecondsLeft(deadline: number, now: number): number {
    return Math.max(0, Math.ceil((deadline - now) / 1000))
}
export function availableOffers<T extends { earlyBird?: boolean }>(offers: T[], seconds: number): T[] {
    return offers.filter(offer => !offer.earlyBird || seconds > 0)
}
