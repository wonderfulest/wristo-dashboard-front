<template>
  <el-select
    v-model="innerValue"
    filterable
    clearable
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
import { ref, watch, computed, onMounted } from 'vue'
import type { PropType } from 'vue'
import { listIconLibrary } from '@/api/icon-library'
import type { IconLibraryVO } from '@/types/icon-library'

const props = defineProps({
  modelValue: { type: String as PropType<string | undefined>, default: undefined },
  placeholder: { type: String, default: 'icon' },
  width: { type: [Number, String] as PropType<number | string>, default: 260 },
  category: { type: String as PropType<string | undefined>, default: undefined }
})

const emit = defineEmits<{ (e: 'update:modelValue', v?: string): void }>()

const innerValue = ref<string | undefined>(props.modelValue)
watch(() => props.modelValue, v => innerValue.value = v)
watch(innerValue, v => emit('update:modelValue', v))

const options = ref<IconLibraryVO[]>([])

async function loadAll() {
  const res: any = await listIconLibrary(props.category)
  const list: IconLibraryVO[] = res?.data?.data || res?.data || []
  options.value = list
}

onMounted(() => {
  loadAll()
})

watch(() => props.category, () => loadAll())

const selectStyle = computed(() => ({ width: typeof props.width === 'number' ? `${props.width}px` : props.width }))
</script>
