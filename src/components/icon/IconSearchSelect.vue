<template>
  <el-select
    v-model="innerValue"
    filterable
    remote
    clearable
    :remote-method="onSearch"
    :loading="loading"
    :placeholder="placeholder"
    :style="selectStyle"
  >
    <el-option
      v-for="opt in options"
      :key="opt.id"
      :label="`${opt.symbolCode} — ${opt.iconUnicode}`"
      :value="opt.iconUnicode"
    />
  </el-select>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { PropType } from 'vue'
import { pageIconLibrary } from '@/api/icon-library'
import type { IconLibraryPageQueryDTO, IconLibraryVO } from '@/types/icon-library'

const props = defineProps({
  modelValue: { type: String as PropType<string | undefined>, default: undefined },
  placeholder: { type: String, default: 'icon' },
  width: { type: [Number, String] as PropType<number | string>, default: 260 }
})

const emit = defineEmits<{ (e: 'update:modelValue', v?: string): void }>()

const innerValue = ref<string | undefined>(props.modelValue)
watch(() => props.modelValue, v => innerValue.value = v)
watch(innerValue, v => emit('update:modelValue', v))

const options = ref<IconLibraryVO[]>([])
const loading = ref(false)
let timer: any = null

function onSearch(query: string) {
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => doSearch(query), 250)
}

async function doSearch(keyword: string) {
  try {
    loading.value = true
    const dto: IconLibraryPageQueryDTO = {
      pageNum: 1,
      pageSize: 10,
      keyword: keyword || undefined,
      active: 1,
      orderBy: 'id:asc'
    } as any
    const res: any = await pageIconLibrary(dto)
    const list: IconLibraryVO[] = res?.data?.data?.list || res?.data?.list || []
    options.value = list
  } finally {
    loading.value = false
  }
}

const selectStyle = computed(() => ({ width: typeof props.width === 'number' ? `${props.width}px` : props.width }))
</script>
