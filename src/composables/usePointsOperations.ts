import { computed, onBeforeUnmount, reactive, ref, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { ApiResponse } from '@/types/api'
import type { OperationsPage, OperationsQuery } from '@/api/pointsOperations'
import { operationsRange, operationsRouteQuery, parseOperationsQuery, type OperationsMode } from '@/utils/pointsOperationsQuery'
export function usePointsOperations<T>(mode: OperationsMode, requestPage: (query: OperationsQuery) => Promise<ApiResponse<OperationsPage<T>>>) {
  const route = useRoute(), router = useRouter()
  const filters = reactive<OperationsQuery>(parseOperationsQuery({}, mode))
  const dates = ref<string[]>(operationsRange()), applied = shallowRef<OperationsQuery>()
  const result = shallowRef<OperationsPage<T>>(), loading = ref(false), error = ref(''), validation = ref('')
  let sequence = 0
  const numericUserId = computed(() => filters.userId && Number.isSafeInteger(Number(filters.userId)) ? Number(filters.userId) : undefined)
  function setUser(value?: number) { filters.userId = value ? String(value) : undefined }
  async function load(query: OperationsQuery) {
    const current = ++sequence
    loading.value = true; error.value = ''; result.value = undefined; applied.value = { ...query }
    try {
      const response = await requestPage(query)
      if (current !== sequence) return
      if (response.code !== 0 || !response.data) throw response
      result.value = response.data
    } catch (cause) {
      if (current === sequence) {
        const failure = cause as { msg?: string; response?: { data?: { msg?: string } } }
        error.value = failure?.response?.data?.msg || failure?.msg || '读取失败，请重试；未读取的数据不会计为零。'
      }
    } finally { if (current === sequence) loading.value = false }
  }
  function sync() {
    validation.value = ''
    try {
      const query = parseOperationsQuery(route.query, mode)
      Object.keys(filters).forEach(key => delete filters[key as keyof OperationsQuery])
      Object.assign(filters, query); dates.value = [query.from, query.to]
      void load(query)
    } catch (cause) {
      ++sequence; result.value = undefined; applied.value = undefined; loading.value = false
      validation.value = cause instanceof Error ? cause.message : '筛选参数无效，请重置。'
    }
  }
  function commit(query: OperationsQuery) {
    const location = { path: route.path, query: operationsRouteQuery(query, mode) }
    if (router.resolve(location).fullPath === route.fullPath) void load(query)
    else void router.replace(location)
  }
  function search() {
    validation.value = ''
    try { commit(parseOperationsQuery({ ...filters, from: dates.value?.[0] || '', to: dates.value?.[1] || '', page: 1 }, mode)) }
    catch (cause) { validation.value = cause instanceof Error ? cause.message : '筛选参数无效。' }
  }
  function reset() { validation.value = ''; commit(parseOperationsQuery({}, mode)) }
  function changePage(page: number) { if (!loading.value && result.value && applied.value && page !== applied.value.page) commit({ ...applied.value, page }) }
  function changePageSize(pageSize: number) { if (!loading.value && result.value && applied.value && pageSize !== applied.value.pageSize) commit({ ...applied.value, page: 1, pageSize }) }
  function quickRange(days: number) { dates.value = operationsRange(days); search() }
  function retry() { if (applied.value) void load(applied.value); else sync() }
  const path = mode === 'ledger' ? '/ops/points-ledger' : '/ops/redemptions'
  watch(() => route.fullPath, () => { if (route.path === path) sync() }, { immediate: true })
  onBeforeUnmount(() => { sequence++ })
  return { filters, dates, applied, result, loading, error, validation, numericUserId, setUser, search, reset, changePage, changePageSize, quickRange, retry }
}
