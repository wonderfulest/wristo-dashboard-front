<template>
  <div class="recommendations" v-loading="loading">
    <h2>小程序首页 Banner</h2>
    <el-alert v-if="!loading && !loaded" title="加载失败，请刷新页面后再编辑。" type="error" :closable="false" />
    <p>添加已上架表盘，轮播直接展示表盘已有的「首页横幅」。请在 Studio 上架设置中上传 1440 × 720 横幅。</p>
    <el-switch v-model="enabled" active-text="启用轮播" :disabled="loading || !loaded || saving || adding" />
    <p>按下方列表顺序轮播，点击进入表盘详情。未配置或关闭时不显示，不影响 iOS 首页推荐。</p>
    <div class="actions">
      <AppSearchSelect v-model="appId" width="280px" :disabled="loading || !loaded || saving || adding" />
      <el-button @click="add" :loading="adding" :disabled="loading || !loaded || saving || adding">添加应用</el-button>
      <span>已选择：{{ items.length }} 个应用</span>
    </div>
    <el-table :data="items" row-key="appId">
      <TableActionColumn>
        <template #default="{ $index }">
          <el-button link :disabled="loading || !loaded || saving || adding || $index === 0" @click="move($index, -1)">上移</el-button>
          <el-button link :disabled="loading || !loaded || saving || adding || $index === items.length - 1" @click="move($index, 1)">下移</el-button>
          <el-button link type="danger" :disabled="loading || !loaded || saving || adding" @click="items.splice($index, 1)">移除</el-button>
        </template>
      </TableActionColumn>

      <el-table-column label="顺序" type="index" width="70" />
      <el-table-column label="首页横幅" width="290">
        <template #default="{ row }">
          <el-image v-if="row.bannerImageUrl" :src="row.bannerImageUrl" fit="contain" style="width: 256px; height: 128px" />
          <el-tag v-else type="danger">横幅缺失或应用已不可用，请移除后重新添加</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="name" label="应用" />
      <el-table-column prop="appId" label="App ID" width="140" />
    </el-table>
    <el-button type="primary" class="save" :loading="saving" :disabled="loading || adding || !canSave" @click="save">保存配置</el-button>
  </div>
</template>

<script setup lang="ts">
import TableActionColumn from '@/components/common/TableActionColumn.vue'
import AppSearchSelect from '@/components/common/AppSearchSelect.vue'
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'

type RecommendedApp = { appId: number; name?: string; bannerImageUrl?: string }
type Selection = { enabled: boolean; appIds: number[] }
const endpoint = '/admin/website/wechat-home-banners'
const enabled = ref(false)
const items = ref<RecommendedApp[]>([])
const appId = ref<number>()
const loading = ref(true)
const adding = ref(false)
const saving = ref(false)
const loaded = ref(false)
const canSave = computed(() => loaded.value && (!enabled.value || items.value.length >= 1) && items.value.every(item => !!item.bannerImageUrl))

async function candidate(id: number): Promise<RecommendedApp> {
  const res: ApiResponse<RecommendedApp> = await instance.get(`${endpoint}/candidate/${id}`)
  if (res.code !== 0 || !res.data?.bannerImageUrl) throw new Error(res.msg || '应用缺少首页横幅或不可公开展示')
  return res.data
}
async function add() {
  if (!loaded.value || loading.value || adding.value || saving.value) return
  const id = Number(appId.value)
  if (!Number.isSafeInteger(id) || id <= 0) { ElMessage.warning('请输入有效的 App ID'); return }
  if (items.value.some(item => item.appId === id)) { ElMessage.warning('该应用已在列表中'); return }
  adding.value = true
  try { items.value.push(await candidate(id)); appId.value = undefined }
  catch (error) { ElMessage.error(error instanceof Error ? error.message : '无法添加应用') }
  finally { adding.value = false }
}
function move(index: number, direction: number) {
  const [item] = items.value.splice(index, 1)
  items.value.splice(index + direction, 0, item)
}
async function save() {
  if (!canSave.value || loading.value || adding.value || saving.value) return
  saving.value = true
  try {
    const res: ApiResponse<Selection> = await instance.put(endpoint, { enabled: enabled.value, appIds: items.value.map(item => item.appId) })
    if (res.code !== 0) throw new Error(res.msg || '保存失败')
    ElMessage.success('小程序首页 Banner 已保存')
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
.display-settings { display: flex; flex-wrap: wrap; gap: 24px; margin-top: 24px; }
.save { margin-top: 24px; }
</style>
