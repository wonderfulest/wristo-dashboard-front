<template>
  <div class="credits-page">
    <header><div><h2>点数发放与套餐</h2><p>首次登录欢迎礼固定为 100 积分和 50 AI 点数；可配置套餐到账 AI 点数。现金售价保持原订单系统管理。</p></div><el-button @click="$router.push('/ops/points-accounts')">用户账户</el-button></header>
    <StudioCreditAmountsSettings />
    <el-alert title="已创建订单和退款使用原订单 AI 点数；欢迎礼同一账号全平台仅一次，历史已领取部分不补差额。AI 点数仅用于 Studio。" type="info" :closable="false" show-icon />
  </div>
</template>
<script setup lang="ts">
import StudioCreditAmountsSettings from '@/components/StudioCreditAmountsSettings.vue'
</script>
