import { Link } from 'react-router-dom'
import PageTransition from '../components/ui/PageTransition'
import Button from '../components/ui/Button'

export default function PaymentFailPage() {
    return (
        <PageTransition>
            <div className="min-h-[60vh] flex items-center justify-center px-6">
                <div className="max-w-md text-center space-y-4">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Оплата не завершена</h1>
                    <p className="text-sm text-secondary leading-relaxed">
                        Платёж был отменён или не прошёл. Вы можете попробовать снова на странице подписки.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                        <Link to="/subscription">
                            <Button type="button">Вернуться к подписке</Button>
                        </Link>
                        <Link to="/" className="btn-secondary text-sm px-4 py-2 inline-flex items-center justify-center">
                            На главную
                        </Link>
                    </div>
                </div>
            </div>
        </PageTransition>
    )
}
