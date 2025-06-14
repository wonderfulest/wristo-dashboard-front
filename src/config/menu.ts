import { Component } from 'vue'

export interface MenuItem {
  key: string
  title: string
  path: string
  icon?: Component
  children?: MenuItem[]
}

export const menuItems: MenuItem[] = [
  {
    key: 'dashboard',
    title: '仪表盘',
    path: '/dashboard'
  },
  {
    key: 'products',
    title: '商品管理',
    path: '/products'
  },
  {
    key: 'categories',
    title: '分类管理',
    path: '/categories'
  },
  {
    key: 'discounts',
    title: '优惠管理',
    path: '/discounts'
  },
  {
    key: 'history',
    title: '历史记录',
    path: '/history'
  },
  {
    key: 'user',
    title: '用户管理',
    path: '/user-management'
  },
  {
    key: 'role',
    title: '角色管理',
    path: '/role-management'
  },
  {
    key: 'profile',
    title: '个人中心',
    path: '/profile'
  }
] 