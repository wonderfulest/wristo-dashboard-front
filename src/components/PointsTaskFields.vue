<template>
  <section class="task-config">
    <div class="task-config-header">
      <strong>{{ task.name || '新任务' }}</strong>
      <el-tag size="small" type="info">{{ periodLabel }}</el-tag>
      <el-switch :model-value="task.enabled" active-text="开启任务" :disabled="disabled || fixed || switchDisabled" @change="$emit('toggle', Boolean($event))" />
    </div>
    <el-form-item label="标题"><el-input v-model="task.name" :maxlength="120" :disabled="disabled || fixed" /></el-form-item>
    <el-form-item label="说明"><el-input v-model="task.description" type="textarea" :rows="2" :maxlength="2000" :disabled="disabled || fixed" /></el-form-item>
    <div class="task-config-controls">
      <el-form-item label="每次领取积分"><el-input-number v-model="task.points" :min="1" :max="100000" :precision="0" :disabled="disabled || fixed" /></el-form-item>
      <el-form-item :label="`${periodLabel}领取次数${claimCap === 1 ? '' : '（0 不限）'}`"><el-input-number v-model="task.maxClaims" :min="claimCap === 1 ? 1 : 0" :max="claimCap || 100000" :precision="0" :disabled="disabled || fixed" /></el-form-item>
      <slot />
      <el-button v-if="!fixed" type="primary" :disabled="disabled" @click="$emit('save')">保存</el-button>
    </div>
    <small v-if="fixed">首次登录固定赠送 100 积分 + 50 AI 点数，同一账号全平台仅一次；AI 点数仅用于 Studio。</small>
    <small v-else-if="claimCap === 1">该任务在{{ periodLabel }}内只达成一次，领取次数固定为 1；可通过开关暂停任务。</small>
    <small v-else>按{{ periodLabel }}计算领取上限，每次完成任务领取一次，0 表示不限次数。</small>
  </section>
</template>
<script setup lang="ts">
import { computed } from 'vue'
const props = withDefaults(defineProps<{
  task: { enabled: boolean; name: string; description: string; points: number; maxClaims: number }
  period?: 'DAY' | 'WEEK' | 'ACCOUNT'
  fixed?: boolean
  claimCap?: number
  disabled?: boolean
  switchDisabled?: boolean
}>(), { period: 'ACCOUNT', claimCap: 0 })
defineEmits<{ toggle: [enabled: boolean]; save: [] }>()
const periodLabel = computed(() => ({ DAY: '每天', WEEK: '每周', ACCOUNT: '每账号' })[props.period])
</script>
<style scoped>
.task-config { border: 1px solid var(--el-border-color-lighter); border-radius: 8px; padding: 20px; margin-bottom: 16px; }
.task-config-header { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 20px; }
.task-config-header .el-switch { margin-left: auto; }
.task-config-controls { display: flex; align-items: flex-end; flex-wrap: wrap; gap: 12px 24px; }
.task-config-controls .el-button { margin-bottom: 18px; }
small { display: block; color: var(--el-text-color-secondary); line-height: 1.6; }
@media (max-width: 600px) { .task-config { padding: 12px; } .task-config-controls { align-items: stretch; } }
</style>
