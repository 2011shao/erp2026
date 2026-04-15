import { HomeOutlined, ShopOutlined, ProductOutlined, StockOutlined, ShoppingOutlined, DollarOutlined, BarChartOutlined, UserOutlined, SettingOutlined } from '@ant-design/icons';

export interface MenuItem {
  key: string;
  icon: React.ReactNode;
  label: React.ReactNode;
  path: string;
  permission?: string;
  children?: MenuItem[];
}

export const menuConfig: MenuItem[] = [
  {
    key: '1',
    icon: <HomeOutlined />,
    label: '首页',
    path: '/',
    permission: 'dashboard.view'
  },
  {
    key: '2',
    icon: <ShopOutlined />,
    label: '店铺管理',
    path: '/shops',
    permission: 'shop.manage',
    children: [
      {
        key: '2-1',
        icon: <ShopOutlined />,
        label: '店铺列表',
        path: '/shops',
        permission: 'shop.view'
      },
      {
        key: '2-2',
        icon: <ShopOutlined />,
        label: '添加店铺',
        path: '/shops/add',
        permission: 'shop.create'
      }
    ]
  },
  {
    key: '3',
    icon: <ProductOutlined />,
    label: '商品管理',
    path: '/products',
    permission: 'product.manage',
    children: [
      {
        key: '3-1',
        icon: <ProductOutlined />,
        label: '商品列表',
        path: '/products',
        permission: 'product.view'
      },
      {
        key: '3-2',
        icon: <ProductOutlined />,
        label: '添加商品',
        path: '/products/add',
        permission: 'product.create'
      }
    ]
  },
  {
    key: '4',
    icon: <StockOutlined />,
    label: '库存管理',
    path: '/inventory',
    permission: 'inventory.manage'
  },
  {
    key: '5',
    icon: <ShoppingOutlined />,
    label: '销售管理',
    path: '/sales',
    permission: 'sales.manage'
  },
  {
    key: '6',
    icon: <DollarOutlined />,
    label: '财务管理',
    path: '/financial',
    permission: 'financial.manage'
  },
  {
    key: '7',
    icon: <BarChartOutlined />,
    label: '报表分析',
    path: '/reports',
    permission: 'report.manage'
  },
  {
    key: '8',
    icon: <UserOutlined />,
    label: '用户管理',
    path: '/users',
    permission: 'user.manage'
  },
  {
    key: '9',
    icon: <SettingOutlined />,
    label: '系统设置',
    path: '/settings',
    permission: 'system.manage',
    children: [
      {
        key: '9-1',
        icon: <SettingOutlined />,
        label: '角色管理',
        path: '/settings/roles',
        permission: 'role.manage'
      },
      {
        key: '9-2',
        icon: <SettingOutlined />,
        label: '权限管理',
        path: '/settings/permissions',
        permission: 'permission.manage'
      }
    ]
  }
];