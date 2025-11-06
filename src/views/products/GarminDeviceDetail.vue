<template>
  <div class="page">
    <div class="header">
      <el-button type="default" @click="goBack">返回</el-button>
      <div class="title">设备详情</div>
    </div>

    <el-card v-loading="loading">
      <template #header>
        <div class="card-header">
          <span>{{ device?.displayName || '-' }}（ID: {{ device?.id ?? '-' }}）</span>
        </div>
      </template>

      <div v-if="error" class="error">{{ error }}</div>

      <div v-else-if="device" class="detail-grid">
        <div class="cover">
          <el-image v-if="device.imageUrl" :src="device.imageUrl" fit="cover" style="width: 160px; height: 160px; border-radius: 8px;" />
          <div v-else class="placeholder">无图片</div>
          <el-image v-if="device.devicePng" :src="device.devicePng" fit="contain" style="width: 120px; height: 120px; border-radius: 4px;" />
          <div v-else class="placeholder">无图片</div>
        </div>
        <div class="fields">
          <div class="row"><span class="label">显示名称</span><span class="value">{{ device.displayName }}</span></div>
          <div class="row"><span class="label">Device ID</span><span class="value">{{ device.deviceId }}</span></div>
          <div class="row"><span class="label">Part No.</span><span class="value">{{ device.partNumber }}</span></div>
          <div class="row"><span class="label">系列</span><span class="value">{{ device.deviceFamily }}</span></div>
          <div class="row"><span class="label">API分组</span><span class="value">{{ device.deviceGroup }}</span></div>
          <div class="row"><span class="label">分辨率</span><span class="value">{{ device.resolutionWidth }} × {{ device.resolutionHeight }}</span></div>
          <div class="row"><span class="label">显示类型</span><span class="value">{{ device.displayType }}</span></div>
          <div class="row"><span class="label">增强图形</span><span class="value"><el-tag :type="device.enhancedGraphicSupport ? 'success' : 'info'">{{ device.enhancedGraphicSupport ? '是' : '否' }}</el-tag></span></div>
          <div class="row"><span class="label">像素格式</span><span class="value">{{ device.pixelFormat }}</span></div>
          <div class="row"><span class="label">硬件PN</span><span class="value">{{ device.hardwarePartNumber }}</span></div>
          <div class="row"><span class="label">版本</span><span class="value">{{ device.deviceVersion }}</span></div>
          <div class="row"><span class="label">位深</span><span class="value">{{ device.bitsPerPixel ?? '-' }}</span></div>
          <div class="row"><span class="label">屏幕旋转</span><span class="value"><el-tag :type="device.screenRotationSupport ? 'success' : 'info'">{{ device.screenRotationSupport ? '支持' : '不支持' }}</el-tag></span></div>
          <div class="row"><span class="label">创建时间</span><span class="value">{{ device.createdAt || '-' }}</span></div>
         
        </div>
      </div>

      <div v-else class="empty">暂无数据</div>
    </el-card>

    <el-card v-if="device?.simulator" class="mt16">
      <template #header>
        <div class="card-header">Simulator 配置</div>
      </template>
      <div class="fields">
        <div class="row"><span class="label">PPI</span><span class="value">{{ device?.simulator?.ppi ?? '-' }}</span></div>
        <div class="row"><span class="label">屏幕保护</span><span class="value">{{ device?.simulator?.screenProtectionSupport ? '支持' : '不支持' }}</span></div>
        <div class="row"><span class="label">Green/Orange/Red Shift</span><span class="value">{{ device?.simulator?.greenshiftSupport ? 'G' : '-' }} {{ device?.simulator?.orangeshiftSupport ? 'O' : '-' }} {{ device?.simulator?.redshiftSupport ? 'R' : '-' }}</span></div>
        <div class="row"><span class="label">显示触控</span><span class="value">{{ device?.simulator?.display?.isTouch ? '支持' : '不支持' }}</span></div>
        <div class="row"><span class="label">横屏支持</span><span class="value">{{ device?.simulator?.display?.landscapeOrientation ?? '-' }}</span></div>
        <div class="row"><span class="label">按键数量</span><span class="value">{{ device?.simulator?.keys?.length ?? 0 }}</span></div>
        <div class="row"><span class="label">字体集数量</span><span class="value">{{ device?.simulator?.fonts?.length ?? 0 }}（字体总数：{{ simulatorFontsFlat.length }}）</span></div>
        <div class="row"><span class="label">行为数量</span><span class="value">{{ simulatorBehaviors.length }}</span></div>
        <div class="row"><span class="label">Watchdog</span><span class="value">{{ device?.simulator?.watchdogCount ?? '-' }}</span></div>
        <div class="row"><span class="label">传感器历史</span><span class="value">{{ device?.simulator?.sensorHistory?.length ?? 0 }}</span></div>
        <div class="row"><span class="label">定位配置</span><span class="value">{{ (device?.simulator?.constellationConfiguration || []).length }}</span></div>
        <div class="row"><span class="label">采样率</span><span class="value">Accel {{ device?.simulator?.sensorSampleRate?.maxAccelRate ?? '-' }}, Gyro {{ device?.simulator?.sensorSampleRate?.maxGyroRate ?? '-' }}, Mag {{ device?.simulator?.sensorSampleRate?.maxMagRate ?? '-' }}</span></div>
      </div>

      <el-collapse v-model="activePanels" class="mt12">
        <el-collapse-item v-if="simulatorKeys.length" name="keys">
          <template #title>
            <span>按键详情（共 {{ simulatorKeys.length }} 个）</span>
            <span v-if="!isKeysOpen && keysSummary" class="summary">：{{ keysSummary }}</span>
          </template>
          <el-table v-show="isKeysOpen" ref="keysTable" :data="simulatorKeys" size="small" border style="width: max-content; max-width: 100%" :max-height="320" table-layout="fixed" :fit="false" class="stable-scroll" :scrollbar-always-on="true">
            <el-table-column prop="id" label="按键名" width="160" />
            <el-table-column prop="behavior" label="行为" width="180" />
            <el-table-column label="长按" width="100">
              <template #default="{ row }">{{ row.isHold ? '是' : '否' }}</template>
            </el-table-column>
          </el-table>
        </el-collapse-item>

        <el-collapse-item v-if="simulatorFontsFlat.length" name="fonts">
          <template #title>
            <span>字体详情（字体集 {{ simulatorFontsBySet.length }}，字体 {{ simulatorFontsFlat.length }}）</span>
            <span v-if="!isFontsOpen && fontSetsSummary" class="summary">：{{ fontSetsSummary }}</span>
          </template>
          <div v-if="isFontsOpen" class="subsection">
            <div v-for="(group, idx) in simulatorFontsBySet" :key="idx" class="font-group">
              <div class="font-set">字体集：{{ group.fontSet || '-' }}</div>
              <el-table :ref="setFontTableRef(idx)" :data="group.items" size="small" border style="width: max-content; max-width: 100%" :max-height="320" table-layout="fixed" :fit="false" class="stable-scroll" :scrollbar-always-on="true">
                <el-table-column prop="name" label="字体名" width="200" />
                <el-table-column prop="size" label="字号" width="120">
                  <template #default="{ row }">{{ row.size ?? '-' }}</template>
                </el-table-column>
                <el-table-column prop="filename" label="文件" width="240" />
              </el-table>
            </div>
          </div>
        </el-collapse-item>

        <el-collapse-item v-if="simulatorBehaviors.length" name="behaviors">
          <template #title>
            <span>支持的行为（共 {{ simulatorBehaviors.length }} 条）</span>
            <span v-if="!isBehaviorsOpen && gesturesSummary" class="summary">：{{ gesturesSummary }}</span>
          </template>
          <el-table v-show="isBehaviorsOpen" ref="behaviorsTable" :data="simulatorBehaviors" size="small" border style="width: max-content; max-width: 100%" :max-height="320" table-layout="fixed" :fit="false" class="stable-scroll" :scrollbar-always-on="true">
            <el-table-column prop="id" label="行为ID" width="200">
              <template #default="{ row }">{{ row.id || '-' }}</template>
            </el-table-column>
            <el-table-column prop="gesture" label="手势" width="160" />
            <el-table-column prop="maxDistToEdge" label="边缘最大距离" width="140" />
            <el-table-column prop="minSwipeDeltaX" label="最小X位移" width="120" />
            <el-table-column prop="minSwipeDeltaY" label="最小Y位移" width="120" />
            <el-table-column prop="maxSwipeDuration" label="最大滑动时长(ms)" width="160" />
          </el-table>
        </el-collapse-item>

        <el-collapse-item v-if="(device?.simulator?.sensorHistory || []).length" name="sensors">
          <template #title>
            <span>传感器历史（{{ device?.simulator?.sensorHistory?.length }} 类）</span>
            <span v-if="!isSensorsOpen && sensorTypesSummary" class="summary">：{{ sensorTypesSummary }}</span>
          </template>
          <el-table v-show="isSensorsOpen" ref="sensorsTable" :data="device?.simulator?.sensorHistory || []" size="small" border style="width: max-content; max-width: 100%" :max-height="320" table-layout="fixed" :fit="false" class="stable-scroll" :scrollbar-always-on="true">
            <el-table-column prop="type" label="类型" width="160" />
            <el-table-column prop="interval" label="采样间隔(s)" width="140" />
            <el-table-column prop="size" label="容量" width="120" />
          </el-table>
        </el-collapse-item>

        <el-collapse-item v-if="(device?.simulator?.constellationConfiguration || []).length" name="constellations">
          <template #title>
            <span>定位配置（{{ (device?.simulator?.constellationConfiguration || []).length }} 组）</span>
            <span v-if="!isConstellationsOpen && constellationsSummary" class="summary">：{{ constellationsSummary }}</span>
          </template>
          <div v-if="isConstellationsOpen" class="subsection">
            <div v-for="(cfg, idx) in device?.simulator?.constellationConfiguration" :key="idx" class="font-group">
              <div class="font-set">{{ cfg.name || '-' }}</div>
              <el-table :ref="setConstellationTableRef(idx)" :data="(cfg.configuration || []).map(c => ({ band: c }))" size="small" border style="width: max-content; max-width: 100%" :max-height="320" table-layout="fixed" :fit="false" class="stable-scroll" :scrollbar-always-on="true">
                <el-table-column prop="band" label="频段/系统" width="320" />
              </el-table>
            </div>
          </div>
        </el-collapse-item>
      </el-collapse>
    </el-card>

    <el-card v-if="device?.compiler" class="mt16">
      <template #header>
        <div class="card-header">Compiler 配置</div>
      </template>
      <div class="fields">
        <div class="row"><span class="label">位深</span><span class="value">{{ device?.compiler?.bitsPerPixel ?? '-' }}</span></div>
        <div class="row"><span class="label">方向</span><span class="value">{{ device?.compiler?.orientation ?? '-' }}</span></div>
        <div class="row"><span class="label">分辨率</span><span class="value">{{ device?.compiler?.resolution?.width ?? '-' }} × {{ device?.compiler?.resolution?.height ?? '-' }}</span></div>
        <div class="row"><span class="label">调色板颜色数</span><span class="value">{{ device?.compiler?.palette?.colors?.length ?? 0 }}</span></div>
        <div class="row"><span class="label">App类型</span><span class="value">{{ (device?.compiler?.appTypes || []).map(a => a.type).filter(Boolean).join(', ') || '-' }}</span></div>
        <div class="row"><span class="label">PartNumbers</span><span class="value">{{ (device?.compiler?.partNumbers || []).map(p => p.number).filter(Boolean).join(', ') || '-' }}</span></div>
        <div class="row"><span class="label">增强图形</span><span class="value">{{ device?.compiler?.enhancedGraphicSupport ? '是' : '否' }}</span></div>
        <div class="row"><span class="label">支持语言</span><span class="value">{{ compilerLanguages.join(', ') || '-' }}</span></div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { TableInstance } from 'element-plus'
import type { GarminDeviceVO } from '@/types/garmin-device'
import { getGarminDeviceByDeviceId } from '@/api/garmin-device'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const error = ref('')
const device = ref<GarminDeviceVO | null>(null)

const simulatorKeys = computed(() => device.value?.simulator?.keys || [])
const simulatorFontsFlat = computed(() => {
  const sets = device.value?.simulator?.fonts || []
  const rows: Array<{ fontSet?: string; name?: string; size?: number | null; filename?: string }> = []
  sets.forEach(s => {
    ;(s.fonts || []).forEach(f => rows.push({ fontSet: s.fontSet, name: f.name, size: f.size ?? null, filename: f.filename }))
  })
  return rows
})
const simulatorFontsBySet = computed(() => {
  const map: Record<string, { fontSet: string; items: Array<{ name?: string; size?: number | null; filename?: string }> }> = {}
  simulatorFontsFlat.value.forEach(r => {
    const key = r.fontSet || 'default'
    if (!map[key]) map[key] = { fontSet: r.fontSet || 'default', items: [] }
    map[key].items.push({ name: r.name, size: r.size ?? null, filename: r.filename })
  })
  return Object.values(map)
})

const compilerLanguages = computed(() => {
  const parts = device.value?.compiler?.partNumbers || []
  const set = new Set<string>()
  parts.forEach(p => (p.languages || []).forEach(l => { if (l.code) set.add(l.code) }))
  return Array.from(set)
})

const activePanels = ref<string[]>([])
const isKeysOpen = computed(() => activePanels.value.includes('keys'))
const isFontsOpen = computed(() => activePanels.value.includes('fonts'))
const simulatorBehaviors = computed(() => device.value?.simulator?.display?.behaviors || [])
const isBehaviorsOpen = computed(() => activePanels.value.includes('behaviors'))
const isSensorsOpen = computed(() => activePanels.value.includes('sensors'))
const isConstellationsOpen = computed(() => activePanels.value.includes('constellations'))

const keysTable = ref<TableInstance | null>(null)
const behaviorsTable = ref<TableInstance | null>(null)
const sensorsTable = ref<TableInstance | null>(null)
const fontTableRefs = ref<Array<TableInstance | null>>([])
const constellationTableRefs = ref<Array<TableInstance | null>>([])

function setFontTableRef(index: number) {
  return (el: TableInstance | null) => { fontTableRefs.value[index] = el }
}
function setConstellationTableRef(index: number) {
  return (el: TableInstance | null) => { constellationTableRefs.value[index] = el }
}

// Recalculate table layout after panel open or data changes
function relayoutAll() {
  keysTable.value?.doLayout()
  behaviorsTable.value?.doLayout()
  sensorsTable.value?.doLayout()
  fontTableRefs.value.forEach(t => t?.doLayout())
  constellationTableRefs.value.forEach(t => t?.doLayout())
}

watch(activePanels, async () => {
  await nextTick()
  relayoutAll()
})
watch(() => device.value, async () => {
  await nextTick()
  relayoutAll()
})

async function fetchDetail(deviceId: string) {
  loading.value = true
  error.value = ''
  try {
    const resp = await getGarminDeviceByDeviceId(deviceId)
    const data: any = (resp as any)?.data
    device.value = data || null
    if (!device.value) throw new Error('未获取到设备数据')
  } catch (e: any) {
    error.value = e?.message || '加载失败'
    ElMessage.error('获取设备详情失败')
    router.replace({ name: 'GarminDevices' })
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.back()
}

onMounted(() => {
  const deviceIdParam = route.params.deviceId
  const deviceId = typeof deviceIdParam === 'string' ? deviceIdParam : Array.isArray(deviceIdParam) ? deviceIdParam[0] : ''
  if (!deviceId) {
    error.value = '参数错误：缺少设备ID'
    router.replace({ name: 'GarminDevices' })
    return
  }
  fetchDetail(deviceId)
  // initial layout after first paint
  nextTick().then(() => relayoutAll())

  // throttle window resize relayout
  let resizeTimer: number | undefined
  const onResize = () => {
    if (resizeTimer) window.clearTimeout(resizeTimer)
    resizeTimer = window.setTimeout(() => relayoutAll(), 100)
  }
  window.addEventListener('resize', onResize)
})

watch(() => route.params.deviceId, (newVal) => {
  const deviceId = typeof newVal === 'string' ? newVal : Array.isArray(newVal) ? newVal[0] : ''
  if (deviceId) fetchDetail(deviceId)
})

// Summaries for collapsed headers
const keysSummary = computed(() => (simulatorKeys.value || [])
  .map(k => k.id)
  .filter((v): v is string => !!v)
  .join(', '))

const fontSetsSummary = computed(() => (device.value?.simulator?.fonts || [])
  .map(s => s.fontSet)
  .filter((v): v is string => !!v)
  .join(', '))

const gesturesSummary = computed(() => (simulatorBehaviors.value || [])
  .map(b => b.gesture)
  .filter((v): v is string => !!v)
  .join(', '))

const sensorTypesSummary = computed(() => (device.value?.simulator?.sensorHistory || [])
  .map(s => s.type)
  .filter((v): v is string => !!v)
  .join(', '))

const constellationsSummary = computed(() => {
  const groups = device.value?.simulator?.constellationConfiguration || []
  const set = new Set<string>()
  groups.forEach(g => (g.configuration || []).forEach(name => { if (name) set.add(name) }))
  return Array.from(set).join(', ')
})
</script>

<style scoped>
.page { padding: 24px; }
.header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.header .title { font-size: 18px; font-weight: 600; }
.detail-grid { display: grid; grid-template-columns: 200px 1fr; gap: 24px; align-items: start; }
.fields { display: grid; grid-template-columns: repeat(2, minmax(240px, 1fr)); gap: 12px 24px; }
.row { display: flex; gap: 12px; }
.label { width: 120px; color: #666; }
.value { flex: 1; }
.placeholder { width: 160px; height: 160px; display: flex; align-items: center; justify-content: center; border: 1px dashed #ddd; border-radius: 8px; color: #999; }
.error { color: #d03050; margin-bottom: 8px; }
.empty { color: #999; }
.mt16 { margin-top: 16px; }
.summary { margin-left: 8px; color: #909399; font-size: 12px; }
/* Fallback: keep header/body widths in sync even if scrollbar-always-on is unsupported */
:deep(.stable-scroll .el-table__body-wrapper) { overflow-y: scroll; }
:deep(.stable-scroll .el-table__header-wrapper) { padding-right: var(--el-scrollbar-width, 8px); }
</style>
