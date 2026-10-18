import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import ts from 'typescript'
const code=ts.transpileModule(readFileSync(new URL('../src/lib/paymentNavigation.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2020}}).outputText
const {createPaymentNavigation}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'))
function fixture(fail=false){
 const target=new EventTarget(),forms=[];let resets=0,busy=true
 const doc={body:{appendChild:f=>forms.push(f)},createElement:tag=>tag==='form'?{style:{},children:[],appendChild(i){this.children.push(i)},remove(){this.removed=true},submit(){this.submitted=true;if(fail)throw Error('navigation blocked')}}:{}}
 const navigation=createPaymentNavigation(()=>{resets++;busy=false},target,doc)
 return {target,forms,navigation,get resets(){return resets},get busy(){return busy}}
}
const payment={action:'https://auth.robokassa.ru/Merchant/Index.aspx',fields:{OutSum:'1.00',InvId:'fixture'}}
test('Back restores close/payment controls without creating another payment',()=>{
 const f=fixture();f.navigation.submit(payment);assert.equal(f.busy,true);assert.equal(f.forms.length,1)
 const event=new Event('pageshow');Object.defineProperty(event,'persisted',{value:true});f.target.dispatchEvent(event)
 assert.equal(f.busy,false);assert.equal(f.resets,1);assert.equal(f.forms[0].removed,true);assert.equal(f.forms.length,1)
 f.target.dispatchEvent(event);assert.equal(f.resets,1);f.navigation.dispose()
})
test('initial pageshow does not unlock a request that has not navigated',()=>{
 const f=fixture();f.target.dispatchEvent(new Event('pageshow'));assert.equal(f.resets,0);assert.equal(f.busy,true);f.navigation.dispose()
})
test('another checkout works without retaining a hidden form',()=>{
 const f=fixture();f.navigation.submit(payment);f.target.dispatchEvent(new Event('pageshow'));f.navigation.submit({...payment,method:'GET'})
 assert.equal(f.forms.length,2);assert.equal(f.forms[0].removed,true);assert.equal(f.forms[1].method,'GET');assert.equal(f.forms[1].children[0].value,'1.00');f.navigation.dispose();assert.equal(f.forms[1].removed,true)
 f.target.dispatchEvent(new Event('pageshow'));assert.equal(f.resets,1)
})
test('blocked navigation releases busy state and propagates failure',()=>{
 const f=fixture(true);assert.throws(()=>f.navigation.submit(payment),/navigation blocked/);assert.equal(f.busy,false);assert.equal(f.forms[0].removed,true);f.navigation.dispose()
})
