import toast from 'react-hot-toast'
import { api } from '../services/api'
import { reminderChanged, type PracticeReminder } from '../lib/practiceReminders'
import { formatUserFacingError } from '../lib/interviewSession'

export async function cancelPracticePlan(plan: PracticeReminder) {
    await api.post('/practice-reminders/dismiss', { id: plan.id, revision: plan.revision })
    reminderChanged()
    toast(notification => <span>План отменён. <button className="underline min-h-[44px]" onClick={async () => {
        try { await api.post('/practice-reminders/restore', { id: plan.id, revision: plan.revision + 1 }); reminderChanged(plan.id); toast.dismiss(notification.id) }
        catch (error) { toast.error(formatUserFacingError(error, 'Не удалось восстановить план')) }
    }}>Восстановить</button></span>, { duration: 10000 })
}
