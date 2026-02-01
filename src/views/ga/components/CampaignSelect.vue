<template>
  <el-select
    v-model="innerValue"
    filterable
    clearable
    remote
    reserve-keyword
    :remote-method="remoteSearch"
    :loading="loading"
    :placeholder="placeholder"
  >
    <el-option
      v-for="c in options"
      :key="c.id"
      :label="`${c.name} (#${c.id})`"
      :value="String(c.id)"
    />
    <el-option
      v-if="hasMore"
      key="__more__"
      :label="loading ? '加载中...' : '加载更多...'"
      value="__more__"
    />
  </el-select>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { getCampaignPage } from '@/api/promotion'
import type { CampaignVO, CampaignPageQuery } from '@/types/promotion'

const props = defineProps<{
  modelValue: string | number | null | undefined
  placeholder?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number | null): void
}>()

const innerValue = ref<string | number | null>(props.modelValue ?? null)
const options = ref<CampaignVO[]>([])
const loading = ref(false)
const pageNum = ref(1)
const pageSize = ref(10)
const hasMore = ref(false)
const currentKeyword = ref('')

watch(
  () => props.modelValue,
  val => {
    innerValue.value = val ?? null
  }
)

watch(innerValue, val => {
  if (val === '__more__') {
    // 选择“加载更多”时，不向父组件同步值，而是分页加载
    loadMore()
    // 恢复为原始选中值
    innerValue.value = props.modelValue ?? null
    return
  }
  emit('update:modelValue', val ?? null)
})

const fetchPage = async (reset: boolean) => {
  if (reset) {
    pageNum.value = 1
  }
  loading.value = true
  try {
    const params: CampaignPageQuery = {
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      name: currentKeyword.value || undefined,
    } as CampaignPageQuery
    const res = await getCampaignPage(params)
    const list: CampaignVO[] = (res.data as any)?.list || res.data?.list || []
    if (reset) {
      options.value = list
    } else {
      options.value = [...options.value, ...list]
    }
    hasMore.value = list.length >= pageSize.value
    if (!reset && list.length > 0) {
      pageNum.value += 1
    }
  } catch {
    if (reset) options.value = []
    hasMore.value = false
  } finally {
    loading.value = false
  }
}

const remoteSearch = async (keyword: string) => {
  currentKeyword.value = keyword.trim()
  await fetchPage(true)
}

const loadMore = async () => {
  if (!hasMore.value || loading.value) return
  await fetchPage(false)
}

onMounted(async () => {
  // 默认加载最近的活动（按后端默认排序），第一页 10 条
  currentKeyword.value = ''
  await fetchPage(true)
})
</script>
