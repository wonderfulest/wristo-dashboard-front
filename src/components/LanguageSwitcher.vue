<template>
  <div class="lang-switcher" role="navigation" aria-label="Language">
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
        {{ getLanguageLabel(lang) }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { fetchSystemLanguages } from '@/api/system'

const SHARED_LOCALE_KEY = 'wristo-locale'
const DEFAULT_LOCALE = 'en'
const REQUIRED_LANGUAGES = ['en', 'zh']
const languageLabels: Record<string, string> = {
  en: 'English',
  zh: '中文',
  de: 'Deutsch',
  es: 'Español',
  fr: 'Français',
  it: 'Italiano',
}

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
const currentLanguage = ref<string>(props.modelValue || getStoredLanguage())

const getLanguageLabel = (lang: string) => languageLabels[String(lang).toLowerCase()] || lang

const normalizeLanguageList = (languages: string[]) => {
  const unique = new Set([...REQUIRED_LANGUAGES, ...languages].map(lang => String(lang || '').toLowerCase()).filter(Boolean))
  return Array.from(unique).sort((a, b) => {
    if (a === DEFAULT_LOCALE) return -1
    if (b === DEFAULT_LOCALE) return 1
    if (a === 'zh') return -1
    if (b === 'zh') return 1
    return getLanguageLabel(a).localeCompare(getLanguageLabel(b))
  })
}

function getCookieLanguage() {
  const match = document.cookie
    .split('; ')
    .find(row => row.startsWith(`${SHARED_LOCALE_KEY}=`))
  return match ? decodeURIComponent(match.split('=').slice(1).join('=')) : ''
}

function persistLanguage(lang: string) {
  localStorage.setItem(SHARED_LOCALE_KEY, lang)
  const maxAge = 60 * 60 * 24 * 365
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${SHARED_LOCALE_KEY}=${encodeURIComponent(lang)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`
}

function getStoredLanguage() {
  const local = localStorage.getItem(SHARED_LOCALE_KEY)
  if (local) {
    try {
      const parsed = JSON.parse(local) as { currentLocale?: string }
      return parsed.currentLocale || local
    } catch {
      return local
    }
  }
  return getCookieLanguage() || DEFAULT_LOCALE
}

const switchLanguage = (lang: string) => {
  currentLanguage.value = lang
  persistLanguage(lang)
  document.documentElement.lang = lang
  emit('update:modelValue', lang)
  emit('change', lang)
}

const loadSystemLanguages = async () => {
  try {
    const res = await fetchSystemLanguages()
    if (res.code === 0 && res.data) {
      availableLanguages.value = normalizeLanguageList(res.data)
      emit('languages-loaded', availableLanguages.value)
      
      // Auto-select first language if no current language and autoSelectFirst is true
      if (props.autoSelectFirst && !currentLanguage.value && availableLanguages.value.length > 0) {
        switchLanguage(getStoredLanguage())
      } else if (currentLanguage.value && availableLanguages.value.includes(currentLanguage.value)) {
        switchLanguage(currentLanguage.value)
      }
    }
  } catch (e) {
    console.error('Failed to load system languages:', e)
  }
}

// Watch for external changes to modelValue
watch(() => props.modelValue, (newValue) => {
  currentLanguage.value = newValue || getStoredLanguage()
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
