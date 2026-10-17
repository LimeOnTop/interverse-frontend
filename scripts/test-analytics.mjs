import {readFile} from 'node:fs/promises'
import ts from 'typescript'
import assert from 'node:assert/strict'
const memory=new Map();globalThis.localStorage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)}
const calls=[];globalThis.window={location:{hostname:'inter-verse.ru'},ym:(...args)=>calls.push(args)}
const source=await readFile('src/lib/analytics.ts','utf8')
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2020}}).outputText
const a=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'))
a.registrationComplete('test');a.registrationComplete('test');assert.equal(calls.length,1)
for(const [i,plan] of a.PAYMENT_PLANS.entries()){
 const id=100+i;a.checkoutStarted(id,plan,'owner');const count=calls.length
 a.confirmPurchases([],'owner');assert.equal(calls.length,count,'pending is not paid')
 a.confirmPurchases([{id,plan,amount:'390.00',duration_days:30}],'other');assert.equal(calls.length,count,'owner isolation')
 a.confirmPurchases([{id,plan:'pro_track',amount:'390.00',duration_days:30}],'owner');assert.equal(calls.length,count,'mismatched product')
 a.confirmPurchases([{id,plan,amount:'390.00',duration_days:30}],'owner');assert.equal(calls.length,count+2)
 a.confirmPurchases([{id,plan,amount:'390.00',duration_days:30}],'owner');assert.equal(calls.length,count+2,'no duplicate payment')
}
a.checkoutStarted(200,'pro_track','owner');assert.ok(!a.pendingPurchases().some(p=>p.id===200))
a.checkoutStarted(201,'paid_1m','owner');delete window.ym
a.confirmPurchases([{id:201,plan:'paid_1m',amount:'390.00',duration_days:30}],'owner');assert.ok(a.pendingPurchases().some(p=>p.id===201),'retry if analytics unavailable')
window.ym=(...args)=>calls.push(args);window.location.hostname='localhost';const count=calls.length;a.registrationComplete('local');assert.equal(calls.length,count)
assert.ok(!JSON.stringify(calls).includes('owner'),'no private account IDs transmitted')
console.log('PASS: registration dedup; four paid plans; pending/mismatched/foreign receipts; Pro Track exclusion; unavailable analytics; production-only; no account IDs in events')
