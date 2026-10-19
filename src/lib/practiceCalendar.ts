export const dayISO = (date: Date) => date.toISOString().slice(0, 10)
export function shiftDay(day: string, delta: number) {
    const date = new Date(`${day}T12:00:00Z`)
    date.setUTCDate(date.getUTCDate() + delta)
    return dayISO(date)
}
export function shiftMonth(day: string, delta: number) {
    const date = new Date(`${day}T12:00:00Z`), wanted = date.getUTCDate()
    date.setUTCDate(1); date.setUTCMonth(date.getUTCMonth() + delta)
    const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate()
    date.setUTCDate(Math.min(wanted, end))
    return dayISO(date)
}
export function calendarDays(month: string) {
    const first = `${month.slice(0, 7)}-01`
    const offset = (new Date(`${first}T12:00:00Z`).getUTCDay() + 6) % 7
    return Array.from({ length: 42 }, (_, index) => shiftDay(first, index - offset))
}
export function reminderAllowed(value: string, now = Date.now()) {
    return Number.isFinite(Date.parse(value)) && Date.parse(value) - now > 60 * 60000
}
