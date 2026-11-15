<template>
  <el-select
    :model-value="modelValue"
    @update:model-value="updateValue"
    @change="onChange"
    @clear="onRemote('')"
    filterable
    remote
    reserve-keyword
    :multiple="multiple"
    collapse-tags
    collapse-tags-tooltip
    :placeholder="placeholder"
    :remote-method="onRemote"
    :loading="loading"
    :no-data-text="searchError || '暂无匹配应用'"
    :style="{ width }"
    :disabled="disabled"
    :size="size"
    clearable
  >
    <el-option v-for="p in options" :key="p.appId" :label="`${p.name} (App ID: ${p.appId})`" :value="p.appId" />
  </el-select>
</template>

<script setup lang="ts" generic="T extends number | number[] | null | undefined">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { fetchProductPage, getProduct } from '@/api/products'
import { searchApps } from '@/utils/appSearch'
import type { Product, ProductBase } from '@/types/product'

const props = withDefaults(defineProps<{
  modelValue: T
  multiple?: boolean
  placeholder?: string
  width?: string
  disabled?: boolean
  size?: 'large' | 'default' | 'small'
}>(), {
  multiple: false,
  placeholder: '输入应用名称或 App ID',
  width: '360px',
  disabled: false,
  size: 'default',
})
const emit = defineEmits<{
  (e: 'update:modelValue', value: T): void
  (e: 'change', value: T): void
  (e: 'selected', value: Product): void
}>()

const matches = ref<Array<ProductBase | Product>>([])
const selectedOptions = ref<Array<ProductBase | Product>>([])
const selectedIds = computed<number[]>(() => Array.isArray(props.modelValue) ? props.modelValue : props.modelValue ? [props.modelValue] : [])
const options = computed(() => {
  const entries = new Map(matches.value.map(p => [p.appId, p]))
  for (const p of selectedOptions.value) if (selectedIds.value.includes(p.appId)) entries.set(p.appId, p)
  return [...entries.values()]
})
const loading = ref(false)
const searchError = ref('')
let timer: ReturnType<typeof setTimeout> | undefined
let searchVersion = 0
let selectionVersion = 0
let changeVersion = 0

const updateValue = (value: number | number[] | null | undefined | '') => {
  emit('update:modelValue', (value === '' || value == null ? (props.multiple ? [] : undefined) : value) as T)
}

const onRemote = (query: string) => {
  const version = ++searchVersion
  clearTimeout(timer)
  searchError.value = ''
  matches.value = []
  loading.value = false
  if (!query.trim()) return
  loading.value = true
  timer = setTimeout(async () => {
    try {
      const result = await searchApps(query, {
        getByAppId: getProduct,
        searchByName: (name, pageNum, pageSize) => fetchProductPage({ name, pageNum, pageSize }),
      })
      if (version === searchVersion) matches.value = result
    } catch {
      if (version === searchVersion) searchError.value = '搜索失败，请重新输入重试'
    } finally {
      if (version === searchVersion) loading.value = false
    }
  }, 300)
}

const onChange = async (value: number | number[] | null | undefined | '') => {
  const version = ++changeVersion
  const normalized = (value === '' || value == null ? (props.multiple ? [] : undefined) : value) as T
  emit('change', normalized)
  if (typeof value !== 'number') return
  try {
    const response = await getProduct(value)
    if (version === changeVersion && props.modelValue === value && response.code === 0 && response.data) emit('selected', response.data)
  } catch {
    // The selected ID remains usable; do not emit incomplete product details.
  }
}

watch(selectedIds, async ids => {
  const version = ++selectionVersion
  const known = new Map(options.value.map(p => [p.appId, p]))
  const result = await Promise.all(ids.map(async appId => {
    if (known.has(appId)) return known.get(appId)!
    try {
      const response = await getProduct(appId)
      if (response.code === 0 && response.data) return response.data
    } catch { /* Preserve the selected ID when details are unavailable. */ }
    return { appId, name: '应用详情不可用' } as Product
  }))
  if (version === selectionVersion) selectedOptions.value = result
}, { immediate: true })

onBeforeUnmount(() => {
  clearTimeout(timer)
  searchVersion++
  selectionVersion++
  changeVersion++
})
</script>
