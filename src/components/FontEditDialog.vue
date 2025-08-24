<template>
  <el-dialog v-model="visible" title="编辑字体" width="560px" :close-on-click-modal="false">
    <el-form :model="form" label-width="120px">
      <el-form-item label="名称">
        <el-input v-model="form.fullName" />
      </el-form-item>
      <el-form-item label="PS 名称">
        <el-input v-model="form.postscriptName" />
      </el-form-item>
      <el-form-item label="Slug">
        <el-input v-model="form.slug" />
      </el-form-item>
      <el-form-item label="字族">
        <el-input v-model="form.family" />
      </el-form-item>
      <el-form-item label="子族">
        <el-input v-model="form.subfamily" />
      </el-form-item>
      <el-form-item label="语言">
        <el-input v-model="form.language" />
      </el-form-item>
      <el-form-item label="类型">
        <el-input v-model="form.type" />
      </el-form-item>
      <el-form-item label="字重">
        <el-input v-model="form.weight" />
      </el-form-item>
      <el-form-item label="Italic">
        <el-switch v-model="form.italic" :active-value="1" :inactive-value="0" />
      </el-form-item>
      <el-form-item label="等宽">
        <el-switch v-model="form.isMonospace" :active-value="1" :inactive-value="0" />
      </el-form-item>
      <el-form-item label="粗细等级">
        <el-input-number v-model="form.weightClass" :min="0" :max="1000" :controls="false" />
      </el-form-item>
      <el-form-item label="宽度等级">
        <el-input-number v-model="form.widthClass" :min="0" :max="1000" :controls="false" />
      </el-form-item>
      <el-form-item label="版本">
        <el-input v-model="form.versionName" />
      </el-form-item>
      <el-form-item label="字形数">
        <el-input-number v-model="form.glyphCount" :min="0" :controls="false" />
      </el-form-item>
      <el-form-item label="版权">
        <el-input v-model="form.copyright" type="textarea" autosize />
      </el-form-item>
      <el-form-item label="系统字体">
        <el-switch v-model="form.isSystem" :active-value="1" :inactive-value="0" />
      </el-form-item>
      <el-form-item label="TTF">
        <a v-if="font?.ttfFile?.url" :href="font?.ttfFile.url" target="_blank">下载当前 TTF</a>
        <span v-else>-</span>
      </el-form-item>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="onClose">取消</el-button>
        <el-button type="primary" :loading="saving" @click="onSave">保存</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, defineProps, defineEmits } from 'vue'
import type { DesignFontVO } from '@/types/font'
import { updateFont } from '@/api/fonts'
import { ElMessage } from 'element-plus'

const props = defineProps<{ modelValue: boolean, font?: DesignFontVO | null }>()
const emits = defineEmits<{ (e: 'update:modelValue', v: boolean): void; (e: 'saved'): void }>()

const visible = ref(false)
const saving = ref(false)
const font = ref<DesignFontVO | null>(null)

const form = ref<Partial<DesignFontVO>>({})

watch(() => props.modelValue, v => visible.value = v)
watch(() => props.font, (v) => {
  font.value = v || null
  if (v) {
    form.value = {
      fullName: v.fullName,
      postscriptName: v.postscriptName,
      slug: v.slug,
      family: v.family,
      subfamily: v.subfamily,
      language: v.language,
      type: v.type,
      weight: v.weight,
      italic: v.italic ?? 0,
      isMonospace: v.isMonospace ?? 0,
      weightClass: v.weightClass,
      widthClass: v.widthClass,
      versionName: v.versionName,
      glyphCount: v.glyphCount,
      copyright: v.copyright,
      isSystem: v.isSystem,
    }
  } else {
    form.value = {}
  }
}, { immediate: true })

const onClose = () => {
  emits('update:modelValue', false)
}

const onSave = async () => {
  if (!font.value) return
  saving.value = true
  try {
    const resp = await updateFont(font.value.id, form.value)
    if ((resp as any).code === 0) {
      ElMessage.success('保存成功')
      emits('saved')
      emits('update:modelValue', false)
    }
  } catch (e: any) {
    ElMessage.error(e?.msg || '保存失败')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.dialog-footer { display: inline-flex; gap: 8px; }
</style>
