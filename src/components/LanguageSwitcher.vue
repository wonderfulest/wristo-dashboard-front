<template>
  <div class="lang-switcher" role="navigation" aria-label="Language Switcher">
    <span class="label">Language</span>
    <div class="buttons">
      <button
        v-for="lang in availableLanguages"
        :key="lang"
        class="pill"
        :class="{ active: lang === currentLanguage }"
        type="button"
        @click="switchLanguage(lang)"
      >
        {{ lang.toUpperCase() }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { fetchSystemLanguages } from '@/api/system'

interface Props {
  modelValue?: string
  autoSelectFirst?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: string): void
  (e: 'languages-loaded', languages: string[]): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  autoSelectFirst: true
})

const emit = defineEmits<Emits>()

const availableLanguages = ref<string[]>([])
const currentLanguage = ref<string>(props.modelValue)

const switchLanguage = (lang: string) => {
  currentLanguage.value = lang
  emit('update:modelValue', lang)
  emit('change', lang)
}

const loadSystemLanguages = async () => {
  try {
    const res = await fetchSystemLanguages()
    if (res.code === 0 && res.data) {
      availableLanguages.value = res.data
      emit('languages-loaded', res.data)
      
      // Auto-select first language if no current language and autoSelectFirst is true
      if (props.autoSelectFirst && !currentLanguage.value && availableLanguages.value.length > 0) {
        switchLanguage(availableLanguages.value[0])
      }
    }
  } catch (e) {
    console.error('Failed to load system languages:', e)
  }
}

// Watch for external changes to modelValue
watch(() => props.modelValue, (newValue) => {
  currentLanguage.value = newValue
})

onMounted(() => {
  loadSystemLanguages()
})
</script>

<style scoped>
.lang-switcher {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.label {
  font-weight: 500;
  color: #495057;
  font-size: 14px;
}

.buttons {
  display: flex;
  gap: 8px;
}

.pill {
  padding: 6px 12px;
  border: 1px solid #dee2e6;
  background: #fff;
  color: #6c757d;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.pill:hover {
  border-color: #409eff;
  color: #409eff;
}

.pill.active {
  background: #409eff;
  border-color: #409eff;
  color: #fff;
}

.pill.active:hover {
  background: #337ecc;
  border-color: #337ecc;
}
</style>
