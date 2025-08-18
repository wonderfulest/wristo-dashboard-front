export interface SubMenuItem {
  key: string
  title: string
  path: string
}

export interface TopMenuGroup {
  key: string
  title: string
  // 用于自动判断当前路由属于哪个分组
  basePaths: string[]
  children: SubMenuItem[]
}

export const topMenus: TopMenuGroup[] = [
  {
    key: 'official',
    title: '官网运营',
    basePaths: ['/dashboard', '/products', '/categories', '/discounts', '/history', '/design-review', '/packaging-logs', '/subscription-plans'],
    children: [
      { key: 'dashboard', title: '仪表盘', path: '/dashboard' },
      { key: 'products', title: '产品管理', path: '/products' },
      { key: 'categories', title: '分类管理', path: '/categories' },
      { key: 'discounts', title: '优惠管理', path: '/discounts' },
      { key: 'history', title: '历史记录', path: '/history' },
      { key: 'design-review', title: '设计审核', path: '/design-review' },
      { key: 'packaging-logs', title: '打包记录', path: '/packaging-logs' },
      { key: 'subscription-plans', title: '订阅计划', path: '/subscription-plans' },
    ],
  },
  {
    key: 'ops',
    title: '运维工具',
    basePaths: ['/db-backups'],
    children: [
      { key: 'db-backups', title: '数据库备份', path: '/db-backups' },
    ],
  },
  {
    key: 'orders',
    title: '订单管理',
    basePaths: ['/orders'],
    children: [
      { key: 'orders', title: '订单列表', path: '/orders' },
    ],
  },
  {
    key: 'users',
    title: '用户管理',
    basePaths: ['/user-management', '/role-management', '/dict', '/profile'],
    children: [
      { key: 'user-management', title: '用户管理', path: '/user-management' },
      { key: 'role-management', title: '角色管理', path: '/role-management' },
      { key: 'dict', title: '字典管理', path: '/dict' },
      { key: 'profile', title: '个人资料', path: '/profile' },
    ],
  },
  {
    key: 'marketing',
    title: '营销工具',
    basePaths: ['/marketing'],
    children: [
      { key: 'marketing', title: '营销工具', path: '/marketing' },
    ],
  },
  {
    key: 'reports',
    title: '报表中心',
    basePaths: ['/reports'],
    children: [
      { key: 'reports', title: '报表中心', path: '/reports' },
    ],
  },
]