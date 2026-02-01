<template>
  <div class="utms-url-editor">
    <el-form label-width="90px" class="utms-form" :model="state">
      <el-form-item label="基础链接" required>
        <el-input
          v-model="state.basePath"
          placeholder="例如：landing 或 landing/eu261"
          @change="emitUrl"
        >
          <template #prepend>
            <span>https://www.wristo.io/</span>
          </template>
          <template #append>
            <el-button type="primary" @click="emitUrl">应用</el-button>
          </template>
        </el-input>
      </el-form-item>

      <div class="utms-row">
        <el-form-item label="utm_source" required>
          <el-select v-model="state.utm_source" placeholder="流量平台" clearable @change="emitUrl">
            <el-option v-for="opt in sourceOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="utm_medium" required>
          <el-select v-model="state.utm_medium" placeholder="触达方式" clearable @change="emitUrl">
            <el-option v-for="opt in mediumOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
      </div>

      <div class="utms-row">
        <el-form-item label="utm_campaign" required>
          <el-select
            v-model="state.utm_campaign"
            placeholder="投放批次/主题"
            filterable
            allow-create
            default-first-option
            @change="onCampaignChange"
          >
            <el-option v-for="opt in campaignOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="utm_content">
          <el-select v-model="state.utm_content" placeholder="创意/话术" clearable filterable @change="emitUrl">
            <el-option v-for="opt in contentOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
      </div>

      <div class="utms-row">
        <el-form-item label="utm_term">
          <el-select
            v-model="state.utm_term"
            placeholder="目标人群（可自定义）"
            filterable
            allow-create
            default-first-option
            @change="emitUrl"
          >
            <el-option v-for="opt in termOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
      </div>

      <el-form-item label="预览">
        <el-input :model-value="fullUrl" readonly>
          <template #append>
            <el-button type="primary" @click="copyUrl">复制</el-button>
          </template>
        </el-input>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const state = reactive({
  basePath: '',
  utm_source: '',
  utm_medium: '',
  utm_campaign: '',
  utm_content: '',
  utm_term: '',
})

const BASE_PREFIX = 'https://www.wristo.io/'

const sourceOptions = [
  { label: 'YouTube', value: 'youtube' },
  { label: 'TikTok', value: 'tiktok' },
  { label: 'Instagram', value: 'instagram' },
  { label: 'Facebook', value: 'facebook' },
  { label: 'X', value: 'x' },
  { label: 'Reddit', value: 'reddit' },
  { label: 'Pinterest', value: 'pinterest' },
  { label: 'Google Maps', value: 'google_maps' },
  { label: 'Google Search', value: 'google' },
  { label: 'Bing', value: 'bing' },
  { label: 'Email', value: 'email' },
  { label: '官网', value: 'website' },
  { label: 'App Store', value: 'app_store' },
  { label: 'Google Play', value: 'google_play' },
  { label: 'Garmin Connect IQ', value: 'garmin_connect_iq' },
  { label: 'LinkedIn', value: 'linkedin' },
  { label: 'WhatsApp', value: 'whatsapp' },
  { label: 'Telegram', value: 'telegram' },
  { label: 'Discord', value: 'discord' },
  { label: 'Partner', value: 'partner' },
]

const mediumOptions = [
  { label: 'Shorts 短视频', value: 'shorts' },
  { label: '长视频', value: 'long_video' },
  { label: '主页链接', value: 'bio' },
  { label: '帖子', value: 'post' },
  { label: '故事/快拍', value: 'story' },
  { label: '直播', value: 'live' },
  { label: '付费广告（CPC）', value: 'cpc' },
  { label: '付费广告（CPM）', value: 'cpm' },
  { label: '冷邮件', value: 'outreach' },
  { label: '邮件回复', value: 'reply' },
  { label: '私信', value: 'dm' },
  { label: '联盟/分销', value: 'affiliate' },
  { label: '推荐/转介绍', value: 'referral' },
  { label: '自然流量', value: 'organic' },
  { label: 'Banner', value: 'banner' },
  { label: '页脚', value: 'footer' },
  { label: '导航栏', value: 'nav' },
  { label: '弹窗', value: 'popup' },
  { label: '二维码（QR）', value: 'qr' },
]

const campaignOptions = [
  { label: '表盘上新（Launch）', value: 'wristo_watchface_launch' },
  { label: '新品推荐（New & Trending）', value: 'wristo_new_trending' },
  { label: '限时折扣（Promo）', value: 'wristo_watchface_promo' },
  { label: '节日活动（Holiday）', value: 'wristo_watchface_holiday' },
  { label: '创作者合作（Creator）', value: 'wristo_creator_collab' },
  { label: 'ASO/商店导流（Store）', value: 'wristo_store_push' },
  { label: '合集页导流（Collection）', value: 'wristo_watchface_collection' },
  { label: '评测内容（Review）', value: 'wristo_watchface_review' },
  { label: 'UGC 征集（UGC）', value: 'wristo_watchface_ugc' },
  { label: '功能专题：可定制（Feature）', value: 'wristo_feature_customization' },
  { label: '功能专题：信息密度（Feature）', value: 'wristo_feature_data_rich' },
  { label: '功能专题：续航（Feature）', value: 'wristo_feature_battery' },
]

const contentOptions = [
  { label: '功能演示（Demo）', value: 'demo' },
  { label: '上手教程（How-to）', value: 'how_to' },
  { label: '对比展示（Before/After）', value: 'before_after' },
  { label: '开箱/安装（Install）', value: 'install' },
  { label: '使用场景（Scenario）', value: 'scenario' },
  { label: '模板合集（Compilation）', value: 'compilation' },
  { label: '卖点：可定制（Customization）', value: 'feature_customization' },
  { label: '卖点：信息密度（Data-rich）', value: 'feature_data_rich' },
  { label: '卖点：续航友好（Battery）', value: 'feature_battery' },
  { label: '卖点：极简（Minimal）', value: 'feature_minimal' },
  { label: '卖点：拟物/指针（Analog）', value: 'feature_analog' },
  { label: '卖点：数字风（Digital）', value: 'feature_digital' },
  { label: '用户口碑（Testimonial）', value: 'testimonial' },
  { label: '优惠信息（Discount）', value: 'discount' },
  { label: '对比竞品（Comparison）', value: 'comparison' },
  { label: 'FAQ/疑问解答（FAQ）', value: 'faq' },
]

const termOptions = [
  { label: '跑步人群', value: 'runner' },
  { label: '骑行人群', value: 'cyclist' },
  { label: '徒步/登山', value: 'hiker' },
  { label: '通勤/职场', value: 'commuter' },
  { label: '学生党', value: 'student' },
  { label: 'Garmin 用户', value: 'garmin_users' },
  { label: 'Apple Watch 用户', value: 'apple_watch_users' },
  { label: '健身/力量训练', value: 'fitness' },
  { label: '日常/生活方式', value: 'lifestyle' },
  { label: '数据控', value: 'data_geek' },
  { label: '极简风偏好', value: 'minimal_lovers' },
  { label: '指针表盘偏好', value: 'analog_lovers' },
  { label: '数字表盘偏好', value: 'digital_lovers' },
  { label: '新用户', value: 'new_users' },
  { label: '回流用户', value: 'returning_users' },
]

const normalize = (v: string): string => v.trim().toLowerCase().replace(/\s+/g, '_')

const buildUrl = (): string => {
  const cleanPath = state.basePath.trim().replace(/^\//, '')
  const base = BASE_PREFIX + cleanPath
  const url = new URL(base)
  const params = url.searchParams
  params.delete('utm_source')
  params.delete('utm_medium')
  params.delete('utm_campaign')
  params.delete('utm_content')
  params.delete('utm_term')

  if (state.utm_source) params.set('utm_source', normalize(state.utm_source))
  if (state.utm_medium) params.set('utm_medium', normalize(state.utm_medium))
  if (state.utm_campaign) params.set('utm_campaign', normalize(state.utm_campaign))
  if (state.utm_content) params.set('utm_content', normalize(state.utm_content))
  if (state.utm_term) params.set('utm_term', normalize(state.utm_term))

  url.search = params.toString()
  return url.toString()
}

const fullUrl = computed(() => buildUrl())

const emitUrl = () => {
  emit('update:modelValue', fullUrl.value)
}

const parseUrl = (value: string) => {
  if (!value) {
    state.basePath = ''
    state.utm_source = ''
    state.utm_medium = ''
    state.utm_campaign = ''
    state.utm_content = ''
    state.utm_term = ''
    return
  }
  try {
    const url = new URL(value)
    const full = url.origin + url.pathname
    if (full.startsWith(BASE_PREFIX)) {
      state.basePath = full.slice(BASE_PREFIX.length)
    } else {
      // 其他域名的链接，尽量保留路径部分作为 basePath，前缀仍然强制为 eu261claim 域名
      state.basePath = url.pathname.replace(/^\//, '')
    }
    const params = url.searchParams
    state.utm_source = params.get('utm_source') || ''
    state.utm_medium = params.get('utm_medium') || ''
    state.utm_campaign = params.get('utm_campaign') || ''
    state.utm_content = params.get('utm_content') || ''
    state.utm_term = params.get('utm_term') || ''
  } catch {
    // 无法解析时，只把原始值当成路径部分处理
    state.basePath = value.replace(/^https?:\/\//, '')
    state.utm_source = ''
    state.utm_medium = ''
    state.utm_campaign = ''
    state.utm_content = ''
    state.utm_term = ''
  }
}

watch(
  () => props.modelValue,
  (val) => {
    parseUrl(val)
  },
  { immediate: true }
)

const onCampaignChange = (val: string) => {
  if (val && !/^wristo_[a-z0-9]+(?:_[a-z0-9]+)*$/.test(val)) {
    ElMessage.warning('建议使用 wristo_主题_补充 的命名，例如 wristo_watchface_launch 或 wristo_watchface_promo_valentine')
  }
  emitUrl()
}

const copyUrl = async () => {
  if (!fullUrl.value) {
    ElMessage.warning('没有可复制的链接')
    return
  }
  try {
    await navigator.clipboard.writeText(fullUrl.value)
    ElMessage.success('已复制')
  } catch {
    ElMessage.error('复制失败')
  }
}
</script>

<style scoped>
.utms-url-editor {
  width: 100%;
}

.utms-form {
  margin-bottom: 4px;
}

.utms-row {
  display: flex;
  gap: 16px;
}

.utms-row .el-form-item {
  flex: 1;
}
</style>
