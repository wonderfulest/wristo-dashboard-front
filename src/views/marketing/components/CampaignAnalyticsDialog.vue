<template>
  <el-dialog :model-value="visible" :title="`效果统计 - ${campaign?.name || ''}`" width="min(900px, 94vw)" @update:model-value="emit('update:visible', $event)">
    <div v-loading="loading" class="analytics-content">
      <el-alert v-if="error" :title="error" type="error" :closable="false" />
      <template v-else-if="data">
        <el-alert type="info" :closable="false" show-icon
          :title="`渠道追踪：${data.trackingEnabled ? '已启用' : '未启用'}；SES 事件回传：${data.sesEnabled ? (data.sesLastEventAt ? '已收到事件回传' : '已配置，等待事件回传') : '未配置'}`" />
        <h3>发送记录</h3>
        <el-descriptions :column="3" border>
          <el-descriptions-item label="推送总数">{{ data.total }}</el-descriptions-item>
          <el-descriptions-item label="发送成功">{{ data.sent }}</el-descriptions-item>
          <el-descriptions-item label="发送失败">{{ data.failed }}</el-descriptions-item>
          <el-descriptions-item label="待发送">{{ data.pending }}</el-descriptions-item>
          <el-descriptions-item label="发送中">{{ data.sending }}</el-descriptions-item>
          <el-descriptions-item label="已拒绝">{{ data.rejected }}</el-descriptions-item>
        </el-descriptions>
        <p class="hint">发送成功表示发送服务已接受请求，不代表收件人已收到或阅读。</p>
        <h3>邮件效果</h3>
        <p>已追踪邮件：{{ data.tracked }} / {{ data.total }}（覆盖率 {{ rate(data.tracked, data.total) }}）</p>
        <p>其中已启用 SES 事件追踪的邮件：{{ data.sesTracked }}</p>
        <el-descriptions :column="3" border>
          <el-descriptions-item label="送达人数">{{ eventCount(data.delivered) }}</el-descriptions-item>
          <el-descriptions-item label="打开人数（估算）">{{ eventCount(data.opened) }}</el-descriptions-item>
          <el-descriptions-item label="退信人数">{{ eventCount(data.bounced) }}</el-descriptions-item>
          <el-descriptions-item label="投诉人数">{{ eventCount(data.complained) }}</el-descriptions-item>
          <el-descriptions-item label="送达率">{{ eventRate(data.delivered, data.sesTracked) }}</el-descriptions-item>
          <el-descriptions-item label="打开率（估算）">{{ eventRate(data.opened, data.delivered) }}</el-descriptions-item>
        </el-descriptions>
        <p class="hint">送达率 = 送达人数 / 已启用 SES 事件追踪的邮件数；打开率 = 打开人数 / 送达人数。已追踪邮件指发送服务已记录或已有追踪事件的邮件，按推送记录去重。人数也按推送记录去重。打开事件可能受邮件客户端隐私保护或图片屏蔽影响；事件缺失可能使打开率超过 100%。SES 已配置不代表 AWS 回传已验证可用。</p>
        <h3>渠道点击</h3>
        <p>点击人数（跨渠道去重）：{{ clickCount(data.clicked) }}</p>
        <el-table :data="channels" border>
          <el-table-column prop="label" label="渠道" />
          <el-table-column label="点击次数"><template #default="{ row }">{{ clickCount(row.clicks) }}</template></el-table-column>
          <el-table-column label="去重人数"><template #default="{ row }">{{ clickCount(row.uniqueClicks) }}</template></el-table-column>
        </el-table>
        <p class="hint">渠道点击仅记录邮件追踪链接访问，不能视为扫码或关注成功。已发送且未追踪的邮件无法补回历史数据。</p>
        <p class="hint">最近事件：{{ data.lastEventAt || '暂无事件' }}</p>
      </template>
    </div>
    <template #footer>
      <el-button :loading="loading" @click="load">刷新</el-button>
      <el-button @click="emit('update:visible', false)">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { analyticsCount, analyticsRate } from './campaignAnalyticsMetrics.mjs'
import { getCampaignAnalytics, type CampaignAnalytics } from '@/api/campaign-analytics'
import type { CampaignVO } from '@/types/promotion'

const props = defineProps<{ visible: boolean; campaign: CampaignVO | null }>()
const emit = defineEmits<{ (e: 'update:visible', value: boolean): void }>()
const data = ref<CampaignAnalytics | null>(null)
const loading = ref(false)
const error = ref('')
let requestId = 0

const rate = analyticsRate
const eventCount = (count: number) => analyticsCount(count, !!data.value?.sesEnabled, data.value?.sesTracked || 0, !!data.value?.sesLastEventAt)
const eventRate = (count: number, denominator: number) => analyticsRate(count, denominator, !!data.value?.sesEnabled, !!data.value?.sesLastEventAt)
const clickCount = (count: number) => analyticsCount(count, !!data.value?.trackingEnabled, data.value?.tracked || 0)
const channels = computed(() => [
  { channel: 'miniprogram', label: '微信小程序' },
  { channel: 'xiaohongshu', label: '小红书' },
  { channel: 'wechat', label: '微信公众号' },
  { channel: 'taobao', label: '淘宝店铺' }
].map(channel => ({ ...channel, clicks: 0, uniqueClicks: 0, ...data.value?.channels.find(item => item.channel === channel.channel) })))

const load = async () => {
  const id = props.campaign?.id
  if (!props.visible || id == null) return
  const currentRequest = ++requestId
  loading.value = true
  error.value = ''
  data.value = null
  try {
    const response = await getCampaignAnalytics(id)
    if (!response.data) throw new Error('Missing analytics data')
    if (currentRequest === requestId) data.value = response.data
  } catch {
    if (currentRequest === requestId) error.value = '获取效果统计失败，请稍后重试。'
  } finally {
    if (currentRequest === requestId) loading.value = false
  }
}

watch(() => [props.visible, props.campaign?.id], () => {
  ++requestId
  if (props.visible) load()
}, { immediate: true })
</script>

<style scoped>
.analytics-content { min-height: 160px; }
h3 { margin: 24px 0 12px; }
.hint { color: var(--el-text-color-secondary); line-height: 1.6; font-size: 13px; }
</style>
