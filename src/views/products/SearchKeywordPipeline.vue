<template>
  <div class="search-keyword-pipeline-container">
    <div class="header">
      <h2>动作流水线任务</h2>

      <div class="toolbar">
        <el-button type="primary" :loading="running" @click="runBuildFinalKeyword">构建 Final Keyword</el-button>
        <el-button type="primary" :loading="running" @click="runBuildCandidate">构建 Candidate</el-button>
        <el-button type="primary" :loading="running" @click="runScoreKeywords">评分（Score Keywords）</el-button>
        <el-button type="primary" :loading="running" @click="runBuildActionSuggestion">构建动作建议</el-button>
        <el-button type="warning" :loading="running" @click="runBuildAll">构建全部</el-button>
      </div>

      <el-alert
        v-if="lastRun"
        :title="lastRun.message"
        type="success"
        show-icon
        :closable="false"
      >
        <template #default>
          <pre class="result-pre">{{ prettyRun(lastRun) }}</pre>
        </template>
      </el-alert>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { SearchKeywordPipelineRunVO } from '@/types/final-search-keyword'
import {
  buildAllKeywords,
  buildFinalKeyword,
  buildProductKeywordCandidate,
  scoreKeywords,
  buildActionSuggestion,
} from '@/api/search-keyword-pipeline'

const running = ref(false)
const lastRun = ref<SearchKeywordPipelineRunVO | null>(null)

const prettyRun = (vo: SearchKeywordPipelineRunVO) => {
  const lines = [
    vo.message ? `message: ${vo.message}` : '',
    typeof vo.affectedRows === 'number' ? `affectedRows: ${vo.affectedRows}` : '',
    typeof vo.finalKeywordRows === 'number' ? `finalKeywordRows: ${vo.finalKeywordRows}` : '',
    typeof vo.candidateRows === 'number' ? `candidateRows: ${vo.candidateRows}` : '',
    typeof vo.scoreRows === 'number' ? `scoreRows: ${vo.scoreRows}` : '',
    typeof vo.suggestionRows === 'number' ? `suggestionRows: ${vo.suggestionRows}` : '',
  ].filter(Boolean)
  return lines.join('\n')
}

const run = async (title: string, fn: () => Promise<any>) => {
  try {
    await ElMessageBox.confirm(`确认执行“${title}”吗？`, '确认', { type: 'warning' })
    running.value = true
    const res = await fn()
    if (res.code === 0 && res.data) {
      lastRun.value = res.data
      ElMessage.success(res.data.message || '执行成功')
    }
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error(e?.msg || e?.message || '执行失败')
  } finally {
    running.value = false
  }
}

const runBuildFinalKeyword = () => run('构建 Final Keyword', () => buildFinalKeyword())
const runBuildCandidate = () => run('构建 Candidate', () => buildProductKeywordCandidate())
const runScoreKeywords = () => run('评分（Score Keywords）', () => scoreKeywords())
const runBuildActionSuggestion = () => run('构建动作建议', () => buildActionSuggestion())
const runBuildAll = () => run('构建全部', () => buildAllKeywords())
</script>

<style scoped lang="scss">
.search-keyword-pipeline-container {
  padding: 24px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.header {
  margin-bottom: 16px;

  h2 {
    margin: 0 0 10px;
    font-size: 20px;
    font-weight: 600;
  }
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
}

.result-pre {
  margin: 0;
  white-space: pre-wrap;
}
</style>
