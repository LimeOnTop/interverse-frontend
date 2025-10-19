import { Calendar as BigCalendar, momentLocalizer, Views } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { useState, useEffect } from 'react'
import { api } from '../services/api'

const localizer = momentLocalizer(moment)

interface Interview {
    id: string
    title: string
    candidate: {
        name: string
    }
    scheduled_at: string
    duration: number
    status: string
    level: string
    specialization: string
}

interface CalendarEvent {
    id: string
    title: string
    start: Date
    end: Date
    resource: {
        interview: Interview
    }
}

export default function Calendar() {
    const [events, setEvents] = useState<CalendarEvent[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchInterviews()
    }, [])

    const fetchInterviews = async () => {
        try {
            const response = await api.get('/interviews/')
            const interviews = response.data.interviews || []

            const calendarEvents: CalendarEvent[] = interviews
                .filter((interview: Interview) => interview.scheduled_at)
                .map((interview: Interview) => {
                    const startDate = new Date(interview.scheduled_at)
                    const endDate = new Date(startDate.getTime() + interview.duration * 60000)

                    return {
                        id: interview.id,
                        title: `${interview.title} - ${interview.candidate.name}`,
                        start: startDate,
                        end: endDate,
                        resource: {
                            interview
                        }
                    }
                })

            setEvents(calendarEvents)
        } catch (error) {
            console.error('Error fetching interviews:', error)
        } finally {
            setLoading(false)
        }
    }

    const eventStyleGetter = (event: CalendarEvent) => {
        const status = event.resource.interview.status
        let backgroundColor = '#3174ad'

        switch (status) {
            case 'scheduled':
                backgroundColor = '#3174ad'
                break
            case 'in_progress':
                backgroundColor = '#f59e0b'
                break
            case 'completed':
                backgroundColor = '#10b981'
                break
            case 'cancelled':
                backgroundColor = '#ef4444'
                break
            default:
                backgroundColor = '#6b7280'
        }

        return {
            style: {
                backgroundColor,
                borderRadius: '4px',
                opacity: 0.8,
                color: 'white',
                border: '0px',
                display: 'block'
            }
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-inter-verse-green"></div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Календарь интервью</h2>
                <p className="text-sm text-gray-600 mt-1">Просмотр запланированных интервью</p>
            </div>

            <div className="h-96">
                <BigCalendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '100%' }}
                    views={[Views.MONTH, Views.WEEK, Views.DAY]}
                    defaultView={Views.MONTH}
                    eventPropGetter={eventStyleGetter}
                    onSelectEvent={(event) => {
                        console.log('Selected event:', event)
                        // Здесь можно добавить модальное окно с деталями интервью
                    }}
                    messages={{
                        next: 'Следующий',
                        previous: 'Предыдущий',
                        today: 'Сегодня',
                        month: 'Месяц',
                        week: 'Неделя',
                        day: 'День',
                        agenda: 'Повестка',
                        date: 'Дата',
                        time: 'Время',
                        event: 'Событие',
                        noEventsInRange: 'Нет интервью в выбранном периоде',
                        showMore: (total: number) => `+${total} еще`
                    }}
                />
            </div>

            <div className="mt-4 flex flex-wrap gap-4">
                <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
                    <span className="text-sm text-gray-600">Запланировано</span>
                </div>
                <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-500 rounded mr-2"></div>
                    <span className="text-sm text-gray-600">В процессе</span>
                </div>
                <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
                    <span className="text-sm text-gray-600">Завершено</span>
                </div>
                <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
                    <span className="text-sm text-gray-600">Отменено</span>
                </div>
            </div>
        </div>
    )
}
