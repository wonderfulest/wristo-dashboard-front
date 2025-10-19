// Utility to parse Thymeleaf-like HTML and generate mock variables JSON
// Focus: extract ${...} expressions, map th:each aliases, support arrays/objects, and build reasonable mock values.

// Parse th:each aliases, e.g. th:each="p : ${products}" or th:each='p, i : ${products}'
function parseEachAliases(html: string): Record<string, string> {
  const map: Record<string, string> = {}
  const re = /th:each\s*=\s*(["'])\s*([A-Za-z_]\w*)\s*(?:,\s*\w+)?\s*:\s*\$\{\s*([^}]+?)\s*}\s*\1/g
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    const alias = m[2]
    const collection = m[3]
    if (alias && collection) map[alias] = collection.trim()
  }
  return map
}

// Extract variable-like paths from ${...} expressions, map aliases to collection[0].path
function extractVarsFromHtml(html: string): string[] {
  if (!html) return []
  const aliasMap = parseEachAliases(html)
  const exprRe = /\$\{([^}]+)\}/g
  const pathRe = /[A-Za-z_]\w*(?:\[(?:\d*)\]|\.[A-Za-z_]\w*)*/g
  const tokens = new Set<string>()
  let m: RegExpExecArray | null
  while ((m = exprRe.exec(html)) !== null) {
    const expr = m[1]
    if (!expr) continue
    let pm: RegExpExecArray | null
    while ((pm = pathRe.exec(expr)) !== null) {
      const raw = pm[0]
      if (/^(null|true|false)$/i.test(raw)) continue
      let key = raw
      const alias = Object.keys(aliasMap).find(a => key === a || key.startsWith(a + '.'))
      if (alias) {
        const coll = aliasMap[alias]
        const rest = key === alias ? '' : key.slice(alias.length + 1)
        key = rest ? `${coll}[0].${rest}` : `${coll}[0]`
      }
      tokens.add(key)
    }
  }
  return Array.from(tokens)
}

// Parse path like 'order.items[0].name' => ['order','items',0,'name']
function parsePath(path: string): (string | number)[] {
  const parts: (string | number)[] = []
  const re = /([^\.\[\]]+)|\[(\d*)\]/g
  let m: RegExpExecArray | null
  while ((m = re.exec(path)) !== null) {
    if (m[1] !== undefined) parts.push(m[1])
    else if (m[2] !== undefined) parts.push(m[2] === '' ? 0 : Number(m[2]))
  }
  return parts
}

// Deep set helper supporting arrays
function setDeep(root: any, path: string, value: any) {
  const parts = parsePath(path)
  let cur = root
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    const isLast = i === parts.length - 1
    const next = parts[i + 1]

    if (typeof part === 'number') {
      if (!Array.isArray(cur)) {
        // best effort: if not array, convert to array-like container
      }
      if (cur[part] === undefined) cur[part] = isLast ? value : (typeof next === 'number' ? [] : {})
      if (isLast) cur[part] = value
      else cur = cur[part]
    } else {
      if (cur[part] === undefined) cur[part] = isLast ? value : (typeof next === 'number' ? [] : {})
      if (isLast) cur[part] = value
      else cur = cur[part]
    }
  }
}

// Simple mock heuristics without external deps
function mockByName(name: string): any {
  const n = name.toLowerCase()
  if (n.includes('image')) return 'https://picsum.photos/640/360'
  if (n.includes('url') || n === 'href' || n === 'src') return 'https://example.com'
  if (n.includes('title')) return 'Sample Title'
  if (n.includes('name')) return 'Alice Zhang'
  if (n.includes('price') || n.includes('amount')) return '$2.99'
  if (n.includes('email')) return 'user@example.com'
  if (n.includes('phone')) return '+1-202-555-0147'
  if (n.includes('id')) return '123456'
  if (n.includes('date') || n.includes('time')) return '2025-01-01'
  return '测试'
}

// Detect array root and inner field from pattern like products[0].name
function parseArrayField(path: string): { root: string, field?: string } | null {
  const m = path.match(/^(\w+)\[(?:\d*)\](?:\.(.+))?$/)
  if (!m) return null
  return { root: m[1], field: m[2] }
}

function buildDefaultJson(keys: string[]): any {
  const obj: any = {}
  const arrayFields: Record<string, Set<string>> = {}

  for (const k of keys) {
    const af = parseArrayField(k)
    if (af) {
      if (!arrayFields[af.root]) arrayFields[af.root] = new Set<string>()
      if (af.field) arrayFields[af.root].add(af.field)
      if (obj[af.root] === undefined) obj[af.root] = []
    } else {
      const lastToken = k.split(/\.|\[/).pop() || k
      setDeep(obj, k, mockByName(lastToken))
    }
  }

  Object.entries(arrayFields).forEach(([root, fieldsSet]) => {
    const fields = Array.from(fieldsSet)
    const itemsLen = Math.max(2, Math.min(4, fields.length ? 4 : 2))
    const items: any[] = []
    for (let i = 0; i < itemsLen; i++) {
      const item: any = {}
      for (const f of fields) {
        const leaf = f.split('.').pop() as string
        setDeep(item, f, mockByName(leaf))
      }
      items.push(item)
    }
    obj[root] = items
  })

  return obj
}

export function generateVariablesJsonFromHtml(html: string): string {
  const keys = extractVarsFromHtml(html)
  const data = buildDefaultJson(keys)
  return JSON.stringify(data, null, 2)
}

export function formatJsonPretty(raw: string): string {
  try { return JSON.stringify(JSON.parse(raw), null, 2) } catch { return raw }
}
