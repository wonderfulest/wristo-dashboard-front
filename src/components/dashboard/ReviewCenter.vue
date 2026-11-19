<template>
  <section class="review-center" aria-labelledby="review-center-title" :aria-busy="loading">
    <header class="review-heading">
      <div><h2 id="review-center-title">审核中心</h2><p aria-live="polite">{{ summary }}</p></div>
      <el-button :loading="loading" @click="refresh">刷新待审核</el-button>
    </header>
    <div class="review-grid">
      <router-link v-for="item in items" :key="item.key" :to="item.path" class="review-card" :class="{ pending: !loading && (item.count ?? 0) > 0, failed: item.error && !loading }">
        <span class="review-label">{{ item.label }}</span>
        <strong>{{ loading ? '…' : item.error ? '加载失败' : item.count === null ? '—' : item.count.toLocaleString() }}</strong>
        <span class="review-note">{{ item.note }}</span>
        <span class="review-action">{{ item.error && !loading ? '进入查看' : '进入审核' }} <span aria-hidden="true">→</span></span>
      </router-link>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { fetchReviewCounts } from '@/api/review-center'
import { reviewCategories, type ReviewCount, type ReviewKey } from './reviewCenter.mjs'

const loading = ref(true)
const counts = ref<Partial<Record<ReviewKey, ReviewCount>>>({})
const items = computed(() => reviewCategories.map(item => ({ ...item, count: counts.value[item.key]?.count ?? null, error: counts.value[item.key]?.error ?? false })))
const summary = computed(() => {
  if (loading.value) return '正在获取待审核内容…'
  const total = items.value.reduce((sum, item) => sum + (item.count ?? 0), 0)
  if (items.value.some(item => item.error)) return `已获取 ${total.toLocaleString()} 项待处理，部分分类加载失败，请刷新或进入查看。`
  return total > 0 ? `共 ${total.toLocaleString()} 项待处理，点击下方分类进入审核。` : '暂无待审核内容。'
})
let inFlight = false
let disposed = false
async function refresh() {
  if (inFlight || disposed) return
  inFlight = true
  loading.value = true
  try {
    const result = await fetchReviewCounts()
    if (!disposed) counts.value = result
  } finally {
    inFlight = false
    if (!disposed) loading.value = false
  }
}
onMounted(() => { void refresh(); window.addEventListener('focus', refresh) })
onBeforeUnmount(() => { disposed = true; window.removeEventListener('focus', refresh) })
</script>

<style scoped>
.review-center { margin-bottom: 20px; padding: 20px; border: 1px solid #dce7e0; border-radius: 13px; background: #f6f9f7; }
.review-heading { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 16px; }
h2 { margin: 0; color: #1d3027; font-size: 20px; }
p { margin: 6px 0 0; color: #60736a; font-size: 13px; line-height: 1.6; }
.review-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; }
.review-card { display: flex; flex-direction: column; gap: 9px; padding: 16px; border: 1px solid #e0e8e4; border-radius: 10px; background: #fff; color: #52635b; text-decoration: none; }
.review-card:hover, .review-card:focus-visible { border-color: #169260; box-shadow: 0 4px 14px #23443414; }
.review-card:focus-visible { outline: 2px solid #169260; outline-offset: 2px; }
.review-label { font-size: 13px; font-weight: 600; }
strong { color: #718077; font-size: 27px; font-variant-numeric: tabular-nums; }
.review-note { font-size: 12px; color: #849188; line-height: 1.5; }
.review-action { margin-top: auto; padding-top: 7px; display: flex; justify-content: space-between; font-size: 13px; color: #168356; }
.pending { background: #edf8f1; border-color: #a9d9bd; }.pending strong { color: #12804e; }
.failed strong { color: #b65d28; font-size: 20px; }
@media (max-width: 1100px) { .review-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
@media (max-width: 700px) { .review-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }.review-center { padding: 14px; }.review-heading { align-items: flex-start; } }
@media (max-width: 380px) { .review-grid { grid-template-columns: 1fr; } }
</style>
