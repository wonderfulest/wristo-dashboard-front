<template>
  <CreditsSection title="奖励记录与审核" description="查询分享访问结果、处理社交分享审核、检查创作者日结状态。全平台发放和扣减请进入收支流水。" :tabs="tabs">
    <template #actions><el-button @click="$router.push('/ops/points-ledger?asset=REWARD')">奖励积分流水</el-button><el-button @click="$router.push('/ops/points-accounts')">用户账户与流水</el-button></template>
    <template #default="{ selected }">
      <SocialShareReview v-if="selected === 'social'" mode="records" />
      <ShareRewards v-else-if="selected === 'visits'" mode="records" />
      <CreatorRewards v-else mode="records" />
    </template>
  </CreditsSection>
</template>
<script setup lang="ts">
import CreditsSection from '@/components/credits/CreditsSection.vue'
import SocialShareReview from './SocialShareReview.vue'
import ShareRewards from './ShareRewards.vue'
import CreatorRewards from './CreatorRewards.vue'
const tabs = [{ key: 'social', label: '社交分享审核' }, { key: 'visits', label: '分享访问记录' }, { key: 'creators', label: '创作者结算' }]
</script>
