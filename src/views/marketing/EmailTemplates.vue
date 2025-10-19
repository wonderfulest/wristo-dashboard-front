<template>
  <div class="email-templates">
    <div class="header">
      <h2>邮件模板管理</h2>
      <div class="actions">
        <el-input v-model="searchName" placeholder="按模板名搜索" clearable style="width: 220px" @keyup.enter.native="handleSearch" />
        <el-input v-model="searchFile" placeholder="按文件名搜索" clearable style="width: 220px" @keyup.enter.native="handleSearch" />
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
        <el-button type="success" @click="openCreate">新建模板</el-button>
      </div>
    </div>

    <el-table :data="list" v-loading="loading" style="width: 100%">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="模板名称" min-width="180" />
      <el-table-column prop="templateFileName" label="文件名" min-width="220" />
      <el-table-column prop="subject" label="邮件主题" min-width="220" />
      <el-table-column label="是否激活" width="100">
        <template #default="{ row }">
          <el-tag :type="row.isActive === 1 ? 'success' : 'info'">{{ row.isActive === 1 ? '是' : '否' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="lastEditor" label="最后编辑人" width="140" />
      <el-table-column label="更新时间" width="180">
        <template #default="{ row }">{{ formatDateTime(row.updatedAt) }}</template>
      </el-table-column>
      <el-table-column fixed="right" label="操作" width="260">
        <template #default="{ row }">
          <el-button type="primary" link @click="openPreview(row)">预览</el-button>
          <el-button type="primary" link @click="goEdit(row)">编辑</el-button>
          <el-button link @click="openTestSend(row)">测试发送</el-button>
          <el-popconfirm title="确定删除该模板吗？" @confirm="doDelete(row)">
            <template #reference>
              <el-button type="danger" link>删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination">
      <el-pagination
        v-model:current-page="pageNum"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <el-dialog v-model="testSendVisible" title="测试发送" width="800">
      <el-form label-width="80px">
        <el-form-item label="目标邮箱">
          <el-input v-model="testToEmail" placeholder="example@domain.com" />
        </el-form-item>
        <el-form-item label="变量JSON">
          <el-input v-model="testVariables" type="textarea" :rows="10" placeholder='{"userName":"测试"}' />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="testSendVisible=false">取消</el-button>
        <el-button type="primary" :loading="testSending" @click="doTestSend">发送</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="createVisible" title="新建邮件模板" width="560">
      <el-form ref="createFormRef" :model="createForm" label-width="100px">
        <el-form-item label="模板名称" prop="name">
          <el-input v-model="createForm.name" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="邮件主题" prop="subject">
          <el-input v-model="createForm.subject" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="模板文件名" prop="templateFileName">
          <el-input v-model="createForm.templateFileName" placeholder="如 welcome.html" maxlength="100" />
        </el-form-item>
        <el-form-item label="发件人邮箱" prop="fromEmail">
          <el-input v-model="createForm.fromEmail" placeholder="noreply@example.com" />
        </el-form-item>
        <el-form-item label="变量说明" prop="variables">
          <el-input v-model="createForm.variables" type="textarea" :rows="3" maxlength="200" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible=false">取消</el-button>
        <el-button type="primary" :loading="creating" @click="doCreate">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { formatDateTime } from '@/utils/date'
import {
  fetchEmailTemplatePage,
  deleteEmailTemplate,
  previewEmailTemplateJson,
  testSendEmailTemplate,
  getEmailTemplateById,
  createEmailTemplate
} from '@/api/email-template'
import type { EmailTemplate } from '@/types/email-template'
import { generateVariablesJsonFromHtml } from '@/utils/mock-data'

const router = useRouter()

const loading = ref(false)
const list = ref<EmailTemplate[]>([])
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)
const searchName = ref('')
const searchFile = ref('')

const testSendVisible = ref(false)
const testSending = ref(false)
const testToEmail = ref('')
const testVariables = ref('')
let currentRow: EmailTemplate | null = null

const createVisible = ref(false)
const creating = ref(false)
const createFormRef = ref()
const createForm = ref({
  name: '',
  subject: '',
  templateFileName: '',
  fromEmail: '',
  variables: ''
})

const fetchPage = async () => {
  loading.value = true
  try {
    const res = await fetchEmailTemplatePage({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      orderBy: 'updated_at desc',
      name: searchName.value?.trim() || undefined,
      templateFileName: searchFile.value?.trim() || undefined
    })
    if (res.code === 0 && res.data) {
      list.value = res.data.list
      total.value = res.data.total
    }
  } finally {
    loading.value = false
  }
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  pageNum.value = 1
  fetchPage()
}

const handleCurrentChange = (page: number) => {
  pageNum.value = page
  fetchPage()
}

const handleSearch = () => {
  pageNum.value = 1
  fetchPage()
}

const handleReset = () => {
  searchName.value = ''
  searchFile.value = ''
  pageNum.value = 1
  fetchPage()
}

const openCreate = () => {
  createForm.value = { name: '', subject: '', templateFileName: '', fromEmail: '', variables: '' }
  createVisible.value = true
}

const doCreate = async () => {
  if (!createForm.value.name || !createForm.value.subject || !createForm.value.templateFileName || !createForm.value.fromEmail) {
    ElMessage.error('请完整填写必填项')
    return
  }
  creating.value = true
  try {
    const res = await createEmailTemplate({
      name: createForm.value.name.trim(),
      subject: createForm.value.subject.trim(),
      templateFileName: createForm.value.templateFileName.trim(),
      fromEmail: createForm.value.fromEmail.trim(),
      variables: createForm.value.variables?.trim() || ''
    })
    if (res.code === 0 && res.data) {
      ElMessage.success('创建成功')
      createVisible.value = false
      await fetchPage()
      router.push({ path: `/marketing/email-templates/${res.data.id}/edit` })
    }
  } finally {
    creating.value = false
  }
}

const openPreview = async (row: EmailTemplate) => {
  try {
    const res = await previewEmailTemplateJson(row.id)
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

const goEdit = (row: EmailTemplate) => {
  router.push({ path: `/marketing/email-templates/${row.id}/edit` })
}

const openTestSend = async (row: EmailTemplate) => {
  currentRow = row
  testToEmail.value = ''
  testVariables.value = ''
  try {
    const res = await getEmailTemplateById(row.id)
    if (res.code === 0 && res.data) {
      const html = res.data.contentHtml || ''
      if (html) testVariables.value = generateVariablesJsonFromHtml(html)
    }
  } catch {}
  testSendVisible.value = true
}

const doTestSend = async () => {
  if (!currentRow) return
  if (!testToEmail.value) {
    ElMessage.error('请输入目标邮箱')
    return
  }
  testSending.value = true
  try {
    const res = await testSendEmailTemplate(currentRow.id, testToEmail.value, testVariables.value || '{}')
    if (res.code === 0) {
      ElMessage.success('测试邮件已发送')
      testSendVisible.value = false
    }
  } finally {
    testSending.value = false
  }
}

const doDelete = async (row: EmailTemplate) => {
  try {
    const res = await deleteEmailTemplate(row.id)
    if (res.code === 0) {
      ElMessage.success('删除成功')
      fetchPage()
    }
  } catch {}
}

onMounted(fetchPage)
</script>

<style scoped lang="scss">
.email-templates {
  padding: 24px;
  background: #fff;
  border-radius: 8px;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.actions { display: flex; gap: 12px; align-items: center; }
.pagination { margin-top: 16px; display: flex; justify-content: center; }
</style>
