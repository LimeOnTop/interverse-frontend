import Badge from '../ui/Badge'
import { isSectionPassed, getScoreVariant, type ReportSectionScore } from '../../lib/reportScores'

interface SectionScoreBadgeProps {
    section: ReportSectionScore
    className?: string
}

export default function SectionScoreBadge({ section, className = '' }: SectionScoreBadgeProps) {
    if (section.comingSoon) {
        return (
            <Badge variant="default" className={className}>
                В разработке
            </Badge>
        )
    }

    const passed = isSectionPassed(section.score, section.passed)

    if (!passed) {
        return (
            <Badge variant="danger" className={className}>
                Не пройдено
            </Badge>
        )
    }

    return (
        <Badge variant={getScoreVariant(section.score)} className={className}>
            {section.score}%
        </Badge>
    )
}
