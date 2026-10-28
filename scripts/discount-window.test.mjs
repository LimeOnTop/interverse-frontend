import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import ts from 'typescript'
const source = fs.readFileSync(new URL('../src/lib/discountWindow.ts', import.meta.url), 'utf8')
const code = ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText
const {discountDeadline, discountSecondsLeft, availableOffers} = await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'))
test('30 minute offer expires at the exact deadline and hides only the discounted option', () => {
 const deadline=discountDeadline('2026-10-28T10:30:00Z','2026-10-28T10:00:00Z',100)
 assert.equal(discountSecondsLeft(deadline,100),1800)
 assert.equal(discountSecondsLeft(deadline,deadline-1),1)
 assert.equal(discountSecondsLeft(deadline,deadline),0)
 const offers=[{id:'discount',earlyBird:true},{id:'regular',earlyBird:false}]
 assert.equal(availableOffers(offers,1).length,2)
 assert.deepEqual(availableOffers(offers,0).map(o=>o.id),['regular'])
 assert.equal(discountSecondsLeft(deadline,deadline+60000),0)
})
test('refresh uses original server deadline rather than restarting 30 minutes', () => {
 const deadline=discountDeadline('2026-10-28T10:30:00Z','2026-10-28T10:29:00Z',500)
 assert.equal(discountSecondsLeft(deadline,500),60)
 assert.equal(discountSecondsLeft(discountDeadline('', '', 500),500),0)
})
