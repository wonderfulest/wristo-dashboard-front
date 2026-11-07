<template>
  <nav class="order-tabs" aria-label="订单分类">
    <router-link to="/orders/history">购买记录</router-link>
  </nav>
</template>
<style scoped>
.order-tabs { display: flex; gap: 24px; border-bottom: 1px solid #e5e7eb; margin-bottom: 20px; }
a { padding: 12px 0; color: #606266; text-decoration: none; }
a.router-link-active { color: #409eff; border-bottom: 2px solid #409eff; }
</style>
