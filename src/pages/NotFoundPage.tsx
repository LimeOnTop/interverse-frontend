import { Link } from 'react-router-dom'
import PublicNav from '../components/PublicNav'
export default function NotFoundPage(){return <div><PublicNav/><main className="max-w-2xl mx-auto p-8"><h1 className="text-3xl mb-4">Страница не найдена</h1><p>Проверь адрес или вернись к подготовке.</p><Link className="inline-block mt-6 underline" to="/preparation">Выбрать направление</Link></main></div>}
