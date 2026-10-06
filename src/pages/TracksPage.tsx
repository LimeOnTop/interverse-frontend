import { Construction } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import PageTransition from '../components/ui/PageTransition'
import EmptyState from '../components/ui/EmptyState'
import ProTrackCard from '../components/ProTrackCard'

export default function TracksPage() {
    return (
        <PageTransition className="space-y-8">
            <PageHeader
                title="Траектории"
                description="Траектории специальностей для освоения новых профессий"
            />

            <EmptyState
                icon={Construction}
                title="Раздел в разработке"
                description="Подписчики Pro Track получат доступ к траекториям специальностей: смогут обучаться новым профессиям и проверять свои навыки. Одна подписка откроет все траектории сразу. Действующие подписчики Pro будут автоматически и бесплатно переведены на Pro Track, а цена их подписки сохранится навсегда."
            />

            <div className="max-w-md mx-auto">
                <ProTrackCard showPrice={false} />
            </div>
        </PageTransition>
    )
}
