import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'

const storage = () => {
    const values = new Map()
    return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key), clear: () => values.clear() }
}
globalThis.localStorage = storage()
globalThis.sessionStorage = storage()
const source = readFileSync(new URL('../src/lib/trainingIntent.ts', import.meta.url), 'utf8').replace(/^import .*$/gm, '')
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText
const { rememberSystemDesignReturn, authDestination } = await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'))

test('System Design return survives authentication and is consumed once', () => {
    localStorage.clear(); sessionStorage.clear()
    rememberSystemDesignReturn()
    assert.equal(authDestination(), '/system-design/traffic')
    assert.equal(authDestination(), '/dashboard')
})
test('expired and future-dated System Design intents do not override normal navigation', () => {
    for (const at of [Date.now() - 86400001, Date.now() + 86400000]) {
        sessionStorage.setItem('iv:system-design-return', String(at))
        assert.equal(authDestination(), '/dashboard')
    }
})
test('existing ordinary training return still works', () => {
    localStorage.setItem('iv:training-intent', 'ordinary-training')
    assert.equal(authDestination(), '/training/resume')
    localStorage.clear()
})
