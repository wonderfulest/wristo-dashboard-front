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
    basePaths: ['/dashboard', '/products', '/categories', '/discounts', '/history', '/design-review', '/packaging-logs', '/subscription-plans', '/fonts'],
    children: [
      { key: 'dashboard', title: '仪表盘', path: '/dashboard' },
      { key: 'products', title: '作品管理', path: '/products' },
      { key: 'categories', title: '分类管理', path: '/categories' },
      { key: 'design-review', title: '设计审核', path: '/design-review' },
      { key: 'packaging-logs', title: '打包记录', path: '/packaging-logs' },
      { key: 'fonts', title: '字体管理', path: '/fonts' },
    ],
  },
  {
    key: 'ops',
    title: '运维工具',
    basePaths: ['/db-backups', '/system-config'],
    children: [
      { key: 'db-backups', title: '数据库备份', path: '/db-backups' },
      { key: 'system-config', title: '系统配置', path: '/system-config' },
    ],
  },
  {
    key: 'orders',
    title: '订单管理',
    basePaths: ['/orders'],
    children: [
      { key: 'history', title: '订单记录', path: '/orders/history' },
      { key: 'discounts', title: '优惠管理', path: '/orders/discounts' },
      { key: 'subscription-plans', title: '订阅计划', path: '/orders/subscription-plans' },
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
    key: 'merchant',
    title: '商家中心',
    basePaths: ['/merchant'],
    children: [
      { key: 'merchant', title: '商家中心', path: '/merchant' },
      { key: 'merchant-payouts', title: '结算管理', path: '/merchant/payouts' },
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