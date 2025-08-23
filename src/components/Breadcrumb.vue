<template>
  <div class="breadcrumb-container">
    <el-breadcrumb separator="/">
      <el-breadcrumb-item 
        v-for="(item, index) in breadcrumbItems" 
        :key="index"
        :to="item.path"
      >
        {{ item.title }}
      </el-breadcrumb-item>
    </el-breadcrumb>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

interface BreadcrumbItem {
  title: string
  path: string
}

// 路由标题映射
const routeTitleMap: Record<string, string> = {
  'dashboard': '仪表盘',
  'user-management': '用户管理',
  'role-management': '角色管理',
  'dict': '字典管理',
  'design-review': '设计审核',
  'packaging-logs': '打包记录',
  'products': '作品管理',
  'categories': '分类管理',
  'history': '历史记录',
  'discounts': '优惠管理',
  'profile': '个人资料',
  'account': '账户管理',
  'api': 'API管理'
}

const route = useRoute()

const breadcrumbItems = computed<BreadcrumbItem[]>(() => {
  const items: BreadcrumbItem[] = [
    { title: '首页', path: '/dashboard' }
  ]
  
  const currentPath = route.path
  const pathSegments = currentPath.split('/').filter(segment => segment)
  
  if (pathSegments.length > 0) {
    const currentRoute = pathSegments[pathSegments.length - 1]
    const title = routeTitleMap[currentRoute] || currentRoute
    
    items.push({ title: title, path: currentPath })
  }
  
  return items
})
</script>

<style lang="scss" scoped>
.breadcrumb-container {
  padding: 8px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  min-height: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  
  .el-breadcrumb {
    font-size: 13px;
    
    .el-breadcrumb__item {
      .el-breadcrumb__inner {
        color: #606266;
        font-weight: 400;
        
        &:hover {
          color: #19b36b;
        }
      }
    }
  }
}
</style>
