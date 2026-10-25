<template>
  <el-card shadow="never">
    <template #header><strong>Wristo Image · AI 图片编辑</strong></template>
    <p>图片站 AI 去水印按每次请求扣除 Wristo 积分，默认 3 积分。处理失败自动退款。此价格独立于 Studio 模型配置。</p>
    <el-alert v-if="error" :title="error" type="error" :closable="false" />
    <el-input-number v-model="price" :min="1" :max="100000" :precision="0" :disabled="busy || !loaded" />
    <span> 积分／次 </span>
    <el-button :loading="busy" :disabled="!loaded" @click="save">保存图片编辑价格</el-button>
    <el-button :disabled="busy" @click="load">刷新</el-button>
  </el-card>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import instance from '@/config/axios'
const price = ref(3)
const busy = ref(false)
const loaded = ref(false)
const error = ref('')
async function load() {
  busy.value = true
  error.value = ''
  try { const response = await instance.get('/admin/image-ai'); price.value = response.data.creditCost; loaded.value = true }
  catch (e) { error.value = e instanceof Error ? e.message : '无法读取图片编辑价格' }
  finally { busy.value = false }
}
async function save() {
  busy.value = true
  error.value = ''
  try { await instance.put('/admin/image-ai', { creditCost: price.value }); ElMessage.success('图片编辑价格已保存') }
  catch (e) { error.value = e instanceof Error ? e.message : '保存失败' }
  finally { busy.value = false }
}
onMounted(load)
</script>
