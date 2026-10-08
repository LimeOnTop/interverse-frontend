import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import Badge from '../ui/Badge'
import { formatDateTime, ticketStatusLabel, ticketTitle, type SupportRole, type SupportTicket } from '../../lib/support'

interface TicketListProps {
    tickets: SupportTicket[]
    viewer: SupportRole
    hrefFor: (ticket: SupportTicket) => string
}

export default function TicketList({ tickets, viewer, hrefFor }: TicketListProps) {
    return (
        <ul className="iv-panel divide-y divide-gray-200 dark:divide-iv-dark-line">
            {tickets.map((ticket) => {
                const open = ticket.status === 'open'
                const needsAttention = open && ticket.last_author_role !== viewer
                return (
                    <li key={ticket.id}>
                        <Link
                            to={hrefFor(ticket)}
                            className="flex items-center gap-4 px-4 py-3.5 sm:px-5 hover:bg-gray-50 dark:hover:bg-iv-dark-bg transition-iv"
                        >
                            <span
                                className={`w-2 h-2 rounded-full shrink-0 ${
                                    needsAttention ? 'bg-inter-verse-green dark:bg-purple-400' : 'bg-transparent'
                                }`}
                                aria-hidden
                            />
                            <span className="min-w-0 flex-1">
                                <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                    <span className="font-mono text-xs text-secondary">{ticketTitle(ticket.id)}</span>
                                    <Badge variant={open ? (needsAttention ? 'success' : 'default') : 'default'}>
                                        {ticketStatusLabel(ticket, viewer)}
                                    </Badge>
                                </span>
                                <span className="block mt-1 font-medium text-gray-900 dark:text-gray-100 truncate">
                                    {ticket.subject}
                                </span>
                                <span className="block mt-0.5 text-xs text-secondary truncate">
                                    {viewer === 'admin' && ticket.user_email ? `${ticket.user_email} · ` : ''}
                                    {formatDateTime(ticket.last_message_at || ticket.created_at)}
                                    {ticket.messages_count ? ` · сообщений: ${ticket.messages_count}` : ''}
                                </span>
                            </span>
                            <ChevronRight className="w-4 h-4 text-secondary shrink-0" />
                        </Link>
                    </li>
                )
            })}
        </ul>
    )
}
