import test from 'node:test'
import assert from 'node:assert/strict'
import {build} from 'esbuild'
import {mkdtemp,writeFile} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {pathToFileURL} from 'node:url'
import path from 'node:path'
import vm from 'node:vm'
import {execFileSync} from 'node:child_process'
const bundle=await build({entryPoints:['src/features/system-design/boardReveal.ts'],bundle:true,format:'esm',platform:'node',write:false,plugins:[{name:'fake-core',setup(b){b.onResolve({filter:/^ascii-reveal\/core$/},a=>({path:a.path,namespace:'fake'}));b.onLoad({filter:/.*/,namespace:'fake'},()=>({contents:'export const createAsciiReveal=(...a)=>globalThis.animateBoard(...a)',loader:'js'}))}}]})
const dir=await mkdtemp(path.join(tmpdir(),'sd-dom-reveal-'));const file=path.join(dir,'reveal.mjs');await writeFile(file,bundle.outputFiles[0].text);const {createBoardReveal}=await import(pathToFileURL(file))
test('uses the production surface and per-character Dither instead of a canvas snapshot',async()=>{
 let options,called=false
 globalThis.animateBoard=(_root,o)=>{options=o;return {reveal:async()=>{called=true},hide:async()=>{},destroy(){}}}
 const root={dataset:{sdRevealPreparing:'true'}};await createBoardReveal(root).reveal()
 assert.equal(called,true);assert.equal(options.preset,'dither');assert.equal(options.speed,.7);assert.equal(options.surfaces,'.sd-board-section');assert.equal(options.fades,'.sd-toolbar');assert.equal(options.media,undefined);assert.equal(root.dataset.sdRevealPhase,'ready');assert.equal(root.dataset.sdRevealPreparing,undefined)
})
test('destroy prevents a late completion changing a newer transition',async()=>{
 let finish;globalThis.animateBoard=()=>({reveal:()=>new Promise(r=>finish=r),destroy(){finish()}})
 const root={dataset:{}};const ctrl=createBoardReveal(root);const running=ctrl.reveal();ctrl.destroy();root.dataset.sdRevealPhase='preparing';await running;assert.equal(root.dataset.sdRevealPhase,'preparing')
})
const patched=execFileSync('tar',['-xOf','vendor/ascii-reveal-0.3.0-interverse.1.tgz','package/dist/core.js'],{encoding:'utf8'})
const helper=patched.slice(patched.lastIndexOf('function __arScaledFontSize'))
function font(node,size){return vm.runInNewContext(helper+';__arScaledFontSize(node,size)',{node,size,getComputedStyle:el=>({transform:el.transform}),DOMMatrixReadOnly:class{constructor(text){const [a,b]=text.match(/matrix\(([^)]+)\)/)[1].split(',').map(Number);this.a=a;this.b=b}}})}
test('canvas text uses nested viewport scale while translations leave its size unchanged',()=>{
 const viewport={transform:'matrix(0.5,0,0,0.5,22,140)',parentElement:null}
 const node={transform:'matrix(1,0,0,1,120,30)',parentElement:viewport}
 assert.equal(font({parentElement:node},'14px'),'7px')
 viewport.transform='matrix(0.8,0,0,0.8,22,140)';assert.equal(font({parentElement:node},'14px'),'11.200000000000001px')
})
test('untransformed dashboard text keeps the original font size',()=>{
 assert.equal(font({parentElement:{transform:'none',parentElement:null}},'14px'),'14px')
})
