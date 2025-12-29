<template>
  <div v-if="contact" class="contact-detail-card">
    <div v-for="item in threadItems" :key="item.node.id" class="thread-item" :style="{ marginLeft: item.level * 16 + 'px' }">
      <div class="thread-header">
        <span class="thread-name">{{ item.node.name || '匿名' }}</span>
        <span class="thread-email">{{ item.node.email }}</span>
        <span class="thread-meta">#{{ item.node.id }} · {{ item.node.createdAt }}</span>
        <el-tag size="small" :type="statusTagType(item.node.status)" class="thread-status">
          {{ formatStatus(item.node.status) }}
        </el-tag>
      </div>
      <div class="thread-subject" v-if="item.node.subject">{{ item.node.subject }}</div>
      <div class="thread-content multiline">{{ item.node.content }}</div>
      <div class="thread-actions" v-if="showReplyButtons">
        <el-button size="small" text type="primary" @click="handleReply(item.node)">回复</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ContactUsVO } from '@/types/contact'

const props = withDefaults(defineProps<{
  contact: ContactUsVO | null
  showReplyButtons?: boolean
}>(), {
  showReplyButtons: false
})

const emit = defineEmits<{
  (e: 'reply', node: ContactUsVO): void
}>()

interface ThreadItem {
  node: ContactUsVO
  level: number
}

const buildThread = (root: ContactUsVO | null): ThreadItem[] => {
  const result: ThreadItem[] = []
  if (!root) return result

  const dfs = (node: ContactUsVO, level: number) => {
    result.push({ node, level })
    const children = node.children || []
    for (const c of children) {
      dfs(c, level + 1)
    }
  }

  dfs(root, 0)
  return result
}

const threadItems = computed(() => buildThread(props.contact))

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

const handleReply = (node: ContactUsVO) => {
  emit('reply', node)
}
</script>

<style scoped>
.contact-detail-card {
  padding: 8px 0;
  text-align: left;
}

.thread-item {
  padding: 8px 12px;
  border-left: 2px solid #e5e7eb;
  margin-bottom: 6px;
}

.thread-header {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 4px;
}

.thread-name {
  font-weight: 600;
  color: #111827;
}

.thread-email {
  color: #6b7280;
  font-size: 12px;
}

.thread-meta {
  color: #9ca3af;
  font-size: 12px;
}

.thread-status {
  margin-left: auto;
}

.thread-subject {
  font-weight: 500;
  margin-bottom: 4px;
}

.thread-content {
  font-size: 13px;
  color: #374151;
  text-align: left;
}

.thread-actions {
  margin-top: 4px;
}

.multiline {
  white-space: pre-wrap;
  word-break: break-word;
  text-align: left;
}
</style>
