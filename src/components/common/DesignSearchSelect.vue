<template>
  <el-select
    :model-value="modelValue"
    @update:modelValue="$emit('update:modelValue', $event)"
    @change="onChange"
    filterable
    remote
    reserve-keyword
    clearable
    :placeholder="placeholder"
    :remote-method="onRemote"
    :loading="loading"
    :style="{ width }"
    :disabled="disabled"
    :size="size"
  >
    <el-option
      v-for="design in options"
      :key="design.designUid"
      :label="optionLabel(design)"
      :value="design.designUid"
    />
  </el-select>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { fetchDesignDetail, fetchDesignPage } from '@/api/design-admin'
import { searchDesigns } from '@/utils/designSearch'
import type { Design } from '@/types/design'

const props = withDefaults(defineProps<{
  modelValue: string | null | undefined
  placeholder?: string
  width?: string
  disabled?: boolean
  size?: 'large' | 'default' | 'small'
}>(), {
  placeholder: '搜索设计（设计名 / 设计 ID / App ID）',
  width: '360px',
  disabled: false,
  size: 'default'
})

const emit = defineEmits<{
  (event: 'update:modelValue', value: string | null | undefined): void
  (event: 'selected', value: Design): void
}>()

const options = ref<Design[]>([])
const loading = ref(false)
let timer: number | undefined
let requestId = 0

const optionLabel = (design: Design) => {
  const appId = design.product?.appId
  return `${design.name || '未命名'} · Design ID: ${design.designUid}${appId ? ` · App ID: ${appId}` : ''}`
}

const ensureSelectedOption = async (designUid?: string | null) => {
  if (!designUid || options.value.some(design => design.designUid === designUid)) return

  loading.value = true
  try {
    const response = await fetchDesignDetail(designUid)
    if (response.code === 0 && response.data) {
      options.value = [response.data, ...options.value]
    }
  } finally {
    loading.value = false
  }
}

const onRemote = (query: string) => {
  if (timer) window.clearTimeout(timer)
  if (!query.trim()) {
    options.value = []
    return
  }

  const currentRequestId = ++requestId
  timer = window.setTimeout(async () => {
    loading.value = true
    try {
      const results = await searchDesigns(query, fetchDesignPage)
      if (currentRequestId !== requestId) return
      options.value = results
      await ensureSelectedOption(props.modelValue)
    } finally {
      if (currentRequestId === requestId) loading.value = false
    }
  }, 300)
}

const onChange = (designUid: string | null | undefined) => {
  if (!designUid) return
  const selected = options.value.find(design => design.designUid === designUid)
  if (selected) emit('selected', selected)
}

watch(() => props.modelValue, ensureSelectedOption)

onMounted(() => ensureSelectedOption(props.modelValue))

onBeforeUnmount(() => {
  if (timer) window.clearTimeout(timer)
  requestId += 1
})
</script>
