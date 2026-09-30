import { Link } from 'react-router-dom'
import PageTransition from '../components/ui/PageTransition'
import Button from '../components/ui/Button'

export default function PaymentSuccessPage() {
    return (
        <PageTransition>
            <div className="min-h-[60vh] flex items-center justify-center px-6">
                <div className="max-w-md text-center space-y-4">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Оплата прошла успешно</h1>
                    <p className="text-sm text-secondary leading-relaxed">
                        Подписка Pro будет активирована после подтверждения платежа. Обычно это занимает несколько секунд.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                        <Link to="/subscription">
                            <Button type="button">К подписке</Button>
                        </Link>
                        <Link to="/interviews" className="btn-secondary text-sm px-4 py-2 inline-flex items-center justify-center">
                            К тренировкам
                        </Link>
                    </div>
                </div>
            </div>
        </PageTransition>
    )
}
