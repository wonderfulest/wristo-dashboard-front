<template>
  <nav class="breadcrumb-nav">
    <ol class="breadcrumb-list">
      <li class="breadcrumb-item">
        <router-link to="/dashboard" class="breadcrumb-link breadcrumb-home">
          <svg class="breadcrumb-icon" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
          </svg>
        </router-link>
      </li>
      <li
        v-for="(item, index) in breadcrumbItems"
        :key="index"
        class="breadcrumb-item"
      >
        <svg class="breadcrumb-separator" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd" />
        </svg>
        <router-link
          v-if="item.path && index < breadcrumbItems.length - 1"
          :to="item.path"
          class="breadcrumb-link"
        >
          {{ item.title }}
        </router-link>
        <span v-else class="breadcrumb-current">{{ item.title }}</span>
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { topMenus } from '@/config/menu.ts'
import type { SubMenuItem, TopMenuGroup } from '@/config/menu.ts'

interface BreadcrumbItem {
  title: string
  path?: string
}

const route = useRoute()

/**
 * 在菜单树中递归查找 path 对应的条目，返回从根到叶的路径数组
 */
function findMenuChain(items: SubMenuItem[], targetPath: string): SubMenuItem[] | null {
  for (const item of items) {
    if (item.path && item.path === targetPath) {
      return [item]
    }
    if (item.children) {
      const chain = findMenuChain(item.children, targetPath)
      if (chain) {
        return [item, ...chain]
      }
    }
  }
  return null
}

/**
 * 查找当前路径对应的顶级菜单组与子菜单链
 */
function resolveFromMenuConfig(path: string): { group: TopMenuGroup; chain: SubMenuItem[] } | null {
  for (const group of topMenus) {
    const chain = findMenuChain(group.children, path)
    if (chain) {
      return { group, chain }
    }
  }
  return null
}

const breadcrumbItems = computed<BreadcrumbItem[]>(() => {
  const currentPath = route.path
  if (currentPath === '/dashboard' || currentPath === '/') {
    return []
  }

  const result = resolveFromMenuConfig(currentPath)
  if (result) {
    const items: BreadcrumbItem[] = []
    // 顶级菜单组（如 "官网运营"、"设计"）
    const groupFirstPath = result.group.children.find(c => c.path)?.path
      || result.group.children[0]?.children?.[0]?.path
    items.push({ title: result.group.title, path: groupFirstPath })

    // 中间层级（子菜单组）+ 当前页
    for (const node of result.chain) {
      const isLeaf = !node.children || node.children.length === 0
      items.push({
        title: node.title,
        path: isLeaf ? node.path : (node.children?.find(c => c.path)?.path)
      })
    }
    return items
  }

  // 兜底：从路径段生成
  const segments = currentPath.split('/').filter(Boolean)
  return segments.map((seg, i) => ({
    title: seg.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    path: '/' + segments.slice(0, i + 1).join('/')
  }))
})
</script>

<style lang="scss" scoped>
.breadcrumb-nav {
  padding: 10px 16px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  min-height: 20px;
}

.breadcrumb-list {
  display: flex;
  align-items: center;
  list-style: none;
  margin: 0;
  padding: 0;
  flex-wrap: wrap;
  gap: 0;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  line-height: 1;
}

.breadcrumb-icon {
  width: 15px;
  height: 15px;
  color: #909399;
  transition: color 0.2s;
  flex-shrink: 0;
}

.breadcrumb-separator {
  width: 14px;
  height: 14px;
  color: #c0c4cc;
  margin: 0 2px;
  flex-shrink: 0;
}

.breadcrumb-home {
  display: flex;
  align-items: center;
  padding: 3px 4px;
  border-radius: 4px;
  transition: all 0.2s;

  &:hover {
    background: #f0f9f4;
    .breadcrumb-icon {
      color: #19b36b;
    }
  }
}

.breadcrumb-link {
  color: #606266;
  text-decoration: none;
  font-size: 13px;
  font-weight: 400;
  padding: 3px 6px;
  border-radius: 4px;
  transition: all 0.2s;
  white-space: nowrap;

  &:hover {
    color: #19b36b;
    background: #f0f9f4;
  }
}

.breadcrumb-current {
  color: #303133;
  font-size: 13px;
  font-weight: 500;
  padding: 3px 6px;
  white-space: nowrap;
}
</style>
