import { useParams } from 'react-router-dom'
import PageTransition from '../components/ui/PageTransition'
import SupportChat from '../components/support/SupportChat'

export default function SupportTicketPage() {
    const { id = '' } = useParams()
    return (
        <PageTransition>
            <SupportChat key={id} ticketId={id} viewer="user" backHref="/support" backLabel="Поддержка" />
        </PageTransition>
    )
}
