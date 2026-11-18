import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

const source = readFileSync(new URL('../src/views/looks/LooksReviews.vue', import.meta.url), 'utf8')
const script = source.match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1].replace(/^import .*$/gm, '')
const js = ts.transpileModule(script, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText
const review = { id: 1, user_id: 2, state: 'pending', media_id: 'uuid-media-1', media_type: 'image' }
function setup(api = {}) {
  const watches = [], revoked = [], created = []
  let unmount
  class MediaURL extends URL {
    static createObjectURL(blob) { const url = `blob:preview-${created.length}`; created.push({ blob, url }); return url }
    static revokeObjectURL(url) { revoked.push(url) }
  }
  const context = vm.createContext({
    ref: value => ({ value }), onMounted() {}, onBeforeUnmount: fn => { unmount = fn },
    watch: (ref, fn) => watches.push({ ref, fn }), URL: MediaURL, AbortController,
    ElMessage: { success() {} },
    listLookReviews: async (_, __, page) => ({ data: { items: [], hasMore: false, page } }),
    getLookReview: async (_, id) => ({ data: { ...review, id } }),
    getLookReviewMedia: async () => new Blob(['photo'], { type: 'image/jpeg' }),
    decideLookReview: async () => ({ data: true }), ...api,
  })
  vm.runInContext(`${js}\nthis.page = { load, openDetail, decide, type, state, items, current, visible, imageUrl, videoUrl, reason, detailError, saving }`, context)
  return { p: context.page, created, revoked, unmount: () => unmount(), close: () => watches.forEach(({ ref, fn }) => { if (ref === context.page.visible) fn(false) }) }
}

test('late filtered list responses cannot replace the latest queue', async () => {
  const resolves = []
  const { p } = setup({ listLookReviews: () => new Promise(resolve => resolves.push(resolve)) })
  const first = p.load(1); p.state.value = 'rejected'; const second = p.load(1)
  resolves[1]({ data: { items: [{ id: 2 }], page: 1, hasMore: false } }); await second
  resolves[0]({ data: { items: [{ id: 1 }], page: 1, hasMore: true } }); await first
  assert.equal(p.items.value[0].id, 2)
})

test('closing during private media download cancels it and ignores its late bytes', async () => {
  let resolveMedia, signal, requestedId
  const { p, close, created } = setup({ getLookReviewMedia: (id, _, s) => {
    requestedId = id; signal = s; return new Promise(resolve => { resolveMedia = resolve })
  } })
  const pending = p.openDetail(review); await new Promise(resolve => setImmediate(resolve))
  assert.equal(requestedId, 'uuid-media-1')
  close(); assert.equal(signal.aborted, true)
  resolveMedia(new Blob(['late'])); await pending
  assert.equal(created.length, 0); assert.equal(p.current.value, null); assert.equal(p.imageUrl.value, '')
})

test('private preview URLs are revoked when selecting another item and on unmount', async () => {
  const { p, created, revoked, unmount } = setup()
  await p.openDetail(review); assert.equal(p.imageUrl.value, created[0].url)
  await p.openDetail({ ...review, id: 2 }); assert.deepEqual(revoked, [created[0].url])
  unmount(); assert.deepEqual(revoked, created.map(item => item.url))
})

test('reject requires a bounded reason and only one in-flight decision is sent', async () => {
  let resolveDecision
  const calls = []
  const { p } = setup({ decideLookReview: (...args) => { calls.push(args); return new Promise(resolve => { resolveDecision = resolve }) } })
  await p.openDetail(review)
  p.reason.value = '  '; await p.decide(false); assert.equal(calls.length, 0)
  p.reason.value = 'x'.repeat(501); await p.decide(false); assert.equal(calls.length, 0)
  p.reason.value = '  内容违规  '; const pending = p.decide(false); await p.decide(true)
  assert.equal(calls.length, 1); assert.deepEqual(calls[0], ['posts', 1, false, '内容违规']); assert.equal(p.saving.value, true)
  resolveDecision({ data: false }); await pending
  assert.equal(p.visible.value, true); assert.ok(p.detailError.value); assert.equal(p.saving.value, false)
})
