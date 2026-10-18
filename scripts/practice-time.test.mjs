import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import ts from 'typescript'
const code=ts.transpileModule(fs.readFileSync(new URL('../src/lib/practiceTime.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2020}}).outputText
const {zonedISO,localParts}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'))
test('Moscow wall clock converts independently from browser time zone',()=>assert.equal(zonedISO('2026-10-18','19:00','Europe/Moscow'),'2026-10-18T16:00:00.000Z'))
test('date boundary survives conversion',()=>assert.equal(zonedISO('2026-10-18','00:15','Europe/Moscow'),'2026-10-17T21:15:00.000Z'))
test('DST gap is rejected rather than silently shifted',()=>assert.throws(()=>zonedISO('2026-03-29','02:30','Europe/Berlin')))
test('local input matches the displayed date',()=>assert.deepEqual(localParts(new Date('2026-10-17T22:00:00Z'),'Europe/Moscow'),{day:'2026-10-18',time:'01:00'}))
