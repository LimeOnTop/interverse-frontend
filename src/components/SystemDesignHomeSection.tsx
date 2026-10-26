import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import SystemDesignPreview from './SystemDesignPreview'

export default function SystemDesignHomeSection() {
    return <section className="iv-home-container iv-home-section" aria-labelledby="home-system-design"><div className="sd-home-feature" data-reveal><div><span className="iv-eyebrow">SYSTEM DESIGN</span><h2 id="home-system-design">Архитектуру понимают<br /><em>на практике.</em></h2><p>Собирай схемы, находи узкие места и проверяй решения. 25 задач по нагрузке, кешированию и надёжности систем.</p><Link to="/preparation/system-design" className="iv-landing-button">Попробовать System Design <ArrowUpRight size={18} /></Link><p className="sd-offer-note">Первый уровень бесплатно · Все 25 в Pro</p></div><SystemDesignPreview compact /></div></section>
}
