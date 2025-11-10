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
import type { IconLibraryVO } from '@/types/icon-library'
import { useIconStore } from '@/store/icon'

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

const iconStore = useIconStore()
const options = computed<IconLibraryVO[]>(() => iconStore.byCategory(props.category))

onMounted(async () => {
  await iconStore.ensureLoaded()
})

const selectStyle = computed(() => ({ width: typeof props.width === 'number' ? `${props.width}px` : props.width }))
</script>
