import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { SITE_URL, INDEX_ROBOTS, PRIVATE_ROBOTS, resolveSeo, serializeStructuredData } from '../lib/seo'

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
    let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
    if (!el) {
        el = document.createElement('meta')
        el.setAttribute(attr, key)
        document.head.appendChild(el)
    }
    el.setAttribute('content', content)
}

function upsertLink(rel: string, href: string) {
    let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
    if (!el) {
        el = document.createElement('link')
        el.setAttribute('rel', rel)
        document.head.appendChild(el)
    }
    el.setAttribute('href', href)
}

/** Keep SPA navigation consistent with the HTML rendered for search engines. */
export default function SeoHead() {
    const { pathname } = useLocation()
    useEffect(() => {
        const seo = resolveSeo(pathname)
        const url = SITE_URL + seo.path
        document.title = seo.title
        upsertMeta('name', 'description', seo.description)
        upsertMeta('name', 'robots', seo.noindex ? PRIVATE_ROBOTS : INDEX_ROBOTS)
        upsertMeta('property', 'og:title', seo.title)
        upsertMeta('property', 'og:description', seo.description)
        upsertMeta('property', 'og:url', url)
        upsertMeta('name', 'twitter:title', seo.title)
        upsertMeta('name', 'twitter:description', seo.description)
        upsertLink('canonical', url)
        document.head.querySelectorAll<HTMLLinkElement>('link[rel="alternate"][hreflang]').forEach(el => el.setAttribute('href', url))
        let graph = document.getElementById('page-structured-data')
        const json = serializeStructuredData(pathname)
        if (!json) graph?.remove()
        else {
            if (!graph) {
                graph = document.createElement('script')
                graph.id = 'page-structured-data'
                graph.setAttribute('type', 'application/ld+json')
                document.head.appendChild(graph)
            }
            graph.textContent = json
        }
    }, [pathname])
    return null
}
