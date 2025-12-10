<template>
  <el-select
    :model-value="innerValue"
    @update:model-value="onUpdateModelValue"
    :placeholder="placeholder || '按创作者筛选'"
    clearable
    filterable
    remote
    :remote-method="remoteSearch"
    :loading="loading"
    style="width: 220px"
  >
    <el-option
      v-for="u in options"
      :key="u.id"
      :label="`${u.username} - (${u.id})`"
      :value="u.id"
    />
  </el-select>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import type { UserInfo, PageResponse, RoleInfo } from '@/types/api'
import { pageUsers } from '@/api/user'
import { getRoleList } from '@/api/role'

const props = defineProps<{
  modelValue?: number | undefined
  // 可选的角色过滤 ID，传入则按该角色筛选创作者
  roleId?: number
  // 可选的角色编码列表，如 ['ROLE_DESIGNER']，会基于 UserInfo.roles[].roleCode 在前端过滤
  roleAuthorities?: string[]
  placeholder?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value?: number | undefined): void
  (e: 'change', value?: number | undefined): void
}>()

const innerValue = ref<number | undefined>(props.modelValue)
const options = ref<UserInfo[]>([])
const loading = ref(false)
// 最终用于请求后端的角色ID：优先使用 props.roleId，其次根据 roleAuthorities 解析
const resolvedRoleId = ref<number | undefined>(props.roleId)

watch(
  () => props.modelValue,
  (val) => {
    innerValue.value = val
  }
)

watch(
  () => props.roleId,
  (val) => {
    resolvedRoleId.value = val
  }
)

// 根据传入的角色编码列表，从后端角色列表中解析出对应的 roleId
const ensureResolvedRoleId = async () => {
  if (!props.roleAuthorities || props.roleAuthorities.length === 0) return
  if (typeof resolvedRoleId.value === 'number') return

  try {
    const res = await getRoleList()
    if (res.code === 0 && res.data) {
      const roles = res.data as RoleInfo[]
      const set = new Set(props.roleAuthorities)
      const matched = roles.find((r) => r.roleCode && set.has(r.roleCode))
      if (matched) {
        resolvedRoleId.value = matched.id
      }
    }
  } catch {
    // ignore role resolve error, fallback to no role filter
  }
}

const fetchUsers = async (keyword: string) => {
  // 如有传入 roleAuthorities，先解析得到对应的 roleId
  await ensureResolvedRoleId()
  loading.value = true
  try {
    const res = await pageUsers({
      pageNum: 1,
      pageSize: 20,
      username: keyword || undefined,
      // 只有当解析出 roleId 时才作为过滤条件
      roleId: typeof resolvedRoleId.value === 'number' ? resolvedRoleId.value : undefined,
    })
    if (res.code === 0 && res.data) {
      const page = res.data as PageResponse<UserInfo>
      options.value = page.list || []
    }
  } finally {
    loading.value = false
  }
}

const remoteSearch = (query: string) => {
  // Element Plus 在 filterable+remote 下会频繁触发 remote-method
  // 这里简单节流：空字符串时拉一页默认用户
  fetchUsers(query.trim())
}

const onUpdateModelValue = (val?: number) => {
  innerValue.value = val
  emit('update:modelValue', val)
  emit('change', val)
}

onMounted(() => {
  // 初始化时拉一页默认数据，便于下拉直接点选
  fetchUsers('')
})
</script>
