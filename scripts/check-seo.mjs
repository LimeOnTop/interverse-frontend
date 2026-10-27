import assert from 'node:assert/strict'
import { readFile, access } from 'node:fs/promises'

const sitemap = await readFile('dist/sitemap.xml', 'utf8')
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1])
assert.ok(urls.length >= 14, 'Public routes missing from sitemap')
assert.equal(new Set(urls).size, urls.length, 'Duplicate sitemap URL')
assert.equal(await readFile('public/sitemap.xml', 'utf8'), sitemap, 'Source and deployed sitemaps differ')
const titles = new Set(), descriptions = new Set()
for (const url of urls) {
    const { pathname, search } = new URL(url)
    assert.equal(search, '', 'Filtered URLs must not enter sitemap')
    assert.ok(pathname === '/' || !pathname.endsWith('/'), 'Noncanonical trailing slash in sitemap')
    const html = await readFile(pathname === '/' ? 'dist/index.html' : `dist${pathname}/index.html`, 'utf8')
    assert.match(html, /<link rel="stylesheet" href="\/assets\/[^"]+\.css"/, `${pathname}: first render requires stylesheet in HTML`)
    assert.ok(html.includes("document.documentElement.classList.toggle('dark', dark)"), `${pathname}: theme must resolve before first paint`)
    assert.equal([...html.matchAll(/<h1(?:\s|>)/g)].length, 1, `${pathname}: expected one H1`)
    const title = html.match(/<title>([^<]+)<\/title>/)?.[1]
    const description = html.match(/<meta name="description" content="([^"]+)"/)?.[1]
    assert.ok(title && !titles.has(title), `${pathname}: missing or duplicate title`)
    assert.ok(description && !descriptions.has(description), `${pathname}: missing or duplicate description`)
    titles.add(title); descriptions.add(description)
    assert.equal([...html.matchAll(/<link rel="canonical"/g)].length, 1)
    assert.ok(html.includes(`<link rel="canonical" href="${url}"`), `${pathname}: wrong canonical`)
    assert.ok(!html.includes('noindex'), `${pathname}: public page is noindex`)
    for (const lang of ['ru', 'x-default']) assert.ok(html.includes(`hreflang="${lang}" href="${url}"`), `${pathname}: wrong language URL`)
    const scripts = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
    assert.equal(scripts.length, 1, `${pathname}: structured data must have one owner`)
    const graph = JSON.parse(scripts[0][1])['@graph']
    const page = graph.find(node => node['@id'] === url + '#page')
    assert.equal(page?.url, url)
    assert.equal(graph.filter(node => node['@type'] === 'SoftwareApplication').length, pathname === '/' ? 1 : 0)
    if (pathname !== '/') {
        const crumbs = graph.find(node => node['@type'] === 'BreadcrumbList').itemListElement
        assert.equal(crumbs.at(-1).item, url)
        assert.equal(crumbs.length, /^\/(jobs|preparation)\//.test(pathname) ? 3 : 2)
        assert.deepEqual(crumbs.map(c => c.position), crumbs.map((_, i) => i + 1))
    }
    if (pathname.startsWith('/jobs/')) {
        assert.ok(html.includes('<!--PUBLIC_JOB_CARDS-->') && html.includes('<!--PUBLIC_JOB_DATA-->'), 'Gateway vacancy placeholders lost')
        assert.ok(!html.includes('"@type":"JobPosting"'), 'Collection must not masquerade as one job')
    }
    if (pathname === '/jobs' || pathname === '/preparation') {
        assert.equal(page['@type'], 'CollectionPage')
        const list = graph.find(node => node['@type'] === 'ItemList')
        assert.ok(list.itemListElement.every(item => urls.includes(item.url)))
    }
    for (const [, asset] of html.matchAll(/(?:src|href)="(\/assets\/[^"?#]+)"/g)) await access('dist' + asset)
}
for (const filename of ['app.html', '404.html']) {
    const html = await readFile('dist/' + filename, 'utf8')
    assert.ok(html.includes('name="robots" content="noindex, follow"'), `${filename}: missing noindex`)
    assert.ok(!html.includes('rel="canonical"') && !html.includes('application/ld+json'), `${filename}: public SEO leaked into private/error shell`)
    if (filename === 'app.html') assert.ok(html.includes('<div id="root"></div>'), 'Private shell contains public SSR content')
}
assert.ok(!sitemap.includes('404') && !sitemap.includes('app.html'))
console.log(`SEO checks passed: ${urls.length} public URLs, metadata, breadcrumbs, assets, vacancy templates and noindex shells.`)
