import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import ts from 'typescript'
const code=ts.transpileModule(readFileSync(new URL('../src/lib/reportComparison.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2020}}).outputText
const {previousComparableReport,reportComparisonKey}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'))
const report=(tech,score,extra={})=>({id:tech+score,technologies:[tech],overall_score:score,theory_total:10,task_total:0,interview:{level:'junior',specialization:'backend'},...extra})
test('different technologies never produce a progress comparison',()=>assert.equal(previousComparableReport([report('Docker',60),report('Python',20)]),undefined))
test('find an earlier comparable report, skipping a different stack',()=>{const previous=report('Python',10);assert.equal(previousComparableReport([report('Python',90),report('Docker',60),previous]),previous)})
test('level, task coverage and question count must also match',()=>{const current=report('Python',90);for(const extra of [{interview:{level:'senior',specialization:'backend'}},{task_total:3},{theory_total:8}])assert.equal(previousComparableReport([current,report('Python',20,extra)]),undefined)})
test('technology order and capitalization are immaterial, missing context is incomparable',()=>{assert.equal(reportComparisonKey(report('Python',10,{technologies:[' SQL ','PYTHON']})),reportComparisonKey(report('Python',90,{technologies:['python','sql']})));assert.equal(reportComparisonKey(report('Python',10,{technologies:[]})),null)})
