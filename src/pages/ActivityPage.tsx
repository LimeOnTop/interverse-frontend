import ActivityChart from '../components/ActivityChart'
import PageHeader from '../components/ui/PageHeader'
import PageTransition from '../components/ui/PageTransition'
import Card from '../components/ui/Card'

export default function ActivityPage() {
    return (
        <PageTransition className="space-y-6">
            <PageHeader
                title="Активность"
                description="Динамика пройденных интервью и статистика активности"
            />
            <Card padding="lg">
                <ActivityChart />
            </Card>
        </PageTransition>
    )
}
