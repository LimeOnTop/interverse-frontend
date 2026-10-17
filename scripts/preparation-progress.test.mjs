import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import ts from 'typescript'
const source=readFileSync(new URL('../src/lib/preparationProgress.ts',import.meta.url),'utf8')
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText
const {stepResults}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'))
const p={attempts:[{step_index:0,interview_id:'new',status:'completed'},{step_index:0,interview_id:'old',status:'completed'},{step_index:1,interview_id:'active',status:'in_progress'}]}
function report(id,score,date='2026-10-17T10:00:00Z'){return {id,interview_id:id,overall_score:score,created_at:date}}
test('80% is not a passed stage, 81% is',()=>{assert.equal(stepResults(p,0,[report('new',80)]).passed,false);assert.equal(stepResults(p,0,[report('new',81)]).passed,true)})
test('a weaker retake does not erase a passed stage',()=>{const r=stepResults(p,0,[report('new',60),report('old',95,'2026-10-16T10:00:00Z')]);assert.equal(r.best,95);assert.equal(r.passed,true);assert.equal(r.results[0].id,'new')})
test('other stage reports never affect progress',()=>{const r=stepResults(p,1,[report('old',100)]);assert.equal(r.best,null);assert.equal(r.passed,false);assert.equal(r.active.interview_id,'active')})
test('no report does not imply failure or success',()=>{const r=stepResults({attempts:[]},0,[]);assert.equal(r.best,null);assert.equal(r.active,undefined);assert.equal(r.passed,false)})
