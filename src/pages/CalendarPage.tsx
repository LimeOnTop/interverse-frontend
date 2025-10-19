import InterviewCalendar from '../components/Calendar'

export default function CalendarPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Календарь интервью</h1>
                <p className="text-gray-600 mt-1">Просмотр и управление запланированными интервью</p>
            </div>

            <InterviewCalendar />
        </div>
    )
}
