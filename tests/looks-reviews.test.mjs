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
    useRoute: () => ({ query: {} }),
    ref: value => ({ value }), onMounted() {}, onBeforeUnmount: fn => { unmount = fn },
    watch: (ref, fn) => watches.push({ ref, fn }), URL: MediaURL, AbortController,
    ElMessage: { success() {} },
    ElMessageBox: { confirm: async () => {}, prompt: async () => ({ value: '  内容违规  ' }) },
    listLookReviews: async (_, __, page) => ({ data: { items: [], hasMore: false, page } }),
    getLookReview: async (_, id) => ({ data: { ...review, id } }),
    getLookReviewMedia: async () => new Blob(['photo'], { type: 'image/jpeg' }),
    decideLookReview: async () => ({ data: true }), ...api,
  })
  vm.runInContext(`${js}\nthis.page = { publisherId, appId, decideBatch, selected, batchResult, canSelect, selectionChanged, batchCompleted, method, changeMethod, setVisibility, thumbnails, load, openDetail, decide, type, state, items, current, visible, imageUrl, videoUrl, reason, detailError, saving }`, context)
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
  assert.equal(calls.length, 1); assert.deepEqual(calls[0], ['posts', 1, false, '内容违规', undefined]); assert.equal(p.saving.value, true)
  resolveDecision({ data: false }); await pending
  assert.equal(p.visible.value, true); assert.ok(p.detailError.value); assert.equal(p.saving.value, false)
})


test('list loads private thumbnails only and releases them on reload', async () => {
  const calls = []
  const { p, created, revoked } = setup({
    listLookReviews: async () => ({ data: { items: [{ ...review, media_type: 'video' }], page: 1, hasMore: false } }),
    getLookReviewMedia: async (id, thumbnail) => { calls.push({ id, thumbnail }); return new Blob(['cover']) },
  })
  await p.load(); await new Promise(resolve => setImmediate(resolve))
  assert.deepEqual(calls, [{ id: review.media_id, thumbnail: true }])
  assert.equal(p.thumbnails.value[1].url, created[0].url)
  p.type.value = 'comments'; await p.load()
  assert.deepEqual(revoked, [created[0].url]); assert.equal(calls.length, 1)
})

test('late thumbnail downloads cannot populate a new list', async () => {
  let resolveMedia, signal
  const { p, created } = setup({
    listLookReviews: async () => ({ data: { items: [review], page: 1, hasMore: false } }),
    getLookReviewMedia: (_, __, s) => { signal = s; return new Promise(resolve => { resolveMedia = resolve }) },
  })
  await p.load(); p.type.value = 'comments'; await p.load()
  assert.equal(signal.aborted, true)
  resolveMedia(new Blob(['late'])); await new Promise(resolve => setImmediate(resolve))
  assert.equal(created.length, 0); assert.equal(Object.keys(p.thumbnails.value).length, 0)
})

test('selecting automatic review leaves the pending queue and preserves the filter after hiding', async () => {
  const requests = [], changes = []
  const { p } = setup({
    listLookReviews: async (...args) => { requests.push(args); return { data: { items: [], hasMore: false, page: 1 } } },
    changeLookVisibility: async (...args) => { changes.push(args); return { data: true } },
  })
  p.method.value = 'auto'
  p.changeMethod()
  p.current.value = { ...review, state: 'visible' }
  await p.setVisibility('unlisted')
  assert.deepEqual(requests, Array(2).fill(['posts', 'all', 1, 'auto', undefined, undefined]))
  assert.deepEqual(changes, [['posts', 1, 'visible', 'unlisted']])
})


test('batch preserves versions, continues after failures and clears selection', async () => {
  const calls = []
  const { p } = setup({ decideLookReview: async (...args) => {
    calls.push(args)
    if (args[1] === 2) throw new Error('conflict')
    return { data: args[1] !== 3 }
  } })
  p.selected.value = [1, 2, 3, 4].map(id => ({ ...review, id, submission_version: `v${id}` }))
  await p.decideBatch(true)
  assert.deepEqual(calls, [1, 2, 3, 4].map(id => ['posts', id, true, '', `v${id}`]))
  assert.equal(p.batchResult.value.succeeded, 2)
  assert.deepEqual(Array.from(p.batchResult.value.failed), [2, 3])
  assert.equal(p.selected.value.length, 0)
  assert.equal(p.saving.value, false)
})

test('batch rejection uses a trimmed shared reason for comments', async () => {
  const calls = []
  const { p } = setup({ decideLookReview: async (...args) => { calls.push(args); return { data: true } } })
  p.type.value = 'comments'
  p.selected.value = [review, { ...review, id: 2 }]
  await p.decideBatch(false)
  assert.deepEqual(calls, [1, 2].map(id => ['comments', id, false, '内容违规', undefined]))
})

test('cancelled batch keeps selection and sends no decisions', async () => {
  let calls = 0
  const { p } = setup({ ElMessageBox: { confirm: async () => { throw new Error('cancel') } }, decideLookReview: async () => { calls++ } })
  p.selected.value = [review]
  await p.decideBatch(true)
  assert.equal(calls, 0)
  assert.equal(p.selected.value.length, 1)
  assert.equal(p.saving.value, false)
})

test('batch prevents duplicate execution and missing post versions fail safely', async () => {
  let resolveDecision, calls = 0
  const { p } = setup({ decideLookReview: () => { calls++; return new Promise(resolve => { resolveDecision = resolve }) } })
  p.selected.value = [{ ...review, submission_version: 'v1' }, { ...review, id: 2 }]
  const pending = p.decideBatch(true)
  await new Promise(resolve => setImmediate(resolve))
  await p.decideBatch(true)
  assert.equal(calls, 1)
  assert.equal(p.canSelect(review), false)
  resolveDecision({ data: true }); await pending
  assert.deepEqual(Array.from(p.batchResult.value.failed), [2])
})

test('selection excludes reviewed items and clears on list changes', async () => {
  const { p } = setup()
  assert.equal(p.canSelect({ ...review, state: 'visible' }), false)
  p.selectionChanged([review, { ...review, id: 2, state: 'visible' }])
  assert.equal(p.selected.value.length, 1)
  await p.load(2)
  assert.equal(p.selected.value.length, 0)
})


test('publisher and app filters survive review refresh and can be cleared', async () => {
  const requests = []
  const { p } = setup({ listLookReviews: async (...args) => { requests.push(args); return { data: { items: [], hasMore: false, page: args[2] } } } })
  p.publisherId.value = 42; p.appId.value = 101
  p.selected.value = [{ ...review, submission_version: 'v1' }]
  await p.decideBatch(true)
  assert.deepEqual(requests[0], ['posts', 'pending', 1, 'all', 42, 101])
  assert.equal(p.selected.value.length, 0)
  p.type.value = 'comments'; await p.load(2)
  assert.deepEqual(requests[1], ['comments', 'pending', 2, 'all', 42, 101])
  p.publisherId.value = undefined; p.appId.value = undefined; await p.load(1)
  assert.deepEqual(requests[2], ['comments', 'pending', 1, 'all', undefined, undefined])
})


test('dashboard comments link initializes the pending comments queue', async () => {
  const calls = []
  const { p } = setup({ useRoute: () => ({ query: { type: 'comments', state: 'pending' } }), listLookReviews: async (...args) => { calls.push(args); return { data: { items: [], hasMore: false, page: 1 } } } })
  await p.load()
  assert.deepEqual(calls, [['comments', 'pending', 1, 'all', undefined, undefined]])
})
