<template>
  <section class="inbox-section">
    <div class="section-heading"><div><span>ATTENTION</span><h2>待办与异常</h2></div><el-button link :loading="loading" @click="fetchCounts">刷新</el-button></div>
    <div class="inbox-grid">
      <button v-for="item in items" :key="item.path" class="inbox-card" :class="{ danger: item.danger && item.value > 0 }" @click="router.push(item.path)">
        <div><strong>{{ item.error ? '!' : item.value }}</strong><span>{{ item.label }}</span></div>
        <small>{{ item.error || item.note }}</small>
        <span class="arrow">→</span>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { fetchDesignReviewPage } from '@/api/design-review'
import { fetchTicketPage } from '@/api/ticket'
import { getProductPackagingDeadQueue, getProductPackagingQueue } from '@/api/products'

const router = useRouter()
const loading = ref(false)
const state = reactive({ review: 0, queue: 0, dead: 0, tickets: 0, errors: {} as Record<string, string> })
const definitions = [
  { key: 'review', label: '待审核设计', note: '进入设计审核', path: '/packaging/design-review', danger: false },
  { key: 'queue', label: '打包队列', note: '查看等待与执行任务', path: '/packaging/packaging-queue', danger: false },
  { key: 'dead', label: '死信任务', note: '需要检查或重新提交', path: '/packaging/packaging-dead-queue', danger: true },
  { key: 'tickets', label: '待处理工单', note: 'Open 与 Resolved 工单', path: '/tickets', danger: true },
] as const
const items = computed(() => definitions.map(item => ({ ...item, value: state[item.key], error: state.errors[item.key] })))

const settle = async (key: keyof typeof state, task: Promise<number>) => {
  try { (state[key] as number) = await task } catch { state.errors[key as string] = '加载失败，点击进入查看' }
}

const fetchCounts = async () => {
  loading.value = true
  state.errors = {}
  await Promise.all([
    settle('review', fetchDesignReviewPage({ pageNum: 1, pageSize: 1, designStatus: 'submitted' }).then(r => Number(r.data?.total) || 0)),
    settle('queue', getProductPackagingQueue('*').then(r => r.data?.length || 0)),
    settle('dead', getProductPackagingDeadQueue('*').then(r => r.data?.length || 0)),
    settle('tickets', fetchTicketPage({ pageNum: 1, pageSize: 1, statuses: ['open', 'resolved'] }).then(r => Number(r.data?.total) || 0)),
  ])
  loading.value = false
}

fetchCounts()
</script>

<style scoped>
.inbox-section { margin-top: 18px; }
.section-heading { display: flex; align-items: end; justify-content: space-between; margin-bottom: 10px; }
.section-heading span { color: #809088; font-size: 10px; font-weight: 800; letter-spacing: .14em; }
h2 { margin: 2px 0 0; color: #1d3027; font-size: 18px; }
.inbox-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.inbox-card { position: relative; min-height: 92px; padding: 15px 42px 15px 16px; text-align: left; border: 1px solid #e0e8e4; border-radius: 13px; background: #fff; color: #25372e; cursor: pointer; transition: transform .18s ease, box-shadow .18s ease; }
.inbox-card:hover { transform: translateY(-2px); box-shadow: 0 10px 24px rgba(35, 68, 52, .09); }
.inbox-card div { display: flex; align-items: baseline; gap: 9px; }
.inbox-card strong { font-size: 23px; font-variant-numeric: tabular-nums; }.inbox-card div span { color: #52635b; font-size: 13px; font-weight: 700; }
.inbox-card small { display: block; margin-top: 7px; color: #929d97; }.inbox-card .arrow { position: absolute; right: 16px; top: 34px; color: #169260; font-size: 20px; }
.inbox-card.danger { border-color: #f0c7c2; background: #fff9f8; }.inbox-card.danger strong, .inbox-card.danger .arrow { color: #c64f43; }
@media (max-width: 900px) { .inbox-grid { grid-template-columns: repeat(2, 1fr); } } @media (max-width: 520px) { .inbox-grid { grid-template-columns: 1fr; } }
</style>
