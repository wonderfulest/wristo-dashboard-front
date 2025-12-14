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
      :label="`${u.username}${u.email ? ' - ' + u.email : ''} - (${u.id})`"
      :value="u.id"
    />
  </el-select>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import type { UserInfo, RoleInfo } from '@/types/api'
import { searchUsers } from '@/api/user'
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
  const q = keyword.trim()

  // 避免空关键字触发全量查询：空时直接清空
  if (!q) {
    options.value = []
    return
  }

  // 如有传入 roleAuthorities，先解析得到对应的 roleId
  await ensureResolvedRoleId()

  loading.value = true
  try {
    const res = await searchUsers(q, 20, resolvedRoleId.value)
    if (res.code === 0 && res.data) {
      let list = (res.data as UserInfo[]) || []

      // 若解析出 roleId，则基于用户 roles 在前端过滤（search 接口不支持 roleId 参数）
      if (typeof resolvedRoleId.value === 'number') {
        const hasRoles = list.some((u: any) => Array.isArray(u?.roles))
        if (hasRoles) {
          list = list.filter((u: any) => Array.isArray(u.roles) && u.roles.some((r: any) => r?.id === resolvedRoleId.value))
        }
      }

      // 若传入 roleAuthorities，则基于 roleCode 在前端过滤
      if (props.roleAuthorities && props.roleAuthorities.length > 0) {
        const set = new Set(props.roleAuthorities)
        const hasRoles = list.some((u: any) => Array.isArray(u?.roles))
        if (hasRoles) {
          list = list.filter((u: any) => Array.isArray(u.roles) && u.roles.some((r: any) => r?.roleCode && set.has(r.roleCode)))
        }
      }

      options.value = list
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
  // 不在初始化时全量拉取，避免 search 接口在空关键词下风险
})
</script>
