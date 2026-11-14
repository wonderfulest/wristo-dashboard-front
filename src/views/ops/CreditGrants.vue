<template>
  <div class="credits-page">
    <header><div><h2>点数发放与套餐</h2><p>配置注册赠送和套餐到账 AI 点数。现金售价保持原订单系统管理。</p></div><el-button @click="$router.push('/ops/points-accounts')">用户账户</el-button></header>
    <StudioCreditAmountsSettings />
    <el-alert title="已创建订单和退款使用原订单点数；注册赠送修改后，不向已领取账号补发。" type="info" :closable="false" show-icon />
  </div>
</template>
<script setup lang="ts">
import StudioCreditAmountsSettings from '@/components/StudioCreditAmountsSettings.vue'
</script>
