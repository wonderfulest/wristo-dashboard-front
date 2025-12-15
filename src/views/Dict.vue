<template>
  <div class="dict-container">
    <div class="header">
      <h2>字典管理</h2>
      <div class="tools">
        <el-input v-model="enumKeyword" placeholder="搜索枚举名称/类名" clearable style="width: 240px" />
        <el-input v-model="optionKeyword" placeholder="搜索枚举项 name/value" clearable style="width: 240px" @keyup.enter.native="reloadOptions" />
        <el-button type="primary" @click="reloadOptions" :disabled="!selectedEnumClassName">刷新枚举项</el-button>
      </div>
    </div>

    <div class="content">
      <div class="left">
        <el-skeleton :loading="loadingEnums" animated>
          <el-collapse v-model="activeCategory" accordion class="category-collapse">
            <el-collapse-item
              v-for="group in groupedEnumNames"
              :key="group.category"
              :name="group.category"
            >
              <template #title>
                <div class="category-title">
                  <span class="category-name">{{ group.category }}</span>
                  <el-tag size="small" type="info">{{ group.items.length }}</el-tag>
                </div>
              </template>
              <el-table
                :data="group.items"
                border
                highlight-current-row
                style="width: 100%"
                @current-change="handleEnumSelect"
              >
                <el-table-column prop="name" label="枚举名" min-width="160" />
                <el-table-column prop="value" label="枚举类名" min-width="260" />
              </el-table>
            </el-collapse-item>
          </el-collapse>
        </el-skeleton>
      </div>

      <div class="right">
        <div class="right-header">
          <div class="selected">
            <span class="label">当前枚举</span>
            <span class="value">{{ selectedEnumName || '-' }}</span>
          </div>
          <div class="selected">
            <span class="label">类名</span>
            <span class="value">{{ selectedEnumClassName || '-' }}</span>
          </div>
          <el-button @click="copyText(selectedEnumClassName)" :disabled="!selectedEnumClassName">复制类名</el-button>
        </div>

        <el-table :data="filteredOptions" v-loading="loadingOptions" border style="width: 100%">
          <el-table-column prop="name" label="name" min-width="220" />
          <el-table-column prop="value" label="value" min-width="200" />
          <el-table-column prop="description" label="description" min-width="240" />
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button size="small" text type="primary" @click="copyText(row.name)">复制name</el-button>
              <el-button size="small" text type="primary" @click="copyText(row.value)">复制value</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { ApiResponse } from '@/types/api'
import { listEnumNames } from '@/api/common'
import type { EnumOption } from '@/api/common'
import { useEnumStore } from '@/store/common'

const loadingEnums = ref(false)
const loadingOptions = ref(false)

const enumNames = ref<EnumOption[]>([])
const enumKeyword = ref('')

const activeCategory = ref<string>('')

const selectedEnumName = ref<string>('')
const selectedEnumClassName = ref<string>('')

const options = ref<EnumOption[]>([])
const optionKeyword = ref('')

const enumStore = useEnumStore()

const filteredEnumNames = computed(() => {
  const kw = (enumKeyword.value || '').trim().toLowerCase()
  if (!kw) return enumNames.value
  return (enumNames.value || []).filter((it) => {
    const n = (it?.name || '').toLowerCase()
    const v = (it?.value || '').toLowerCase()
    return n.includes(kw) || v.includes(kw)
  })
})

const groupedEnumNames = computed(() => {
  const list = filteredEnumNames.value || []
  const map: Record<string, EnumOption[]> = {}
  for (const it of list) {
    const cat = it?.category || 'Default'
    if (!map[cat]) map[cat] = []
    map[cat].push(it)
  }
  const categories = Object.keys(map).sort((a, b) => a.localeCompare(b))
  return categories.map((c) => ({ category: c, items: map[c] }))
})

const filteredOptions = computed(() => {
  const kw = (optionKeyword.value || '').trim().toLowerCase()
  if (!kw) return options.value
  return (options.value || []).filter((it) => {
    const n = (it?.name || '').toLowerCase()
    const v = (it?.value || '').toLowerCase()
    const d = (it?.description || '').toLowerCase()
    return n.includes(kw) || v.includes(kw) || d.includes(kw)
  })
})

const fetchEnumNames = async () => {
  loadingEnums.value = true
  try {
    const resp = (await listEnumNames()) as unknown as ApiResponse<EnumOption[]>
    enumNames.value = resp.data || []
    if (!activeCategory.value) {
      const cats = Array.from(new Set((enumNames.value || []).map((x) => x.category || 'Default')))
      activeCategory.value = cats[0] || 'Default'
    }
  } catch {
    ElMessage.error('获取枚举名称列表失败')
  } finally {
    loadingEnums.value = false
  }
}

const fetchOptions = async (enumClassName: string) => {
  if (!enumClassName) return
  loadingOptions.value = true
  try {
    await enumStore.ensureOptions(enumClassName)
    options.value = enumStore.getOptions(enumClassName)
  } catch {
    ElMessage.error('获取枚举项失败')
  } finally {
    loadingOptions.value = false
  }
}

const handleEnumSelect = async (row: EnumOption | null) => {
  if (!row?.value) return
  selectedEnumName.value = row.name
  selectedEnumClassName.value = row.value
  optionKeyword.value = ''
  await fetchOptions(row.value)
}

const reloadOptions = async () => {
  if (!selectedEnumClassName.value) return
  await fetchOptions(selectedEnumClassName.value)
}

const copyText = async (text?: string) => {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制')
  } catch {
    ElMessage.error('复制失败')
  }
}

onMounted(async () => {
  await fetchEnumNames()
})
</script>

<style scoped>
.dict-container { padding: 24px; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.tools { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
.content { display: grid; grid-template-columns: 520px 1fr; gap: 16px; }
.left { width: 100%; }
.right { width: 100%; display: flex; flex-direction: column; gap: 12px; }
.right-header { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
.selected { display: flex; gap: 8px; align-items: center; max-width: 100%; }
.label { color: #909399; font-size: 12px; white-space: nowrap; }
.value { color: #303133; font-size: 13px; word-break: break-all; }
.category-collapse { width: 100%; }
.category-title { display: flex; align-items: center; gap: 10px; }
.category-name { font-weight: 600; }
</style>