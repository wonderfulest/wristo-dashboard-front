<template>
  <div class="icon-rules-editor">
    <div class="row">
      <el-switch v-model="enabledLocal" @change="onToggle" />
      <span>{{ enabledLocal ? 'Enabled' : 'Disabled' }}</span>
      <el-select v-model="rulesLocal.type" placeholder="type" style="width: 160px" :disabled="!enabledLocal" @change="emitRules">
        <el-option label="boolean" value="boolean" />
        <el-option label="numeric" value="numeric" />
        <el-option label="enum" value="enum" />
      </el-select>
    </div>

    <div v-if="enabledLocal && rulesLocal.type === 'boolean'" class="block">
      <div class="inputs">
        <span style="width: 60px; color: #666">true</span>
        <IconSearchSelect v-model="trueIcon" placeholder="icon" :width="260" />
      </div>
      <div class="inputs">
        <span style="width: 60px; color: #666">false</span>
        <IconSearchSelect v-model="falseIcon" placeholder="icon" :width="260" />
      </div>
    </div>

    <div v-if="enabledLocal && rulesLocal.type === 'enum'" class="block">
      <div class="inputs">
        <el-input v-model="iconPairKey" placeholder="key" style="width: 300px" />
        <IconSearchSelect v-model="iconPairVal" placeholder="icon" :width="200" />
        <el-button size="small" @click="addIconPair">Add</el-button>
      </div>
      <div
        class="inputs"
        v-for="(value, key) in rulesLocal.icons"
        :key="key"
      >
        <el-input :model-value="key" @update:modelValue="(nv?: string) => renameIconKey(key, nv || '')" placeholder="key" style="width: 300px" />
        <IconSearchSelect :model-value="value" @update:modelValue="(nv?: string) => updateIconValue(key, nv)" placeholder="icon" :width="200" />
        <el-button size="small" type="danger" @click="removeIconPair(key)">Del</el-button>
      </div>
    </div>

    <div v-if="enabledLocal && rulesLocal.type === 'numeric'" class="block">
      <div class="inputs">
        <el-input-number v-model="rangeMin" :min="-Infinity as any" :max="Infinity as any" placeholder="min" style="width: 220px" />
        <el-input-number v-model="rangeMax" :min="-Infinity as any" :max="Infinity as any" placeholder="max" style="width: 220px" />
        <IconSearchSelect v-model="rangeIcon" placeholder="icon" :width="240" />
        <el-button size="small" @click="addRange">Add</el-button>
      </div>
      <el-table :data="rulesLocal.ranges || []" size="small" style="width: 100%">
        <el-table-column label="Min" width="220">
          <template #default="{ row }">{{ row.min }}</template>
        </el-table-column>
        <el-table-column label="Max" width="220">
          <template #default="{ row }">{{ row.max }}</template>
        </el-table-column>
        <el-table-column label="Icon">
          <template #default="{ row }">{{ row.icon }}</template>
        </el-table-column>
        <el-table-column label="" width="80">
          <template #default="{ $index }">
            <el-button link type="danger" size="small" @click="removeRange($index)">Del</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch, computed } from 'vue'
import type { IconRules, IconRange } from '@/types/data-type-option'
import IconSearchSelect from '@/components/icon/IconSearchSelect.vue'

const props = defineProps<{
  enabled: boolean
  modelValue?: IconRules
}>()

const emit = defineEmits<{
  (e: 'update:enabled', v: boolean): void
  (e: 'update:modelValue', v?: IconRules): void
}>()

const enabledLocal = ref<boolean>(props.enabled)
watch(() => props.enabled, v => { enabledLocal.value = v })

const rulesLocal = reactive<IconRules>({ type: 'boolean', icons: {}, ranges: [] })

watch(
  () => props.modelValue,
  v => {
    if (!v) {
      Object.assign(rulesLocal, { type: 'boolean', icons: {}, ranges: [] })
    } else {
      Object.assign(rulesLocal, { type: v.type, icons: v.icons || {}, ranges: v.ranges || [] })
      if (!enabledLocal.value) {
        enabledLocal.value = true
        emit('update:enabled', true)
      }
    }
  },
  { immediate: true }
)

// Ensure boolean type has true/false keys prepared
watch(
  () => rulesLocal.type,
  (t) => {
    if (t === 'boolean') {
      if (!rulesLocal.icons) rulesLocal.icons = {}
      if (rulesLocal.icons['true'] === undefined) rulesLocal.icons['true'] = ''
      if (rulesLocal.icons['false'] === undefined) rulesLocal.icons['false'] = ''
      emitRules()
    } else if (t === 'enum') {
      if (!rulesLocal.icons) rulesLocal.icons = {}
      emitRules()
    }
  },
  { immediate: true }
)

// computed proxies for boolean icons
const trueIcon = computed<string | undefined>({
  get: () => (rulesLocal.icons ? (rulesLocal.icons as any)['true'] : ''),
  set: (v) => {
    if (!rulesLocal.icons) (rulesLocal.icons as any) = {}
    ;(rulesLocal.icons as any)['true'] = v || ''
    emitRules()
  }
})

const falseIcon = computed<string | undefined>({
  get: () => (rulesLocal.icons ? (rulesLocal.icons as any)['false'] : ''),
  set: (v) => {
    if (!rulesLocal.icons) (rulesLocal.icons as any) = {}
    ;(rulesLocal.icons as any)['false'] = v || ''
    emitRules()
  }
})

function onToggle(v: boolean) {
  emit('update:enabled', v)
  if (!v) emit('update:modelValue', undefined)
  else emit('update:modelValue', { ...rulesLocal })
}

function emitRules() {
  if (!enabledLocal.value) return
  emit('update:modelValue', { ...rulesLocal })
}

const iconPairKey = ref('')
const iconPairVal = ref('')

function addIconPair() {
  const k = iconPairKey.value.trim()
  const v = iconPairVal.value.trim()
  if (!k || !v) return
  if (!rulesLocal.icons) rulesLocal.icons = {}
  rulesLocal.icons[k] = v
  iconPairKey.value = ''
  iconPairVal.value = ''
  emitRules()
}

function removeIconPair(k: string) {
  if (rulesLocal.icons && rulesLocal.icons[k]) {
    delete rulesLocal.icons[k]
    emitRules()
  }
}

function renameIconKey(oldKey: string, newKey: string) {
  const from = (oldKey || '').trim()
  const to = (newKey || '').trim()
  if (!from) return
  if (to === from) return
  if (!rulesLocal.icons) rulesLocal.icons = {}
  const val = rulesLocal.icons[from]
  delete rulesLocal.icons[from]
  if (to) {
    rulesLocal.icons[to] = val
  }
  emitRules()
}

function updateIconValue(key: string, nv?: string) {
  const k = (key || '').trim()
  if (!k) return
  if (!rulesLocal.icons) rulesLocal.icons = {}
  rulesLocal.icons[k] = (nv || '').trim()
  emitRules()
}

watch(
  () => rulesLocal.icons,
  () => {
    emitRules()
  },
  { deep: true }
)

const rangeMin = ref<number | undefined>(undefined)
const rangeMax = ref<number | undefined>(undefined)
const rangeIcon = ref('')

function addRange() {
  if (!rulesLocal.ranges) rulesLocal.ranges = []
  const item: IconRange = { min: rangeMin.value, max: rangeMax.value, icon: rangeIcon.value.trim() }
  if (!item.icon) return
  rulesLocal.ranges.push(item)
  rangeMin.value = undefined
  rangeMax.value = undefined
  rangeIcon.value = ''
  emitRules()
}

function removeRange(idx: number) {
  if (rulesLocal.ranges) {
    rulesLocal.ranges.splice(idx, 1)
    emitRules()
  }
}

</script>

<style scoped>
.icon-rules-editor { display: flex; flex-direction: column; gap: 8px; width: 100%; }
.row { display:flex; align-items:center; gap: 12px; }
.block { width: 100%; }
.inputs { display:flex; gap:8px; align-items:center; margin-bottom:6px; }
.tag { margin-right:6px; margin-bottom:6px; }
</style>
