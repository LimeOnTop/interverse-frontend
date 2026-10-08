import { api } from '../services/api'

export type SupportRole = 'user' | 'admin'
export type TicketStatus = 'open' | 'closed'

// Protobuf JSON omits empty fields, so most of them are optional here.
export type SupportTicket = {
    id: number
    user_id?: string
    user_email?: string
    subject: string
    status: TicketStatus
    closed_by?: SupportRole
    created_at?: string
    updated_at?: string
    closed_at?: string
    last_message_at?: string
    last_author_role?: SupportRole
    messages_count?: number
}

export type SupportMessage = {
    id: number
    ticket_id: number
    author_role: SupportRole
    author_id?: string
    body: string
    created_at?: string
}

export type MessagesPage = {
    messages: SupportMessage[]
    total: number
    has_more: boolean
}

/** Messages per request; older ones load on scroll up. */
export const SUPPORT_MESSAGES_PAGE = 50

/** Ticket endpoints for the viewer: the user's own tickets or the admin inbox. */
export function supportApi(viewer: SupportRole) {
    const base = viewer === 'admin' ? '/admin/support/tickets' : '/support/tickets'
    return {
        list: async (params: { status?: TicketStatus | ''; limit?: number; offset?: number } = {}) => {
            const { data } = await api.get(base, { params })
            return { tickets: (data.tickets || []) as SupportTicket[], total: Number(data.total || 0) }
        },
        get: async (id: number | string) => {
            const { data } = await api.get(`${base}/${id}`)
            return data.ticket as SupportTicket
        },
        messages: async (id: number | string, offset: number, limit = SUPPORT_MESSAGES_PAGE): Promise<MessagesPage> => {
            const { data } = await api.get(`${base}/${id}/messages`, { params: { offset, limit } })
            return {
                messages: data.messages || [],
                total: Number(data.total || 0),
                has_more: Boolean(data.has_more),
            }
        },
        send: async (id: number | string, body: string) => {
            const { data } = await api.post(`${base}/${id}/messages`, { body })
            return { message: data.message as SupportMessage, ticket: data.ticket as SupportTicket }
        },
        close: async (id: number | string) => {
            const { data } = await api.post(`${base}/${id}/close`)
            return data.ticket as SupportTicket
        },
    }
}

export async function createSupportTicket(subject: string, message: string) {
    const { data } = await api.post('/support/tickets', { subject, message })
    return data.ticket as SupportTicket
}

export function ticketTitle(id: number | string) {
    return `Обращение #${id}`
}

export function ticketStatusLabel(ticket: SupportTicket, viewer: SupportRole) {
    if (ticket.status === 'closed') {
        return ticket.closed_by === 'admin' ? 'Закрыто поддержкой' : 'Закрыто'
    }
    // Who owes the next reply is what each side cares about.
    if (viewer === 'admin') {
        return ticket.last_author_role === 'admin' ? 'Ждёт пользователя' : 'Ждёт ответа'
    }
    return ticket.last_author_role === 'admin' ? 'Есть ответ' : 'Открыто'
}

export function formatDateTime(value?: string) {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    return date.toLocaleString('ru-RU', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    })
}

export function apiErrorMessage(error: unknown, fallback: string) {
    const response = (error as { response?: { data?: { error?: string } } })?.response
    return response?.data?.error || fallback
}
