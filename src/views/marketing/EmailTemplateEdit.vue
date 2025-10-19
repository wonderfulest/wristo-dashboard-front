<template>
  <div class="email-template-edit">
    <div class="header">
      <h2>编辑模板：{{ detail?.name || '-' }}</h2>
      <div class="header-actions">
        <el-button @click="backToList">返回列表</el-button>
        <el-button @click="openPreview" plain>预览</el-button>
        <el-button type="primary" :loading="saving" @click="saveHtml">保存</el-button>
      </div>
    </div>

    <el-form label-width="120px" class="meta-form">
      <el-form-item label="模板名称">
        <el-input v-model="detailEditable.name" disabled />
      </el-form-item>
      <el-form-item label="模板文件名">
        <el-input v-model="detailEditable.templateFileName" disabled />
      </el-form-item>
      <el-form-item label="邮件主题">
        <el-input v-model="detailEditable.subject" disabled />
      </el-form-item>
      <el-form-item label="变量说明">
        <el-input v-model="detailEditable.variables" type="textarea" :rows="3" :maxlength="200" show-word-limit />
      </el-form-item>
      <el-form-item label="变量 JSON">
        <el-input v-model="variablesJson" type="textarea" :rows="10" placeholder='{"userName":"测试"}' @blur="formatVariablesJson" />
      </el-form-item>
    </el-form>
    <div class="editor-block">
      <div class="editor-toolbar">
        <span>HTML 内容</span>
      </div>
      <el-input v-model="contentHtml" type="textarea" :rows="24" placeholder="在此编辑模板HTML..." />
    </div>

   
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store/user'
import { getEmailTemplateById, updateEmailTemplateHtml, previewEmailTemplateJson, updateEmailTemplate } from '@/api/email-template'
import type { EmailTemplate } from '@/types/email-template'
import { generateVariablesJsonFromHtml, formatJsonPretty } from '@/utils/mock-data'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const id = Number(route.params.id)
const loading = ref(false)
const saving = ref(false)
const detail = ref<EmailTemplate | null>(null)
const detailEditable = ref<Partial<EmailTemplate>>({})
const contentHtml = ref('')
const variablesJson = ref('')


const formatVariablesJson = () => {
  if (!variablesJson.value) return
  variablesJson.value = formatJsonPretty(variablesJson.value)
}

const fetchDetail = async () => {
  loading.value = true
  try {
    const res = await getEmailTemplateById(id)
    if (res.code === 0 && res.data) {
      detail.value = res.data
      detailEditable.value = { ...res.data }
      contentHtml.value = res.data.contentHtml || ''
      if (!variablesJson.value && contentHtml.value) {
        variablesJson.value = generateVariablesJsonFromHtml(contentHtml.value)
      }
    }
  } finally {
    loading.value = false
  }
}

const openPreview = async () => {
  try {
    if (variablesJson.value) {
      JSON.parse(variablesJson.value)
    }
  } catch {
    ElMessage.error('变量 JSON 无效')
    return
  }
  try {
    const res = await previewEmailTemplateJson(id, variablesJson.value)
    if (res.code === 0 && typeof res.data === 'string') {
      const w = window.open('', '_blank')
      if (w) {
        w.document.open()
        w.document.write(res.data)
        w.document.close()
      }
    }
  } catch {}
}

const saveHtml = async () => {
  saving.value = true
  try {
    const lastEditor = (userStore.userInfo as any)?.name || (userStore.userInfo as any)?.email || 'admin'
    // 仅提交 HTML 更新，不带 variables 字段，避免后端 DTO 不识别
    const res = await updateEmailTemplateHtml(id, { contentHtml: contentHtml.value, lastEditor })
    if (res.code === 0) {
      // 变量说明（短文本，<=200）单独保存
      const desc = (detailEditable.value?.variables || '').toString()
      if (desc.length > 200) {
        ElMessage.error('变量说明不能超过200字符')
        return
      }
      try {
        await updateEmailTemplate(id, { variables: desc } as any)
      } catch {}
      ElMessage.success('保存成功')
      await fetchDetail()
    }
  } finally {
    saving.value = false
  }
}

const backToList = () => {
  router.push({ path: '/marketing/email-templates' })
}

onMounted(fetchDetail)
</script>

<style scoped lang="scss">
.email-template-edit {
  padding: 24px;
  background: #fff;
  border-radius: 8px;
}
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.header-actions { display: flex; gap: 12px; }
.meta-form { margin-bottom: 16px; }
.editor-block { border: 1px solid #e5e6eb; border-radius: 8px; padding: 12px; background: #fafafa; }
.editor-toolbar { display: flex; gap: 12px; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.variables-block { margin-top: 16px; border: 1px solid #e5e6eb; border-radius: 8px; padding: 12px; background: #fafafa; }
</style>
