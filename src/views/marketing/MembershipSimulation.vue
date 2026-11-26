<template>
  <el-card>
    <h3>会员分佣测试</h3>
    <p>永久会员 ¥69.90，按顾客当前绑定折扣模拟付款。测试权益持续至撤销，测试佣金不参与结算。</p>
    <el-input v-model.trim="email" placeholder="顾客邮箱" aria-label="顾客邮箱" @input="requestId = ''" />
    <el-button :loading="busy" :disabled="!email" @click="create">生成测试订单</el-button>
    <el-input v-model.trim="order" placeholder="SIM- 开头的测试订单号" aria-label="测试订单号" />
    <el-button :loading="busy" :disabled="!order.startsWith('SIM-')" @click="revoke">撤销测试权益和佣金</el-button>
  </el-card>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'

const base = '/admin/promotion/membership-simulations'
const email = ref('')
const order = ref('')
const requestId = ref('')
const busy = ref(false)
async function create() {
  if (busy.value) return
  busy.value = true
  try {
    requestId.value ||= crypto.randomUUID()
    const result: ApiResponse<{ orderNo: string }> = await instance.post(base, { email: email.value, requestId: requestId.value })
    if (!result.data?.orderNo) throw new Error('未取得订单号')
    order.value = result.data.orderNo
    ElMessage.success('测试订单已生成')
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '创建失败')
  } finally { busy.value = false }
}
async function revoke() {
  if (busy.value) return
  busy.value = true
  try {
    await instance.post(base + '/' + encodeURIComponent(order.value.slice(4)) + '/revoke')
    requestId.value = ''
    ElMessage.success('测试订单已撤销')
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '撤销失败')
  } finally { busy.value = false }
}
</script>
