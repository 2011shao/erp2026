import { HomeOutlined, ShopOutlined, ProductOutlined, StockOutlined, ShoppingOutlined, DollarOutlined, BarChartOutlined, UserOutlined, SettingOutlined, TagsOutlined, DollarCircleOutlined, ShoppingCartOutlined, SwapOutlined, TeamOutlined, InboxOutlined } from '@ant-design/icons';

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
      },
      {
        key: '3-3',
        icon: <TagsOutlined />,
        label: '分类管理',
        path: '/categories',
        permission: 'product.manage'
      },
      {
        key: '3-4',
        icon: <TagsOutlined />,
        label: '品牌管理',
        path: '/brands',
        permission: 'product.manage'
      }
    ]
  },
  {
    key: '4',
    icon: <StockOutlined />,
    label: '库存管理',
    path: '/inventory',
    permission: 'inventory.manage',
    children: [
      {
        key: '4-1',
        icon: <StockOutlined />,
        label: '库存列表',
        path: '/inventory',
        permission: 'inventory.view'
      },
      {
        key: '4-2',
        icon: <TagsOutlined />,
        label: '串号管理',
        path: '/serial-numbers',
        permission: 'serialNumber.manage'
      }
    ]
  },
  {
    key: '5',
    icon: <ShoppingOutlined />,
    label: '销售管理',
    path: '/sales',
    permission: 'sales.manage',
    children: [
      {
        key: '5-1',
        icon: <ShoppingOutlined />,
        label: '销售订单',
        path: '/sales',
        permission: 'sales.view'
      },
      {
        key: '5-2',
        icon: <DollarCircleOutlined />,
        label: '收银台',
        path: '/cashier',
        permission: 'cashier.manage'
      }
    ]
  },
  {
    key: '6',
    icon: <TeamOutlined />,
    label: '供货商管理',
    path: '/suppliers',
    permission: 'supplier.manage'
  },
  {
    key: '7',
    icon: <InboxOutlined />,
    label: '入库管理',
    path: '/stock-in',
    permission: 'stockIn.manage'
  },
  {
    key: '8',
    icon: <ShoppingCartOutlined />,
    label: '采购管理',
    path: '/purchases',
    permission: 'purchase.manage'
  },
  {
    key: '9',
    icon: <StockOutlined />,
    label: '仓库管理',
    path: '/warehouses',
    permission: 'warehouse.manage'
  },
  {
    key: '10',
    icon: <SwapOutlined />,
    label: '调拨管理',
    path: '/transfers',
    permission: 'transfer.manage'
  },
  {
    key: '11',
    icon: <StockOutlined />,
    label: '库存盘点',
    path: '/stocktakes',
    permission: 'stocktake.manage'
  },
  {
    key: '12',
    icon: <DollarOutlined />,
    label: '财务管理',
    path: '/financial',
    permission: 'financial.manage'
  },
  {
    key: '13',
    icon: <BarChartOutlined />,
    label: '报表分析',
    path: '/reports',
    permission: 'report.manage'
  },
  {
    key: '14',
    icon: <UserOutlined />,
    label: '用户管理',
    path: '/users',
    permission: 'user.manage'
  },
  {
    key: '15',
    icon: <SettingOutlined />,
    label: '系统设置',
    path: '/settings',
    permission: 'system.manage',
    children: [
      {
        key: '13-1',
        icon: <SettingOutlined />,
        label: '角色管理',
        path: '/settings/roles',
        permission: 'role.manage'
      },
      {
        key: '13-2',
        icon: <SettingOutlined />,
        label: '权限管理',
        path: '/settings/permissions',
        permission: 'permission.manage'
      }
    ]
  }
];