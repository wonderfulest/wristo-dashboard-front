<template>
  <el-select
    :model-value="modelValue"
    @update:modelValue="$emit('update:modelValue', $event)"
    @change="onChange"
    filterable
    remote
    reserve-keyword
    :placeholder="placeholder"
    :remote-method="onRemote"
    :loading="loading"
    :style="{ width }"
    :disabled="disabled"
    clearable
  >
    <el-option
      v-for="p in options"
      :key="p.appId"
      :label="`${p.name} (AppID: ${p.appId})`"
      :value="p.appId"
    />
  </el-select>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { fetchProductPage, getProduct } from '@/api/products'
import type { Product } from '@/types/product'

const props = withDefaults(defineProps<{
  modelValue: number | null | undefined,
  placeholder?: string,
  width?: string,
  disabled?: boolean,
}>(), {
  placeholder: '搜索应用（按名称）',
  width: '360px',
  disabled: false,
})

const options = ref<Product[]>([])
const loading = ref(false)
let timer: number | undefined

const emit = defineEmits<{
  (e: 'update:modelValue', value: number | null | undefined): void
  (e: 'selected', value: Product): void
}>()

const ensureSelectedOption = async (appId?: number | null) => {
  if (!appId) return
  const existed = options.value.some(p => p.appId === appId)
  if (existed) return

  loading.value = true
  try {
    const res = await getProduct(appId)
    if (res.code === 0 && res.data) {
      options.value = [res.data, ...options.value]
    }
  } finally {
    loading.value = false
  }
}

const onRemote = (query: string) => {
  if (timer) window.clearTimeout(timer)
  timer = window.setTimeout(async () => {
    loading.value = true
    try {
      const res = await fetchProductPage({ pageNum: 1, pageSize: 20, name: query || undefined, orderBy: 'updated_at desc' })
      if (res.code === 0 && res.data) {
        const next = res.data.list || []
        options.value = next
        await ensureSelectedOption(props.modelValue)
      }
    } finally {
      loading.value = false
    }
  }, 300)
}

const onChange = (val: number) => {
  const found = options.value.find(p => p.appId === val)
  if (found) {
    emit('selected', found)
  }
}

watch(
  () => props.modelValue,
  async (val) => {
    await ensureSelectedOption(val)
  }
)

onMounted(async () => {
  await ensureSelectedOption(props.modelValue)
})
</script>
