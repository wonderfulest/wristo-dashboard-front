<template>
  <div class="meter-operation-page">
    <div class="header">
      <h2>运维操作</h2>
    </div>

    <!-- Meter 配置 -->
    <el-card class="section-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>Meter 配置</span>
          <el-button type="primary" link :loading="configLoading" @click="fetchConfig">刷新</el-button>
        </div>
      </template>
      <div v-if="config" class="config-content">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="启用状态">
            <el-switch
              :model-value="config.enabled"
              :loading="toggleLoading"
              @change="handleToggle"
              active-text="启用"
              inactive-text="禁用"
            />
          </el-descriptions-item>
          <el-descriptions-item label="Key TTL">{{ config.keyTtlDays }} 天</el-descriptions-item>
          <el-descriptions-item label="Usage Max Gap">{{ config.usageMaxGapSeconds }} 秒</el-descriptions-item>
          <el-descriptions-item label="Lifecycle Fixed Rate">{{ config.lifecycleFixedRateMs }} ms</el-descriptions-item>
          <el-descriptions-item label="Lifecycle App IDs" :span="2">
            <span class="mono">{{ config.lifecycleAppIds || '-' }}</span>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <div v-else-if="configLoading" v-loading="true" style="height: 120px" />
    </el-card>

    <!-- 手动触发 Lifecycle 计算 -->
    <el-card class="section-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>手动触发 Lifecycle 计算</span>
        </div>
      </template>
      <div class="compute-row">
        <el-input v-model="computeAppId" placeholder="输入 App ID" style="width: 240px" @keyup.enter="handleCompute" />
        <el-button type="warning" :loading="computeLoading" @click="handleCompute">触发计算</el-button>
      </div>
      <div v-if="computeResult" class="compute-result">
        <el-alert :title="computeResult" type="success" show-icon :closable="false" />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getMeterConfig, toggleMeterEnabled, triggerCompute, triggerComputeAll } from '@/api/meter'
import type { MeterConfigVO } from '@/types/meter'

// ---- Config ----
const configLoading = ref(false)
const config = ref<MeterConfigVO | null>(null)
const toggleLoading = ref(false)

const fetchConfig = async () => {
  configLoading.value = true
  try {
    const res = await getMeterConfig()
    config.value = res.data || null
  } catch {
    ElMessage.error('获取配置失败')
  } finally {
    configLoading.value = false
  }
}

const handleToggle = async (val: boolean | string | number) => {
  const enabled = val as boolean
  try {
    await ElMessageBox.confirm(
      enabled ? '确认启用 Meter？' : '确认禁用 Meter？所有指标采集将停止。',
      '确认操作',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    )
  } catch {
    return
  }
  toggleLoading.value = true
  try {
    await toggleMeterEnabled(enabled)
    if (config.value) config.value.enabled = enabled
    ElMessage.success(enabled ? '已启用' : '已禁用')
  } catch {
    ElMessage.error('操作失败')
  } finally {
    toggleLoading.value = false
  }
}

// ---- Compute ----
const computeAppId = ref('')
const computeLoading = ref(false)
const computeResult = ref('')

const handleCompute = async () => {
  const id = computeAppId.value.trim()
 
  computeLoading.value = true
  computeResult.value = ''
  try {
    if (!id) {
      await triggerComputeAll()
      computeResult.value = '所有 App 的 Lifecycle 计算已触发完成'
    } else {
      await triggerCompute(id)
      computeResult.value = `App ${id} 的 Lifecycle 计算已触发完成`
    }
  } catch {
    ElMessage.error('触发计算失败')
  } finally {
    computeLoading.value = false
  }
}

onMounted(fetchConfig)
</script>

<style scoped>
.meter-operation-page { padding: 16px; }
.header { margin-bottom: 16px; }
.section-card { margin-bottom: 24px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.config-content { padding: 4px 0; }
.mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; word-break: break-all; }
.compute-row { display: flex; align-items: center; gap: 12px; }
.compute-result { margin-top: 16px; }
</style>
