import ActivityChart from '../components/ActivityChart'
import ProgressChart from '../components/ProgressChart'
import PageHeader from '../components/ui/PageHeader'
import PageTransition from '../components/ui/PageTransition'
import Card from '../components/ui/Card'

export default function ActivityPage() {
    return (
        <PageTransition className="space-y-6">
            <PageHeader
                title="Активность"
                description="Прогресс между тренировками, динамика пройденных интервью и статистика активности"
            />
            <Card padding="lg">
                <ProgressChart />
            </Card>
            <Card padding="lg">
                <ActivityChart />
            </Card>
        </PageTransition>
    )
}
