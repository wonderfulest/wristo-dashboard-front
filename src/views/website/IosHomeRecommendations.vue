<template>
  <div class="recommendations" v-loading="loading">
    <h2>iOS 首页应用推荐</h2>
    <p>选择 3–5 个已上架应用，首页轮播直接展示应用的「首页横幅」。请在 Studio 上架设置中上传 1440 × 720 横幅。</p>
    <el-switch v-model="enabled" active-text="启用轮播" :disabled="saving" />
    <div class="actions">
      <el-input v-model="appId" placeholder="输入 App ID" style="width: 240px" @keyup.enter="add" :disabled="saving" />
      <el-button @click="add" :loading="adding" :disabled="saving || items.length >= 5">添加应用</el-button>
      <span>{{ items.length }} / 5</span>
    </div>
    <el-table :data="items" row-key="appId">
      <el-table-column label="顺序" type="index" width="70" />
      <el-table-column label="首页横幅" width="290">
        <template #default="{ row }">
          <el-image v-if="row.bannerImageUrl" :src="row.bannerImageUrl" fit="contain" style="width: 256px; height: 128px" />
          <el-tag v-else type="danger">横幅缺失或应用已不可用，请移除后重新添加</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="name" label="应用" />
      <el-table-column prop="appId" label="App ID" width="140" />
      <el-table-column label="操作" width="230">
        <template #default="{ $index }">
          <el-button link :disabled="saving || $index === 0" @click="move($index, -1)">上移</el-button>
          <el-button link :disabled="saving || $index === items.length - 1" @click="move($index, 1)">下移</el-button>
          <el-button link type="danger" :disabled="saving" @click="items.splice($index, 1)">移除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-button type="primary" class="save" :loading="saving" :disabled="loading || adding || !canSave" @click="save">保存配置</el-button>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'

type RecommendedApp = { appId: number; name?: string; bannerImageUrl?: string }
type Selection = { enabled: boolean; appIds: number[] }
const endpoint = '/admin/website/ios-home-recommendations'
const enabled = ref(false)
const items = ref<RecommendedApp[]>([])
const appId = ref('')
const loading = ref(true)
const adding = ref(false)
const saving = ref(false)
const loaded = ref(false)
const canSave = computed(() => loaded.value && (!enabled.value || items.value.length >= 3) && items.value.length <= 5 && items.value.every(item => !!item.bannerImageUrl))

async function candidate(id: number): Promise<RecommendedApp> {
  const res: ApiResponse<RecommendedApp> = await instance.get(`${endpoint}/candidate/${id}`)
  if (res.code !== 0 || !res.data?.bannerImageUrl) throw new Error(res.msg || '应用缺少首页横幅或不可公开展示')
  return res.data
}
async function add() {
  if (adding.value || saving.value || items.value.length >= 5) return
  const id = Number(appId.value.trim())
  if (!Number.isSafeInteger(id) || id <= 0) { ElMessage.warning('请输入有效的 App ID'); return }
  if (items.value.some(item => item.appId === id)) { ElMessage.warning('该应用已在列表中'); return }
  adding.value = true
  try { items.value.push(await candidate(id)); appId.value = '' }
  catch (error) { ElMessage.error(error instanceof Error ? error.message : '无法添加应用') }
  finally { adding.value = false }
}
function move(index: number, direction: number) {
  const [item] = items.value.splice(index, 1)
  items.value.splice(index + direction, 0, item)
}
async function save() {
  if (!canSave.value || saving.value) return
  saving.value = true
  try {
    const res: ApiResponse<Selection> = await instance.put(endpoint, { enabled: enabled.value, appIds: items.value.map(item => item.appId) })
    if (res.code !== 0) throw new Error(res.msg || '保存失败')
    ElMessage.success('首页应用推荐已保存')
  } catch (error) { ElMessage.error(error instanceof Error ? error.message : '保存失败') }
  finally { saving.value = false }
}
onMounted(async () => {
  try {
    const res: ApiResponse<Selection> = await instance.get(endpoint)
    if (res.code !== 0 || !res.data) throw new Error(res.msg || '加载失败')
    enabled.value = res.data.enabled
    items.value = await Promise.all(res.data.appIds.map(async id => {
      try { return await candidate(id) } catch { return { appId: id } }
    }))
    loaded.value = true
  } catch (error) { ElMessage.error(error instanceof Error ? error.message : '加载失败，请刷新页面重试') }
  finally { loading.value = false }
})
</script>

<style scoped>
.recommendations { padding: 24px; }
p { color: var(--el-text-color-secondary); line-height: 1.7; }
.actions { display: flex; align-items: center; gap: 12px; margin: 24px 0; }
.save { margin-top: 24px; }
</style>
