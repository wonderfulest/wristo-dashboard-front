<template>
  <section style="padding: 20px">
    <h2>套餐配置入口</h2>
    <p>积分充值和 Studio 套餐 AI 点数已移至对应产品。</p>
    <el-button @click="$router.push('/marketing/cn/points-recharge')">国内网站 · 积分充值</el-button>
    <el-button @click="$router.push('/marketing/studio/credit-amounts')">Studio · 套餐 AI 点数</el-button>
    <p>首次国内登录欢迎礼仍按统一账号发放一次：100 积分和 50 AI 点数。</p>
  </section>
</template>
