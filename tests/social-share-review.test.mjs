import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import ts from 'typescript'
const source = fs.readFileSync(new URL('../src/views/ops/SocialShareReview.vue', import.meta.url), 'utf8').match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1].replace(/^import .*$/gm, '')
const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText
function setup(overrides = {}) {
 const calls = []
 const context = { ref: value => ({ value }), onMounted() {}, ElMessage: { success() {} }, ElMessageBox: { confirm: async () => {}, prompt: async () => ({ value: ' Missing evidence ' }) }, socialRewardsApi: { review: async (...args) => { calls.push(args); return { code: 0, data: {} } }, list: async () => ({ code: 0, data: { items: [], total: 0 } }) }, ...overrides }
 const state = new Function(...Object.keys(context), `${code}; return { review, reviewing, settings, error };`)(...Object.values(context))
 state.settings.value = { enabled: true, credits: 50, monthlyLimit: 4 }
 return { ...state, calls }
}
test('review sends the displayed revision and trimmed rejection reason', async () => { const state = setup(); await state.review({ id: '9', revision: 3, status: 'PENDING', credits: 50 }, false); assert.deepEqual(state.calls, [['9', false, 'Missing evidence', 3]]) })
test('approval confirmation uses submission snapshot amount', async () => { let message = ''; const state = setup({ ElMessageBox: { confirm: async value => { message = value } } }); await state.review({ id: '9', revision: 3, status: 'PENDING', credits: 20 }, true); assert.match(message, /20 积分/); assert.deepEqual(state.calls, [['9', true, '', 3]]) })
test('a pending confirmation locks duplicate actions and cancellation releases the lock', async () => { let cancel; const state = setup({ ElMessageBox: { confirm: () => new Promise((_, reject) => { cancel = reject }) } }); const item = { id: '9', revision: 1, status: 'PENDING', credits: 50 }; const pending = state.review(item, true); assert.equal(state.reviewing.value, true); await state.review(item, false); assert.deepEqual(state.calls, []); cancel('cancel'); await pending; assert.equal(state.reviewing.value, false) })
