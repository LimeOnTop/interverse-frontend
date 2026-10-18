import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const origin = process.argv[2] || 'https://inter-verse.ru'
const paths = [...(await readFile('dist/sitemap.xml', 'utf8')).matchAll(/<loc>https:\/\/inter-verse\.ru([^<]+)<\/loc>/g)].map(m => m[1])
const request = (path, options = {}) => fetch(origin + path, { redirect: 'manual', signal: AbortSignal.timeout(20000), ...options })
let cards = 0
for (let offset = 0; offset < paths.length; offset += 4) {
    await Promise.all(paths.slice(offset, offset + 4).map(async path => {
        const response = await request(path)
        assert.equal(response.status, 200, path)
        const html = await response.text()
        const expected = await readFile(path === '/' ? 'dist/index.html' : `dist${path}/index.html`, 'utf8')
        assert.equal(html.match(/<title>([^<]+)<\/title>/)?.[1], expected.match(/<title>([^<]+)<\/title>/)?.[1], path + ': old metadata deployed')
        assert.ok(html.includes(`rel="canonical" href="https://inter-verse.ru${path}"`), path + ': canonical')
        assert.equal([...html.matchAll(/<h1(?:\s|>)/g)].length, 1, path + ': H1')
        assert.ok(!html.includes('noindex'), path + ': unexpectedly noindex')
        assert.equal([...html.matchAll(/type="application\/ld\+json"/g)].length, 1, path + ': duplicate structured data')
        if (path.startsWith('/jobs/')) {
            assert.ok(!html.includes('<!--PUBLIC_JOB_CARDS-->') && !html.includes('<!--PUBLIC_JOB_DATA-->'), path + ': gateway template not rendered')
            assert.ok(html.includes('id="public-jobs-data"'), path + ': missing vacancy data')
            cards += [...html.matchAll(/<article class="public-job">/g)].length
        }
    }))
}
for (const path of ['/index.html', '/jobs/', '/jobs/python/', '/preparation/qa/', '/jobs/python/index.html', '/preparation/qa/index.html']) {
    const response = await request(path + '?utm_source=seo-check')
    assert.equal(response.status, 301, path + ': redirect status')
    const location = new URL(response.headers.get('location'), origin)
    const expected = path === '/index.html' ? '/' : path.replace(/\/index\.html$/, '').replace(/\/$/, '')
    assert.equal(location.pathname, expected, path + ': redirect target')
    assert.equal(location.searchParams.get('utm_source'), 'seo-check', path + ': query lost')
}
for (const path of ['/jobs/python', '/jobs/java', '/jobs/react', '/jobs/frontend']) {
    assert.equal((await request(path, { method: 'HEAD' })).status, 200, path + ': HEAD fails')
}
for (const path of ['/seo-test-missing', '/jobs/not-a-track', '/preparation/not-a-track', '/design-review.html', '/practice-reminder-review.html', '/report-preview-mobile.html', '/vacancy-path-review.html', '/app.html', '/.vite/manifest.json', '/404.html']) {
    const response = await request(path)
    assert.equal(response.status, 404, path + ': should not be publicly indexable')
    assert.ok(response.headers.get('x-robots-tag')?.includes('noindex'), path + ': missing error noindex')
}
for (const path of ['/login', '/register', '/dashboard', '/training/resume', '/metrics-login']) {
    const response = await request(path)
    assert.equal(response.status, 200, path)
    assert.ok(response.headers.get('x-robots-tag')?.includes('noindex'), path + ': missing HTTP noindex')
    assert.ok((await response.text()).includes('name="robots" content="noindex, follow"'), path + ': missing HTML noindex')
}
assert.equal((await request('/sitemap.xml')).status, 200)
assert.equal((await request('/robots.txt')).status, 200)
const home = await (await request('/')).text()
const entry = home.match(/<script type="module" crossorigin src="([^"]+)"/)?.[1]
assert.ok(entry, 'Missing entry module')
const asset = await request(entry)
assert.equal(asset.status, 200)
assert.ok(asset.headers.get('cache-control')?.includes('immutable'))
console.log(`Live SEO passed: ${paths.length} public pages; ${cards} server-rendered job cards; redirects, HEAD, 404, noindex and assets verified.`)
