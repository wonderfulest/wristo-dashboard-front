<template>
  <div class="email-records-container">
    <div class="header">
      <h2>邮件发送历史</h2>
      <div style="display: flex; gap: 12px; align-items: center;">
        <el-input
          v-model="toEmail"
          placeholder="按邮箱地址搜索"
          clearable
          style="width: 260px"
          @keyup.enter.native="handleSearch"
        />
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>
    </div>

    <el-table :data="records" style="width: 100%" v-loading="loading">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="uuid" label="UUID" min-width="260" />
      <el-table-column prop="templateId" label="模板ID" width="100" />
      <el-table-column prop="toEmail" label="收件人" min-width="200" />
      <el-table-column prop="sendChannel" label="发送渠道" min-width="140" />
      <el-table-column label="变量" min-width="220">
        <template #default="{ row }">
          <el-tooltip :content="row.variables" placement="top">
            <span class="variables-text">{{ truncate(row.variables, 60) }}</span>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : row.status === 0 ? 'info' : 'danger'">
            {{ renderStatus(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="retryCount" label="重试次数" width="100" />
      <el-table-column label="最后发送时间" width="180">
        <template #default="{ row }">{{ formatDateTime(row.lastSendTime) }}</template>
      </el-table-column>
      <el-table-column label="创建时间" width="180">
        <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="更新时间" width="180">
        <template #default="{ row }">{{ formatDateTime(row.updatedAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" fixed="right" width="140">
        <template #default="{ row }">
          <el-button
            v-if="row.status !== 1 && row.status !== 0"
            type="primary"
            link
            @click="confirmResend(row)"
          >重发</el-button>
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
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { fetchEmailSendRecordPage, resendEmailRecord } from '@/api/contact'
import type { EmailSendRecord } from '@/types/contact'
import { formatDateTime } from '@/utils/date'

const loading = ref(false)
const records = ref<EmailSendRecord[]>([])
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)
const toEmail = ref('')

const renderStatus = (status: number) => {
  if (status === 1) return '成功'
  if (status === 0) return '待发送'
  return '失败'
}

const truncate = (text: string, len = 80) => {
  if (!text) return ''
  return text.length > len ? text.slice(0, len) + '…' : text
}

const fetchPage = async () => {
  loading.value = true
  try {
    const res = await fetchEmailSendRecordPage({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      orderBy: 'created_at desc',
      toEmail: toEmail.value?.trim() || undefined
    })
    if (res.code === 0 && res.data) {
      records.value = res.data.list
      total.value = res.data.total
    } else {
      ElMessage.error(res.msg || '获取邮件发送记录失败')
    }
  } catch (e) {
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
  toEmail.value = ''
  pageNum.value = 1
  fetchPage()
}

const confirmResend = async (row: EmailSendRecord) => {
  try {
    await ElMessageBox.confirm(
      `确定要重发该邮件吗？\nID: ${row.id}\n收件人: ${row.toEmail}`,
      '确认重发',
      { type: 'warning', confirmButtonText: '重发', cancelButtonText: '取消' }
    )
  } catch {
    return
  }
  try {
    const res = await resendEmailRecord(row.id)
    if (res.code === 0) {
      ElMessage.success('已提交重发')
      fetchPage()
    } else {
      ElMessage.error(res.msg || '重发失败')
    }
  } catch (e) {
  }
}

onMounted(() => {
  fetchPage()
})
</script>

<style scoped lang="scss">
.email-records-container {
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
.variables-text {
  display: inline-block;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}
</style>
