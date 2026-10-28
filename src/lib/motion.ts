/** Shared report-style choreography. Interaction feedback stays quicker than entrances. */
export const motionEase: [number, number, number, number] = [0.23, 1, 0.32, 1]
export const motionCurve = 'cubic-bezier(0.23, 1, 0.32, 1)'
export const motionTiming = { surface: 900, content: 820, control: 600, value: 1350, disclosure: 700, popover: 220, press: 140 }

let keyboard = false
export const isKeyboardMotion = () => keyboard
export const setKeyboardMotion = (value: boolean) => { keyboard = value }
export const instantMotion = () => keyboard || (typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches)
