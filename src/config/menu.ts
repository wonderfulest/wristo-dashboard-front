export interface SubMenuItem {
  key: string
  title: string
  path?: string
  children?: SubMenuItem[]
}

export interface TopMenuGroup {
  key: string
  title: string
  basePaths: string[]
  children: SubMenuItem[]
}

export const topMenus: TopMenuGroup[] = [
  {
    key: 'official',
    title: '官网运营',
    basePaths: ['/dashboard', '/products', '/website', '/discounts', '/history', '/design-review', '/packaging-logs', '/subscription-plans', '/data-type-options', '/tickets', '/contact-us', '/themes'],
    children: [
      { key: 'dashboard', title: '仪表盘', path: '/dashboard' },
      { key: 'tickets', title: '工单管理', path: '/tickets' },
      { key: 'contact-us', title: '用户反馈', path: '/contact-us' },
      {
        key: 'themes',
        title: '主题系统',
        children: [
          { key: 'theme-rules', title: '主题规则', path: '/themes/rules' },
          { key: 'theme-configs', title: '主题配置', path: '/themes/configs' },
        ],
      },
       {
        key: 'packaging',
        title: '打包',
        children: [
          { key: 'design-review', title: '设计审核', path: '/packaging/design-review' },
          { key: 'packaging-logs', title: '打包记录', path: '/packaging/packaging-logs' },
        ],
      },
      {
        key: 'products',
        title: '应用管理',
        children: [
          { key: 'products', title: '应用列表', path: '/products' },
          { key: 'categories', title: '应用分类', path: '/website/categories' },
          { key: 'app-daily-config', title: '每日一图配置', path: '/products/app-daily/config' },
          { key: 'device-un-support', title: '未支持应用', path: '/products/device-un-support' },
        ],
      },
      {
        key: 'website',
        title: '官网',
        children: [
          { key: 'website-home-banners', title: '首页 Banner', path: '/website/home-banners' },
          { key: 'website-categories', title: '应用分类', path: '/website/categories' },
        ],
      },
      { key: 'data-type-options', title: '数据项', path: '/data-type-options' },
      { key: 'color-type-options', title: '颜色配置', path: '/color-type-options' },
      { key: 'garmin-devices', title: '佳明设备', children: [
        { key: 'garmin-devices', title: '设备列表', path: '/products/garmin-devices' },
        { key: 'garmin-device-detail', title: '设备详情', path: '/products/garmin-devices/:id' },
      ] },
       { key: 'template-variables', title: '模板变量', path: '/system/template-variables' },
      { key: 'email-records', title: '邮件发送历史', path: '/email-records' },
    ],
  },
  {
    key: 'design',
    title: '设计',
    basePaths: ['/design'],
    children: [
      { key: 'inspirations', title: '设计灵感', path: '/design/inspirations' },
      {
        key: 'fonts',
        title: '字体',
        children: [
          { key: 'fonts-manage', title: '字体管理', path: '/design/fonts' },
        ],
      },
      {
        key: 'icons',
        title: '图标',
        children: [
          { key: 'icon-library', title: '图标字典', path: '/design/icon-library' },
          { key: 'icon-assets', title: '图标素材', path: '/design/icon-assets' },
          { key: 'icon-glyphs', title: '图标字体管理', path: '/design/icon-glyphs' },
        ],
      },
      { key: 'images', title: '图片素材', path: '/design/images' },
      { key: 'analog-assets', title: '指针表盘素材', path: '/design/analog-assets' },
    ],
  },
  {
    key: 'blog',
    title: '博客',
    basePaths: ['/blog'],
    children: [
      { key: 'post-list', title: '文章列表', path: '/blog/posts' },
      { key: 'categories', title: '分类管理', path: '/blog/categories' },
      { key: 'tags', title: '标签管理', path: '/blog/tags' },
      { key: 'toc', title: '博客目录管理', path: '/blog/toc' },
    ],
  },
  {
    key: 'marketing',
    title: '营销工具',
    basePaths: ['/marketing'],
    children: [
      // { key: 'customers', title: '客户管理', path: '/marketing/customers' },
      { key: 'user-profiles', title: '用户画像', path: '/marketing/user-profiles' },
      // { key: 'tags', title: '标签管理', path: '/marketing/tags' },
      { key: 'segments', title: '用户分群', path: '/marketing/segments' },
      { key: 'email-templates', title: '邮件模板', path: '/marketing/email-templates' },
      { key: 'promotion-campaigns', title: '营销活动', path: '/marketing/campaigns' },
      { key: 'push-records', title: '推送记录', path: '/marketing/push-records' },
    ],
  },
  {
    key: 'ops',
    title: '运维工具',
    basePaths: ['/ops'],
    children: [
      { key: 'db-backups', title: '数据库备份', path: '/ops/db-backups' },
      { key: 'system-config', title: '系统配置', path: '/ops/system-config' },
      { key: 's3-ops', title: 'S3 运维', path: '/ops/s3-ops' },
    ],
  },
  {
    key: 'orders',
    title: '订单管理',
    basePaths: ['/orders'],
    children: [
      { key: 'history', title: '订单记录', path: '/orders/history' },
      { key: 'refund', title: '订单退款', path: '/orders/refund' },
      { key: 'discounts', title: '优惠管理', path: '/orders/discounts' },
      { key: 'subscription-plans', title: '订阅计划', path: '/orders/subscription-plans' },
    ],
  },
  {
    key: 'users',
    title: '用户管理',
    basePaths: ['/users'],
    children: [
      { key: 'user-management', title: '用户管理', path: '/users/user-management' },
      { key: 'change-user-email', title: '变更用户邮箱', path: '/users/user-management/change-email' },
      { key: 'email-preferences', title: '用户隐私', path: '/users/email-preferences' },
      { key: 'paddle-sync', title: 'Paddle用户同步', path: '/users/paddle-sync' },
      { key: 'role-management', title: '角色管理', path: '/users/role-management' },
      { key: 'dict', title: '字典管理', path: '/users/dict' },
      { key: 'profile', title: '个人资料', path: '/profile' },
    ],
  },
  {
    key: 'merchant',
    title: '商家中心',
    basePaths: ['/merchant'],
    children: [
      { key: 'merchant', title: '商家管理', path: '/merchant' },
      { key: 'merchant-tools', title: '商家工具', path: '/merchant/tools' },
      { key: 'merchant-payouts', title: '结算管理', path: '/merchant/payouts' },
    ],
  },
]