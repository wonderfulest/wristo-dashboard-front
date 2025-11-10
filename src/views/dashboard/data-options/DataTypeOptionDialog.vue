<template>
  <el-dialog v-model="visibleLocal" :title="titleText" width="700px">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <div class="form-grid">
        <el-form-item label="Symbol" prop="metricSymbol" class="full">
          <el-input v-model="form.metricSymbol" style="width: 300px" />
        </el-form-item>
        <el-form-item label="Category" prop="category">
          <el-select v-model="form.category" placeholder="Category">
            <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item label="Value Code" prop="valueCode">
          <el-input-number v-model="form.valueCode" :min="0" />
        </el-form-item>
        <el-form-item label="Label (EN)" prop="label">
          <el-input v-model="form.label" />
        </el-form-item>
        <el-form-item label="Label (CN)" prop="zhsLong">
          <el-input v-model="form.zhsLong" />
        </el-form-item>
        <el-form-item label="Unit" prop="unit">
          <el-input v-model="form.unit" />
        </el-form-item>
        <el-form-item label="Icon Unicode" prop="iconUnicode">
          <el-input v-model="form.iconUnicode" />
        </el-form-item>
        <el-form-item label="Icon Rules" class="full">
          <DataOptionIconRulesEditor
            v-model:enabled="switchIconRules"
            v-model="form.iconRules"
          />
        </el-form-item>
        <el-form-item label="Default Value" prop="defaultValue">
          <el-input v-model="form.defaultValue" />
        </el-form-item>
        
        <el-form-item label="Active" prop="isActive">
          <el-switch v-model="switchActive" />
        </el-form-item>
        <el-form-item label="Sort Order" prop="sortOrder">
          <el-input-number v-model="form.sortOrder" :min="0" />
        </el-form-item>
        <el-form-item label="Description" prop="description" class="full">
          <el-input type="textarea" v-model="form.description" :rows="3" />
        </el-form-item>
      </div>
    </el-form>
    <template #footer>
      <el-button @click="onCancel">Cancel</el-button>
      <el-button type="primary" @click="onSave">Save</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import DataOptionIconRulesEditor from './DataOptionIconRulesEditor.vue'
import type { PropType } from 'vue'
import type { DataTypeOptionCreateDTO, DataTypeOptionUpdateDTO, IconRules } from '@/types/data-type-option'
import { createDataTypeOption, updateDataTypeOption } from '@/api/data-type-options'

const props = defineProps({
  visible: { type: Boolean, default: false },
  type: { type: String as PropType<'add'|'edit'>, default: 'add' },
  form: { type: Object as PropType<Partial<DataTypeOptionUpdateDTO> & { zhsLong?: string }>, required: true },
  categories: { type: Array as PropType<string[]>, default: () => [] }
})

const emit = defineEmits<{
  (e: 'update:visible', v: boolean): void
  (e: 'saved'): void
}>()

const visibleLocal = ref(props.visible)
watch(() => props.visible, v => visibleLocal.value = v)
watch(visibleLocal, v => emit('update:visible', v))

const titleText = computed(() => props.type === 'add' ? 'Add Data Type Option' : 'Edit Data Type Option')

const formRef = ref()

// local switches and watchers for form sync
const switchActive = ref((props.form.isActive ?? 1) === 1)
watch(switchActive, v => { props.form.isActive = v ? 1 : 0 })
watch(() => props.form.isActive, v => { switchActive.value = (v ?? 1) === 1 })

const switchIconRules = ref(!!(props.form as any).iconRules)
watch(switchIconRules, (v) => {
  if (!v) {
    props.form.iconRules = undefined
  } else {
    if (!props.form.iconRules) {
      props.form.iconRules = { type: 'boolean', icons: {} } as IconRules
    }
  }
})

watch(() => props.form.iconRules?.type, (t) => {
  if (!t) return
  if (t === 'numeric') {
    if (!props.form.iconRules) props.form.iconRules = { type: 'numeric' } as IconRules
    if (!props.form.iconRules!.ranges) props.form.iconRules!.ranges = []
  } else {
    if (!props.form.iconRules) props.form.iconRules = { type: t } as IconRules
    if (!props.form.iconRules!.icons) props.form.iconRules!.icons = {}
  }
})

const rules = {
  metricSymbol: [{ required: true, message: 'Metric symbol required', trigger: 'blur' }],
  category: [{ required: true, message: 'Category required', trigger: 'change' }],
  valueCode: [{ required: true, message: 'Value code required', trigger: 'change' }],
  label: [{ required: true, message: 'Label required', trigger: 'blur' }],
  zhsLong: [{ required: true, message: '中文标签必填', trigger: 'blur' }]
}

function onCancel() {
  visibleLocal.value = false
}

function onSave() {
  formRef.value.validate(async (valid: boolean) => {
    if (!valid) return
    if (props.type === 'add') {
      const payload: DataTypeOptionCreateDTO = {
        metricSymbol: props.form.metricSymbol || '',
        category: props.form.category || 'field',
        valueCode: Number(props.form.valueCode ?? 0),
        label: props.form.label || '',
        labelI18n: {
          zhs: { long: props.form.zhsLong || '' }
        },
        unit: props.form.unit || '',
        iconUnicode: props.form.iconUnicode || '',
        defaultValue: props.form.defaultValue || '',
        isActive: typeof props.form.isActive === 'number' ? props.form.isActive : 1,
        sortOrder: Number(props.form.sortOrder ?? 1),
        description: props.form.description || '',
        iconRules: switchIconRules.value ? (props.form.iconRules as any) : ({} as any)
      }
      await createDataTypeOption(payload)
      ElMessage.success('Added successfully')
    } else {
      const payload: DataTypeOptionUpdateDTO = {
        id: Number(props.form.id),
        metricSymbol: props.form.metricSymbol || '',
        category: props.form.category || 'field',
        valueCode: Number(props.form.valueCode ?? 0),
        label: props.form.label || '',
        labelI18n: {
          zhs: { long: props.form.zhsLong || '' }
        },
        unit: props.form.unit || '',
        iconUnicode: props.form.iconUnicode || '',
        defaultValue: props.form.defaultValue || '',
        isActive: typeof props.form.isActive === 'number' ? props.form.isActive : 1,
        sortOrder: Number(props.form.sortOrder ?? 1),
        description: props.form.description || '',
        iconRules: switchIconRules.value ? (props.form.iconRules as any) : ({} as any)
      }
      await updateDataTypeOption(Number(props.form.id), payload)
      ElMessage.success('Updated successfully')
    }
    visibleLocal.value = false
    emit('saved')
  })
}
</script>

<style scoped>
.form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px 24px; }
.form-grid .full { grid-column: 1 / -1; }
</style>
