import React, { useState, useCallback } from 'react';
import { Layout, Menu, Button, Form, Input, Avatar, Dropdown, Breadcrumb, ConfigProvider, theme, Modal } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined, SearchOutlined, UserOutlined, LockOutlined } from '@ant-design/icons';
import { Link, Routes, Route, useLocation } from 'react-router-dom';
import { useAuthStore, filterMenuByPermission } from './store/authStore';
import { menuConfig } from './config/menu';

const { Header, Content, Sider } = Layout;

// 配置主题
const { token } = theme.useToken();

const App: React.FC = () => {
  const { user, isAuthenticated, login, logout, isLoading, error } = useAuthStore();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [form] = Form.useForm();
  const location = useLocation();

  const handleLogin = async () => {
    try {
      const values = await form.validateFields();
      await login(values.username, values.password);
      setIsLoginModalOpen(false);
      form.resetFields();
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  const filteredMenu = filterMenuByPermission(menuConfig);

  const menuItems = filteredMenu.map(item => ({
    key: item.key,
    icon: item.icon,
    label: <Link to={item.path}>{item.label}</Link>,
    children: item.children?.map(child => ({
      key: child.key,
      icon: child.icon,
      label: <Link to={child.path}>{child.label}</Link>
    }))
  }));

  // 生成面包屑导航
  const getBreadcrumbItems = () => {
    const path = location.pathname;
    const items = [{ title: <Link to="/">首页</Link> }];
    
    if (path === '/shops') {
      items.push({ title: <span>店铺管理</span> });
    } else if (path === '/products') {
      items.push({ title: <span>商品管理</span> });
    } else if (path === '/inventory') {
      items.push({ title: <span>库存管理</span> });
    } else if (path === '/sales') {
      items.push({ title: <span>销售管理</span> });
    } else if (path === '/financial') {
      items.push({ title: <span>财务管理</span> });
    } else if (path === '/reports') {
      items.push({ title: <span>报表分析</span> });
    } else if (path === '/users') {
      items.push({ title: <span>用户管理</span> });
    } else if (path === '/settings/roles') {
      items.push({ title: <span>设置</span> }, { title: <span>角色管理</span> });
    } else if (path === '/settings/permissions') {
      items.push({ title: <span>设置</span> }, { title: <span>权限管理</span> });
    }
    
    return items;
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
          colorPrimaryHover: '#40a9ff',
          colorPrimaryActive: '#096dd9',
          colorSuccess: '#52c41a',
          colorWarning: '#faad14',
          colorError: '#f5222d',
          colorInfo: '#1890ff',
          colorBgLayout: '#f0f2f5',
          colorBgContainer: '#ffffff',
          colorBorder: '#e8e8e8',
          colorText: '#333333',
          colorTextSecondary: '#666666',
          colorTextTertiary: '#999999',
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)',
          boxShadowHover: '0 4px 16px rgba(0, 0, 0, 0.15)',
          fontSize: 14,
          lineHeight: 1.5715,
        },
        components: {
          Layout: {
            headerBg: '#001529',
            siderBg: '#001529',
            bodyBg: '#f0f2f5',
          },
          Menu: {
            bg: '#001529',
            itemHoverBg: 'rgba(24, 144, 255, 0.1)',
            itemSelectedBg: '#1890ff',
            itemSelectedColor: '#ffffff',
            itemColor: '#ffffff',
            itemHoverColor: '#ffffff',
          },
        },
      }}
    >
      <Layout style={{ minHeight: '100vh' }}>
        <Header style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          backgroundColor: '#001529', 
          padding: '0 24px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: '16px', width: 64, height: 64, color: 'white' }}
            />
            <div style={{ 
              color: 'white', 
              fontSize: '18px', 
              fontWeight: 'bold', 
              marginLeft: 16,
            }}>多门店 ERP 系统</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            {isAuthenticated && (
              <>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  padding: '0 12px',
                  borderRadius: 4,
                  marginRight: 16
                }}>
                  <span style={{ color: 'white', marginRight: 8 }}>欢迎, {user?.username}</span>
                  <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' }}>
                    {user?.role || '员工'}
                  </span>
                </div>
                <Dropdown
                  menu={{
                    items: [
                      {
                        key: 'profile',
                        label: '个人资料',
                      },
                      {
                        key: 'settings',
                        label: '系统设置',
                      },
                      {
                        key: 'logout',
                        label: '退出登录',
                        onClick: () => {
                          logout();
                        },
                      },
                    ],
                  }}
                >
                  <Button type="text" style={{ color: 'white' }}>
                    <Avatar size={32} style={{ backgroundColor: '#1890ff' }}>
                      {user?.username?.charAt(0).toUpperCase()}
                    </Avatar>
                  </Button>
                </Dropdown>
              </>
            )}
            {!isAuthenticated && (
              <Button type="primary" onClick={() => setIsLoginModalOpen(true)}>
                登录
              </Button>
            )}
          </div>
        </Header>
        <Layout>
          <Sider
            width={240}
            collapsedWidth={80}
            collapsed={collapsed}
            collapsible
            breakpoint="md"
            trigger={null}
            style={{
              backgroundColor: '#001529',
              boxShadow: '2px 0 8px rgba(0, 0, 0, 0.1)',
              position: 'sticky',
              top: 64,
              height: 'calc(100vh - 64px)',
              zIndex: 99,
              transition: 'all 0.3s ease',
            }}
          >
            <div style={{ 
              height: 64, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: collapsed ? 'center' : 'space-between',
              color: 'white',
              fontSize: '16px',
              fontWeight: 'bold',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              padding: collapsed ? '0' : '0 20px',
            }}>
              <span style={{ display: collapsed ? 'none' : 'block' }}>功能导航</span>
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                style={{ fontSize: '16px', color: 'white', display: 'flex' }}
              />
            </div>
            <Menu
              mode="inline"
              style={{ 
                height: 'calc(100% - 64px)', 
                borderRight: 0,
                backgroundColor: '#001529',
                color: 'white',
              }}
              items={menuItems}
              selectedKeys={[location.pathname]}
              theme="dark"
              defaultOpenKeys={['shops', 'products', 'inventory', 'sales', 'financial', 'reports', 'users', 'settings']}
            />
          </Sider>
          
          {/* 登录模态框 */}
          <Modal
            title="用户登录"
            open={isLoginModalOpen}
            onCancel={() => setIsLoginModalOpen(false)}
            onOk={handleLogin}
            confirmLoading={isLoading}
            width={{ xs: '90%', sm: 500 }}
            centered
          >
            {error && <div className="text-red-500 mb-4 text-center">{error}</div>}
            <Form
              form={form}
              layout="vertical"
            >
              <Form.Item
                name="username"
                label="用户名"
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                <Input 
                  placeholder="请输入用户名" 
                  size="large"
                  prefix={<UserOutlined />}
                />
              </Form.Item>
              <Form.Item
                name="password"
                label="密码"
                rules={[{ required: true, message: '请输入密码' }]}
              >
                <Input.Password 
                  placeholder="请输入密码" 
                  size="large"
                  prefix={<LockOutlined />}
                />
              </Form.Item>
            </Form>
          </Modal>
          <Layout style={{ 
            padding: { xs: '8px', sm: '16px', md: '24px' },
            flex: 1,
            overflow: 'auto',
          }}>
            <Content style={{ 
              backgroundColor: 'white', 
              padding: { xs: '12px', sm: '16px', md: '24px' }, 
              minHeight: 280, 
              borderRadius: 8, 
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)',
              marginBottom: { xs: '12px', sm: '24px' },
            }}>
              {/* 面包屑导航 */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: 24,
              }}>
                <Breadcrumb 
                  items={getBreadcrumbItems()} 
                  style={{ 
                    display: { xs: 'none', sm: 'flex' },
                    fontSize: '14px',
                  }} 
                />
              </div>
              
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/shops" element={<ShopPage />} />
                <Route path="/products" element={<ProductPage />} />
                <Route path="/inventory" element={<InventoryPage />} />
                <Route path="/serial-numbers" element={<SerialNumberPage />} />
                <Route path="/sales" element={<SalesPage />} />
                <Route path="/purchases" element={<PurchasePage />} />
                <Route path="/warehouses" element={<WarehousePage />} />
                <Route path="/transfers" element={<TransferPage />} />
                <Route path="/stocktakes" element={<StocktakePage />} />
                <Route path="/cashier" element={<CashierPage />} />
                <Route path="/financial" element={<FinancialPage />} />
                <Route path="/reports" element={<ReportPage />} />
                <Route path="/users" element={<UserPage />} />
                <Route path="/settings/roles" element={<RolePage />} />
                <Route path="/settings/permissions" element={<PermissionPage />} />
              </Routes>
            </Content>
          </Layout>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
};

const HomePage: React.FC = () => {
  return (
    <div style={{ padding: { xs: '0', sm: '0' } }}>
      <h1 style={{ 
        fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' }, 
        fontWeight: 'bold', 
        marginBottom: { xs: '1rem', sm: '1.5rem' }
      }}>欢迎使用多门店 ERP 系统</h1>
      <p>这是一个简化版的ERP系统，包含店铺管理、商品管理、库存管理、销售管理等功能。</p>
    </div>
  );
};

const ShopPage: React.FC = () => {
  return <div>店铺管理页面</div>;
};

const ProductPage: React.FC = () => {
  return <div>商品管理页面</div>;
};

const InventoryPage: React.FC = () => {
  return <div>库存管理页面</div>;
};

const SerialNumberPage: React.FC = () => {
  return <div>串号管理页面</div>;
};

const SalesPage: React.FC = () => {
  return <div>销售管理页面</div>;
};

const PurchasePage: React.FC = () => {
  return <div>采购管理页面</div>;
};

const WarehousePage: React.FC = () => {
  return <div>仓库管理页面</div>;
};

const TransferPage: React.FC = () => {
  return <div>调拨管理页面</div>;
};

const StocktakePage: React.FC = () => {
  return <div>库存盘点页面</div>;
};

const CashierPage: React.FC = () => {
  return <div>收银台页面</div>;
};

const FinancialPage: React.FC = () => {
  return <div>财务管理页面</div>;
};

const ReportPage: React.FC = () => {
  return <div>报表分析页面</div>;
};

const UserPage: React.FC = () => {
  return <div>用户管理页面</div>;
};

const RolePage: React.FC = () => {
  return <div>角色管理页面</div>;
};

const PermissionPage: React.FC = () => {
  return <div>权限管理页面</div>;
};

export default App;
