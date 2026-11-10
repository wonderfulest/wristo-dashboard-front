import type { ComponentPublicInstance, VNode } from 'vue'

interface Column {
  columnKey?: string
  property?: string
  label?: string
  type: string
  width: number | string
  realWidth: number
}

interface Table extends ComponentPublicInstance {
  store: { states: { columns: { value: Column[] } } }
  doLayout(): void
}

const columnIds = new WeakMap<Column, string>()

function columnId(column: Column, columns: Column[]) {
  const identity = (c: Column) => JSON.stringify([c.columnKey, c.property, c.label, c.type])
  const id = identity(column)
  return id + ':' + columns.slice(0, columns.indexOf(column)).filter(c => identity(c) === id).length
}

export function tableWidths(id: string) {
  const key = 'wristo.dashboard.table-widths.v1:' + id
  const read = (): Record<string, number> => {
    try { return JSON.parse(localStorage.getItem(key) || '{}') || {} }
    catch { return {} }
  }
  return {
    border: true,
    onVnodeMounted(vnode: VNode) {
      const table = vnode.component?.proxy as Table | null
      if (!table) return
      // Element Plus exposes leaf columns in display order, including dynamic columns.
      table.$watch(() => table.store.states.columns.value.slice(), columns => {
        const saved = read()
        let changed = false
        for (const col of columns) {
          const id = columnId(col, columns)
          columnIds.set(col, id)
          const width = saved[id]
          if (Number.isFinite(width) && width >= 30 && col.width !== width) {
            col.width = col.realWidth = width
            changed = true
          }
        }
        if (changed) table.doLayout()
      }, { immediate: true, flush: 'post' })
    },
    onHeaderDragend(width: number, _oldWidth: number, column: Column) {
      const keyForColumn = columnIds.get(column)
      if (!keyForColumn) return
      const saved = read()
      try { localStorage.setItem(key, JSON.stringify({ ...saved, [keyForColumn]: width })) }
      catch { /* Dragging still works when browser storage is unavailable. */ }
    },
  }
}
