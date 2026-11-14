<template>
  <CreditsSection title="兑换管理" description="查询兑换记录与关联扣点流水，按渠道管理默认额度及表盘覆盖价。" :tabs="tabs" v-slot="{ selected }">
    <RedemptionRecords v-if="selected === 'records'" />
    <MiniappPoints v-else-if="selected === 'miniapp'" mode="redemptions" />
    <el-card v-else shadow="never">
      <template #header><strong>国内站兑换配置</strong></template>
      <p>国内站奖励与兑换作为同一组策略启用。首次保存需同时核对奖励、默认兑换额度和表盘覆盖值，统一在完整配置页编辑。</p>
      <el-button type="primary" @click="$router.push('/ops/reward-rules?tab=cn')">管理国内站奖励与兑换</el-button>
    </el-card>
  </CreditsSection>
</template>
<script setup lang="ts">
import RedemptionRecords from '@/components/credits/RedemptionRecords.vue'
import CreditsSection from '@/components/credits/CreditsSection.vue'
import MiniappPoints from './MiniappPoints.vue'
const tabs = [{ key: 'records', label: '兑换记录' }, { key: 'miniapp', label: '小程序 · 表盘与资源' }, { key: 'cn', label: '国内站 · 表盘' }]
</script>
