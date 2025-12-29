<template>
  <div class="contact-us-page">
    <div class="filters">
      <el-input
        v-model="emailKeyword"
        placeholder="用户邮箱"
        clearable
        class="filter-input"
        @keyup.enter.native="search(1)"
      />
      <el-select
        v-model="statusFilter"
        placeholder="状态"
        clearable
        class="filter-select"
      >
        <el-option :value="0" label="待处理" />
        <el-option :value="1" label="已回复" />
        <el-option :value="2" label="已关闭" />
      </el-select>
      <el-button type="primary" @click="search(1)">搜索</el-button>
      <el-button @click="reset">重置</el-button>
    </div>

    <el-table :data="pageData.list" v-loading="loading" border style="width: 100%">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="姓名" width="140" />
      <el-table-column prop="email" label="邮箱" min-width="200" />
      <el-table-column prop="subject" label="主题" min-width="220" />
      <el-table-column label="状态" width="120">
        <template #default="{ row }">
          <el-tag size="small" :type="statusTagType(row.status)">{{ formatStatus(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" width="180" />
      <el-table-column label="操作" width="320" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="openDetail(row)">查看</el-button>
          <el-divider direction="vertical" />
          <el-button type="success" link @click="openReply(row)">回复</el-button>
          <el-divider direction="vertical" />
          <el-button type="warning" link @click="markReplied(row)">标记已回复</el-button>
          <el-divider direction="vertical" />
          <el-button type="danger" link @click="closeItem(row)">关闭</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination" v-if="pageData.total > 0">
      <el-pagination
        v-model:current-page="pageData.pageNum"
        v-model:page-size="pageData.pageSize"
        :total="pageData.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @size-change="changeSize"
        @current-change="changePage"
      />
    </div>

    <el-dialog v-model="detailVisible" title="反馈详情" width="640px">
      <ContactDetailCard
        :contact="current"
        :show-reply-buttons="true"
        @reply="handleReplyNode"
      />
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 针对某条消息的回复表单 -->
    <el-dialog v-model="replyVisible" title="回复用户" width="640px">
      <el-form :model="replyForm" label-width="80px">
        <el-form-item label="主题">
          <el-input v-model="replyForm.subject" placeholder="回复主题" />
        </el-form-item>
        <el-form-item label="内容">
          <el-input v-model="replyForm.content" type="textarea" :rows="6" placeholder="回复内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="replyVisible = false">取消</el-button>
        <el-button type="primary" :loading="replyLoading" @click="submitReply">发送</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { PageResponse } from '@/types/api'
import type { ContactUsVO, ContactUsQueryDTO, ContactUsReplyDTO } from '@/types/contact'
import { pageContactUs, getContactUs, replyContactUs, closeContactUs, markRepliedContactUs } from '@/api/contact'
import ContactDetailCard from '@/components/contact/ContactDetailCard.vue'

const loading = ref(false)
const pageData = ref<PageResponse<ContactUsVO>>({ pageNum: 1, pageSize: 20, total: 0, pages: 0, list: [] })

const emailKeyword = ref('')
const statusFilter = ref<number | undefined>(undefined)

const query = reactive<ContactUsQueryDTO>({
  pageNum: 1,
  pageSize: 20,
  status: undefined,
  email: undefined
})

const detailVisible = ref(false)
const current = ref<ContactUsVO | null>(null)

// 针对某条消息的回复表单状态
const replyVisible = ref(false)
const replyLoading = ref(false)
const replyForm = reactive<ContactUsReplyDTO>({
  subject: '',
  content: ''
})
const replyTargetId = ref<number | null>(null)

const formatStatus = (status?: number | null) => {
  if (status === 0) return '待处理'
  if (status === 1) return '已回复'
  if (status === 2) return '已关闭'
  return '未知'
}

const statusTagType = (status?: number | null) => {
  if (status === 0) return 'warning'
  if (status === 1) return 'success'
  if (status === 2) return 'info'
  return 'info'
}

const buildQuery = (pageNum = 1) => {
  query.pageNum = pageNum
  query.email = emailKeyword.value ? emailKeyword.value.trim() : undefined
  query.status = typeof statusFilter.value === 'number' ? statusFilter.value : undefined
}

const search = async (pageNum = 1) => {
  try {
    loading.value = true
    buildQuery(pageNum)
    const res = await pageContactUs(query)
    if (res.code === 0 && res.data) {
      pageData.value = res.data
    } else {
      ElMessage.error(res.msg || '加载失败')
    }
  } catch (e) {
    ElMessage.error('请求失败')
  } finally {
    loading.value = false
  }
}

const reset = () => {
  emailKeyword.value = ''
  statusFilter.value = undefined
  search(1)
}

const changePage = (p: number) => {
  if (p >= 1 && p <= pageData.value.pages) {
    search(p)
  }
}

const changeSize = (size: number) => {
  query.pageSize = size
  search(1)
}

const openDetail = async (row: ContactUsVO) => {
  try {
    const res = await getContactUs(row.id)
    if (res.code === 0 && res.data) {
      current.value = res.data
    } else {
      current.value = row
    }
    detailVisible.value = true
  } catch (e) {
    current.value = row
    detailVisible.value = true
  }
}

const openReply = async (row: ContactUsVO) => {
  // 直接复用查看逻辑：打开会话详情弹窗，在详情中点击具体消息进行回复
  await openDetail(row)
}

// 在会话树中点击某一条消息下方的“回复”时，打开单页表单对话框
const handleReplyNode = (node: ContactUsVO) => {
  // 先确定默认主题：优先使用该节点的 subject，退化到会话根 subject
  let defaultSubject = ''
  if (node.subject && node.subject.trim()) {
    const base = node.subject.trim()
    defaultSubject = base.startsWith('Re:') ? base : `Re: ${base}`
  } else if (current.value?.subject) {
    const base = current.value.subject.trim()
    defaultSubject = base.startsWith('Re:') ? base : `Re: ${base}`
  }
  replyTargetId.value = node.id
  replyForm.subject = defaultSubject
  replyForm.content = ''
  replyVisible.value = true
}

const submitReply = async () => {
  if (!replyTargetId.value) return
  if (!replyForm.subject.trim()) {
    ElMessage.error('请输入回复主题')
    return
  }
  if (!replyForm.content.trim()) {
    ElMessage.error('请输入回复内容')
    return
  }

  try {
    replyLoading.value = true
    const dto: ContactUsReplyDTO = {
      subject: replyForm.subject.trim(),
      content: replyForm.content.trim()
    }
    const res = await replyContactUs(replyTargetId.value, dto)
    if (res.code === 0) {
      ElMessage.success('回复已发送')
      replyVisible.value = false
      // 刷新当前会话和列表
      if (current.value) {
        await openDetail(current.value)
      }
      search(pageData.value.pageNum)
    } else {
      ElMessage.error(res.msg || '发送失败')
    }
  } catch (e) {
    ElMessage.error('发送失败')
  } finally {
    replyLoading.value = false
  }
}

const markReplied = async (row: ContactUsVO) => {
  try {
    const res = await markRepliedContactUs(row.id)
    if (res.code === 0) {
      ElMessage.success('已标记为已回复')
      search(pageData.value.pageNum)
    } else {
      ElMessage.error(res.msg || '操作失败')
    }
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

const closeItem = async (row: ContactUsVO) => {
  try {
    await ElMessageBox.confirm('确认关闭该反馈吗？', '提示', { type: 'warning' })
  } catch {
    return
  }

  try {
    const res = await closeContactUs(row.id)
    if (res.code === 0) {
      ElMessage.success('已关闭')
      search(pageData.value.pageNum)
    } else {
      ElMessage.error(res.msg || '关闭失败')
    }
  } catch (e) {
    ElMessage.error('关闭失败')
  }
}

onMounted(() => {
  search(1)
})
</script>

<style scoped>
.contact-us-page {
  padding: 24px;
  background: #fff;
  min-height: 300px;
  text-align: left;
}
.filters { display: flex; gap: 12px; align-items: center; margin-bottom: 16px; flex-wrap: wrap; }
.filter-input { width: 220px; }
.filter-select { width: 180px; }
.pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
.multiline { white-space: pre-wrap; word-break: break-word; text-align: left; }
</style>
