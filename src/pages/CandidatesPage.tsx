import { Construction } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import PageTransition from '../components/ui/PageTransition'
import EmptyState from '../components/ui/EmptyState'

export default function CandidatesPage() {
    return (
        <PageTransition className="space-y-8">
            <PageHeader
                title="Вакансии"
                description="Агрегатор вакансий из разных источников"
            />

            <EmptyState
                icon={Construction}
                title="Раздел в разработке"
                description="Здесь появится лента вакансий, собранная из job-площадок и других источников. Вы сможете фильтровать предложения по стеку, уровню и направлению — и сразу переходить к тренировке под конкретную позицию."
            />
        </PageTransition>
    )
}
