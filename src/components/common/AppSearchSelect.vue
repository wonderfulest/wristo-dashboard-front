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
import { getProduct, searchPublicProductPageV2 } from '@/api/products'
import type { Product, ProductBase } from '@/types/product'

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

const options = ref<Array<ProductBase | Product>>([])
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
  if (!query) {
    options.value = []
    return
  }
  if (timer) window.clearTimeout(timer)
  timer = window.setTimeout(async () => {
    loading.value = true
    try {
      const res = await searchPublicProductPageV2(query, 1, 20)
      if (res.code === 0 && res.data) {
        options.value = res.data.list || []
        await ensureSelectedOption(props.modelValue)
      }
    } finally {
      loading.value = false
    }
  }, 300)
}

const onChange = async (val: number | null | undefined) => {
  if (!val) return
  const found = options.value.find(p => p.appId === val)
  if (!found) return

  loading.value = true
  try {
    const res = await getProduct(val)
    if (res.code === 0 && res.data) {
      options.value = [res.data, ...options.value.filter(p => p.appId !== val)]
      emit('selected', res.data)
      return
    }
  } finally {
    loading.value = false
  }

  emit('selected', found as unknown as Product)
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
