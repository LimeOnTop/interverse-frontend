let freeTrainingsTotal = 3
export const getFreeTrainingsTotal = () => freeTrainingsTotal
export const freeTrainingCaption = () => {
 const n = getFreeTrainingsTotal()
 const mod = n % 100
 const word = mod >= 11 && mod <= 14 ? 'тренировок' : n % 10 === 1 ? 'тренировка' : n % 10 >= 2 && n % 10 <= 4 ? 'тренировки' : 'тренировок'
 return `${n} ${word}`
}
export async function loadTrainingLimits() {
 try {
  const base = (import.meta.env.VITE_API_URL || '/api/v1').replace(/\/$/, '')
  const response = await fetch(`${base}/public/training-limits`, {signal: AbortSignal.timeout(2000), cache: 'no-store'})
  if (!response.ok) return
  const data = await response.json()
  if (Number.isSafeInteger(data.free_trainings_total) && data.free_trainings_total > 0) freeTrainingsTotal = data.free_trainings_total
 } catch { /* Keep the default copy; the server still enforces its own policy. */ }
}
