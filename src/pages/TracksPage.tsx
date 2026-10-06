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
                description="Подписчики Pro Track получат доступ к траекториям специальностей: смогут обучаться новым профессиям и проверять свои навыки. Подписка откроет все траектории сразу за 1 890 ₽ в месяц, тогда как платные курсы продаются примерно за 90 000 ₽. Действующие подписчики Pro будут автоматически и бесплатно переведены на Pro Track, а цена их подписки сохранится навсегда."
            />

            <div className="max-w-md mx-auto">
                <ProTrackCard />
            </div>
        </PageTransition>
    )
}
