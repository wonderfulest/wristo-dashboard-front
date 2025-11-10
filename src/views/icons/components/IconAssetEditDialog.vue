<template>
  <el-dialog v-model="visibleInner" title="编辑 Icon 素材" width="520px" :close-on-click-modal="false" @closed="onClosed">
    <el-form :model="form" label-width="110px">
      <el-form-item label="sourceType">
        <el-input v-model="form.sourceType" placeholder="如 manual" />
      </el-form-item>
      <el-form-item label="format">
        <el-input v-model="form.format" placeholder="如 svg/png" />
      </el-form-item>
      <el-form-item label="displayType">
        <el-select v-model="form.displayType" placeholder="选择显示类型" filterable clearable :loading="loadingEnums">
          <el-option v-for="opt in displayTypeOptions" :key="opt.value" :label="opt.name || opt.value" :value="opt.value" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="visibleInner = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { getIconAsset, updateIconAsset } from '@/api/icon-asset'
import { listEnumOptions, type EnumOption } from '@/api/common'

interface Props {
  modelValue: boolean
  assetId: number | null
}

const props = defineProps<Props>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void; (e: 'saved'): void }>()

const visibleInner = ref(false)
const saving = ref(false)
const loadingEnums = ref(false)

const form = ref<{ sourceType?: string; format?: string; displayType?: string }>({})
const displayTypeOptions = ref<EnumOption[]>([])

watch(() => props.modelValue, v => { visibleInner.value = v })
watch(visibleInner, v => emit('update:modelValue', v))

async function loadEnums() {
  if (displayTypeOptions.value.length > 0) return
  loadingEnums.value = true
  try {
    const resp = await listEnumOptions('DisplayType')
    const list = (resp as any)?.data || []
    displayTypeOptions.value = Array.isArray(list) ? list : []
  } catch {
    // silent
  } finally {
    loadingEnums.value = false
  }
}

watch(() => props.assetId, async (id) => {
  if (!visibleInner.value || !id) return
  await ensureData(id)
})

watch(visibleInner, async (v) => {
  if (v && props.assetId) {
    await ensureData(props.assetId)
  }
})

async function ensureData(id: number) {
  form.value = {}
  await loadEnums()
  try {
    const resp = await getIconAsset(id)
    const data: any = (resp as any)?.data
    form.value = {
      sourceType: data?.sourceType || '',
      format: data?.format || '',
      displayType: data?.displayType || ''
    }
  } catch (e) {
    ElMessage.error('获取素材详情失败')
  }
}

function onClosed() {
  form.value = {}
}

async function save() {
  if (!props.assetId) return
  saving.value = true
  try {
    await updateIconAsset(props.assetId, {
      sourceType: form.value.sourceType,
      format: form.value.format,
      displayType: form.value.displayType
    })
    ElMessage.success('保存成功')
    visibleInner.value = false
    emit('saved')
  } catch (e) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}
</script>
