import test from 'node:test'
import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import { parse } from '@vue/compiler-sfc'
import { parse as parseTemplate } from '@vue/compiler-dom'

async function vueFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  return (await Promise.all(entries.map(entry => {
    const url = new URL(entry.name + (entry.isDirectory() ? '/' : ''), directory)
    return entry.isDirectory() ? vueFiles(url) : entry.name.endsWith('.vue') ? [url] : []
  }))).flat()
}

test('all actionable operation columns use the shared first column, including nested tables', async () => {
  const violations = []
  for (const file of await vueFiles(new URL('../src/', import.meta.url))) {
    const { descriptor } = parse(await readFile(file, 'utf8'))
    if (!descriptor.template) continue
    const visit = (node, parent) => {
      if (node.tag === 'TableActionColumn') {
        const firstColumn = parent.children.find(child => ['el-table-column', 'TableActionColumn'].includes(child.tag))
        if (parent.tag !== 'el-table' || firstColumn !== node) violations.push(`${file.pathname}: action column is not first`)
      }
      if (node.tag === 'el-table-column') {
        const label = node.props.find(prop => prop.name === 'label')?.value?.content
        if (['操作', 'Action', 'Actions', '检查入口', '审核', ''].includes(label) && /<(el-button|el-switch|a\s|router-link)/.test(node.loc.source)) {
          violations.push(`${file.pathname}: unconverted action column`)
        }
      }
      for (const child of node.children || []) visit(child, node)
    }
    visit(parseTemplate(descriptor.template.content), null)
  }
  assert.deepEqual(violations, [])
})
