<template>
  <CreditsSection title="奖励规则" description="按业务和渠道管理奖励积分。注册赠送与充值到账 AI 点数在「点数发放与套餐」管理。" :tabs="tabs" v-slot="{ selected }">
    <UserRewards v-if="selected === 'users'" />
    <MiniappPoints v-else-if="selected === 'miniapp'" mode="rewards" />
    <CnRewardAmountsSettings v-else-if="selected === 'cn'" />
    <ShareRewards v-else-if="selected === 'visits'" mode="rules" />
    <SocialShareReview v-else-if="selected === 'social'" mode="rules" />
    <CreatorRewards v-else-if="selected === 'creators'" mode="rules" />
  </CreditsSection>
</template>
<script setup lang="ts">
import CreditsSection from '@/components/credits/CreditsSection.vue'
import UserRewards from './UserRewards.vue'
import MiniappPoints from './MiniappPoints.vue'
import CnRewardAmountsSettings from '@/components/CnRewardAmountsSettings.vue'
import ShareRewards from './ShareRewards.vue'
import SocialShareReview from './SocialShareReview.vue'
import CreatorRewards from './CreatorRewards.vue'
const tabs = [{ key: 'users', label: '用户任务' }, { key: 'miniapp', label: '小程序任务' }, { key: 'cn', label: '国内站配置' }, { key: 'visits', label: '分享访问' }, { key: 'social', label: '社交分享' }, { key: 'creators', label: '创作者奖励' }]
</script>
