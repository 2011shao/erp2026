import React, { useState, useCallback } from 'react';
import { Layout, Menu, Button, Table, Modal, Form, Input, Select, Card, Statistic, Row, Col, Tag, Space, message, Breadcrumb, ConfigProvider, theme, Dropdown, Checkbox, Upload, DatePicker, Avatar } from 'antd';
import moment from 'moment';
import { Link, Routes, Route, useLocation } from 'react-router-dom';
import { ShopOutlined, ProductOutlined, StockOutlined, ShoppingOutlined, DollarOutlined, BarChartOutlined, PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, MenuFoldOutlined, MenuUnfoldOutlined, SearchOutlined, DownloadOutlined, UploadOutlined, UserOutlined, LockOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import { useAuthStore, filterMenuByPermission } from './store/authStore';
import { menuConfig } from './config/menu';
import { shopApi, productApi, inventoryApi, salesApi, financialApi } from './api';
import { LogService } from './services/logService';
import { debounce } from './utils/requestUtils';
import { ErrorHandler } from './utils/errorHandler';
import { getRoles, getRole, createRole, updateRole, deleteRole, getRolePermissions, updateRolePermissions } from './services/roleService';
import { getPermissions, getPermission, createPermission, updatePermission, deletePermission } from './services/permissionService';

const { Header, Content, Sider } = Layout;
const { Search } = Input;

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
      message.success('登录成功');
      // 记录登录成功日志
      LogService.logUserAction('login', 'auth', undefined, { username: values.username });
    } catch (err: any) {
      console.error('Login error:', err);
      // 记录登录失败日志
      const values = form.getFieldsValue();
      LogService.logUserAction('login_failed', 'auth', undefined, { 
        username: values.username, 
        error: err.message || '登录失败' 
      });
      // 表单验证失败，显示错误消息
      if (err.errorFields && err.errorFields.length > 0) {
        message.error(err.errorFields[0].errors[0]);
      } else {
        const errorInfo = ErrorHandler.handleApiError(err);
        message.error(errorInfo.message);
      }
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

  const [searchVisible, setSearchVisible] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [hotSearches, setHotSearches] = useState<string[]>(['店铺', '商品', '库存', '销售', '财务']);

  // 全局搜索处理
  const handleSearch = useCallback(
    debounce(async (value: string) => {
      if (!value.trim()) {
        setSearchResults([]);
        return;
      }
      
      setSearchLoading(true);
      try {
        // 模拟搜索API调用
        // 实际项目中应该调用后端API进行跨模块搜索
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 模拟搜索结果
        const results = [
          { id: 1, type: '店铺', title: '北京旗舰店', path: '/shops', icon: <ShopOutlined /> },
          { id: 2, type: '店铺', title: '上海分店', path: '/shops', icon: <ShopOutlined /> },
          { id: 3, type: '商品', title: 'iPhone 15', path: '/products', icon: <ProductOutlined /> },
          { id: 4, type: '商品', title: 'MacBook Pro', path: '/products', icon: <ProductOutlined /> },
          { id: 5, type: '库存', title: '库存管理', path: '/inventory', icon: <StockOutlined /> },
        ].filter(item => 
          item.title.toLowerCase().includes(value.toLowerCase()) ||
          item.type.toLowerCase().includes(value.toLowerCase())
        );
        
        setSearchResults(results);
        
        // 更新搜索历史
        if (value.trim()) {
          setSearchHistory(prev => {
            const newHistory = [value, ...prev.filter(item => item !== value)].slice(0, 5);
            localStorage.setItem('searchHistory', JSON.stringify(newHistory));
            return newHistory;
          });
        }
        
        LogService.logUserAction('search', 'global', undefined, { keyword: value, results: results.length });
      } catch (error) {
        console.error('Search error:', error);
        message.error('搜索失败，请重试');
      } finally {
        setSearchLoading(false);
      }
    }, 300),
    []
  );

  // 加载搜索历史
  React.useEffect(() => {
    const history = localStorage.getItem('searchHistory');
    if (history) {
      try {
        setSearchHistory(JSON.parse(history));
      } catch (error) {
        console.error('Failed to parse search history:', error);
      }
    }
  }, []);

  // 清除搜索历史
  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('searchHistory');
  };

  // 处理搜索框点击
  const handleSearchClick = () => {
    setSearchVisible(true);
  };

  // 处理搜索框关闭
  const handleSearchClose = () => {
    setSearchVisible(false);
    setSearchValue('');
    setSearchResults([]);
  };

  // 处理搜索项点击
  const handleSearchItemClick = (item: any) => {
    setSearchValue(item.title);
    setSearchVisible(false);
    // 跳转到对应页面
    window.location.href = item.path;
  };

  // 点击外部关闭搜索面板
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const searchContainer = document.querySelector('.search-container');
      if (searchContainer && !searchContainer.contains(event.target as Node)) {
        setSearchVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
          Card: {
            borderRadius: 8,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)',
            hoverShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
            headerColor: '#333333',
            bodyColor: '#333333',
          },
          Table: {
            rowHoverBg: '#f5f5f5',
            headerBg: '#fafafa',
            headerColor: '#666666',
            borderColor: '#e8e8e8',
            borderRadius: 8,
            rowColor: '#333333',
          },
          Button: {
            borderRadius: 4,
            colorPrimary: '#1890ff',
            colorSuccess: '#52c41a',
            colorWarning: '#faad14',
            colorError: '#f5222d',
          },
          Input: {
            borderRadius: 4,
            borderColor: '#e8e8e8',
            placeholderColor: '#999999',
          },
          Select: {
            borderRadius: 4,
            borderColor: '#e8e8e8',
          },
          Tag: {
            borderRadius: 4,
            colorSuccess: '#52c41a',
            colorWarning: '#faad14',
            colorError: '#f5222d',
            colorInfo: '#1890ff',
          },
          Breadcrumb: {
            itemColor: '#666666',
            linkColor: '#1890ff',
          },
          Modal: {
            borderRadius: 8,
            headerColor: '#333333',
            bodyColor: '#333333',
          },
          Form: {
            labelColor: '#666666',
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
              display: { xs: 'none', sm: 'block' },
              whiteSpace: 'nowrap',
            }}>多门店 ERP 系统</div>
            <div style={{ 
              color: 'white', 
              fontSize: '16px', 
              fontWeight: 'bold', 
              marginLeft: 16, 
              display: { xs: 'block', sm: 'none' }
            }}>ERP</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            {isAuthenticated && (
              <>
                <div style={{ 
                  position: 'relative',
                  display: { xs: 'none', sm: 'block' }
                }} className="search-container">
                  <Input.Search
                    placeholder="全局搜索"
                    allowClear
                    enterButton={<SearchOutlined />}
                    style={{ 
                      width: 320,
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                    }}
                    onSearch={handleSearch}
                    onChange={(e) => {
                      setSearchValue(e.target.value);
                      setSearchVisible(true);
                      handleSearch(e.target.value);
                    }}
                    onPressEnter={() => handleSearch(searchValue)}
                    onClick={() => setSearchVisible(true)}
                    onFocus={() => setSearchVisible(true)}
                    inputStyle={{ color: 'white' }}
                    placeholderStyle={{ color: 'rgba(255, 255, 255, 0.6)' }}
                    value={searchValue}
                  />
                  {searchVisible && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      marginTop: 8,
                      backgroundColor: 'white',
                      borderRadius: 8,
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
                      zIndex: 1000,
                      maxHeight: 400,
                      overflow: 'auto'
                    }}>
                      {searchLoading ? (
                        <div style={{ padding: 16, textAlign: 'center' }}>
                          <div className="loading" style={{ display: 'inline-block' }}>搜索中...</div>
                        </div>
                      ) : searchResults.length > 0 ? (
                        searchResults.map(item => (
                          <div
                            key={item.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              padding: '12px 16px',
                              cursor: 'pointer',
                              borderBottom: '1px solid #f0f0f0'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#f5f5f5';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'white';
                            }}
                            onClick={() => handleSearchItemClick(item)}
                          >
                            <div style={{ marginRight: 12, color: '#1890ff' }}>
                              {item.icon}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 500 }}>{item.title}</div>
                              <div style={{ fontSize: 12, color: '#999' }}>{item.type}</div>
                            </div>
                          </div>
                        ))
                      ) : searchValue ? (
                        <div style={{ padding: 16, textAlign: 'center', color: '#999' }}>
                          没有找到相关结果
                        </div>
                      ) : (
                        <div>
                          {searchHistory.length > 0 && (
                            <div style={{ padding: '8px 16px', borderBottom: '1px solid #f0f0f0' }}>
                              <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>搜索历史</div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {searchHistory.map((item, index) => (
                                  <span
                                    key={index}
                                    style={{
                                      padding: '4px 12px',
                                      backgroundColor: '#f5f5f5',
                                      borderRadius: 16,
                                      fontSize: 12,
                                      cursor: 'pointer'
                                    }}
                                    onClick={() => {
                                      setSearchValue(item);
                                      handleSearch(item);
                                    }}
                                  >
                                    {item}
                                  </span>
                                ))}
                                <span
                                  style={{
                                    padding: '4px 12px',
                                    color: '#1890ff',
                                    fontSize: 12,
                                    cursor: 'pointer'
                                  }}
                                  onClick={clearSearchHistory}
                                >
                                  清除历史
                                </span>
                              </div>
                            </div>
                          )}
                          <div style={{ padding: '8px 16px' }}>
                            <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>热门搜索</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                              {hotSearches.map((item, index) => (
                                <span
                                  key={index}
                                  style={{
                                    padding: '4px 12px',
                                    backgroundColor: '#f5f5f5',
                                    borderRadius: 16,
                                    fontSize: 12,
                                    cursor: 'pointer'
                                  }}
                                  onClick={() => {
                                    setSearchValue(item);
                                    handleSearch(item);
                                  }}
                                >
                                  {item}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  padding: '0 12px',
                  borderRadius: 4,
                  marginRight: 16,
                  display: { xs: 'none', sm: 'flex' }
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
                          LogService.logUserAction('logout', 'auth', undefined, { username: user?.username });
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
              onSelect={(e) => {
                // 记录菜单点击日志
                LogService.logUserAction('menu_click', 'navigation', e.key, { path: e.key });
              }}
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
                <div style={{ display: { xs: 'block', sm: 'none' } }}>
                  <Input.Search
                    placeholder="搜索"
                    allowClear
                    enterButton
                    style={{ width: 150 }}
                    onSearch={handleSearch}
                  />
                </div>
              </div>
              
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/shops" element={<ShopPage />} />
                <Route path="/products" element={<ProductPage />} />
                <Route path="/inventory" element={<InventoryPage />} />
                <Route path="/sales" element={<SalesPage />} />
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
  const [loading, setLoading] = React.useState(true);
  
  React.useEffect(() => {
    // 模拟数据加载
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  // 常用操作
  const commonActions = [
    { title: '添加店铺', icon: <ShopOutlined />, path: '/shops', color: '#1890ff' },
    { title: '添加商品', icon: <ProductOutlined />, path: '/products', color: '#52c41a' },
    { title: '调整库存', icon: <StockOutlined />, path: '/inventory', color: '#f5222d' },
    { title: '添加订单', icon: <ShoppingOutlined />, path: '/sales', color: '#faad14' },
    { title: '添加财务记录', icon: <DollarOutlined />, path: '/financial', color: '#722ed1' },
    { title: '查看报表', icon: <BarChartOutlined />, path: '/reports', color: '#13c2c2' },
  ];
  
  return (
    <div style={{ padding: { xs: '0', sm: '0' } }}>
      <h1 style={{ 
        fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' }, 
        fontWeight: 'bold', 
        marginBottom: { xs: '1rem', sm: '1.5rem' }
      }}>欢迎使用多门店 ERP 系统</h1>
      
      {/* 常用操作快捷方式 */}
      <Card className="mb-8" hoverable>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: { xs: '1rem', sm: '1.5rem' }
        }}>
          <h2 style={{ 
            fontSize: { xs: '1.25rem', sm: '1.5rem' }, 
            fontWeight: 'bold',
            margin: 0
          }}>常用操作</h2>
        </div>
        <Row gutter={[{ xs: 12, sm: 16 }, { xs: 12, sm: 16 }]}>
          {commonActions.map((action, index) => (
            <Col key={index} xs={24} sm={12} md={8} lg={4}>
              <Link to={action.path}>
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  padding: { xs: '20px', sm: '24px' }, 
                  backgroundColor: 'white', 
                  borderRadius: '12px', 
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  border: `1px solid ${action.color}20`,
                  minHeight: '140px',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                }} onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12)';
                  e.currentTarget.style.borderColor = action.color;
                }} onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)';
                  e.currentTarget.style.borderColor = `${action.color}20`;
                }}>
                  <div style={{ 
                    fontSize: { xs: '28px', sm: '36px' }, 
                    color: action.color, 
                    marginBottom: '12px',
                    transition: 'all 0.3s ease'
                  }}>
                    {action.icon}
                  </div>
                  <div style={{ 
                    fontWeight: '600', 
                    textAlign: 'center',
                    fontSize: { xs: '14px', sm: '16px' },
                    color: '#333'
                  }}>{action.title}</div>
                </div>
              </Link>
            </Col>
          ))}
        </Row>
      </Card>
      
      {/* 统计卡片 */}
      <Row gutter={[{ xs: 12, sm: 16 }, { xs: 12, sm: 16 }]} className="mb-8">
        <Col xs={24} sm={12} md={6}>
          <Card 
            hoverable 
            loading={loading}
            style={{
              transition: 'all 0.3s ease',
              borderLeft: '4px solid #1890ff'
            }}
            onMouseEnter={(e) => {
              const card = e.currentTarget as HTMLElement;
              card.style.transform = 'translateY(-4px)';
              card.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12)';
            }}
            onMouseLeave={(e) => {
              const card = e.currentTarget as HTMLElement;
              card.style.transform = 'translateY(0)';
              card.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.09)';
            }}
          >
            <Statistic
              title="总店铺数"
              value={10}
              prefix={<ShopOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff', fontSize: '24px', fontWeight: 'bold' }}
              suffix="家"
              size={window.innerWidth < 768 ? 'small' : 'default'}
              titleStyle={{ fontSize: '14px', color: '#666' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card 
            hoverable 
            loading={loading}
            style={{
              transition: 'all 0.3s ease',
              borderLeft: '4px solid #52c41a'
            }}
            onMouseEnter={(e) => {
              const card = e.currentTarget as HTMLElement;
              card.style.transform = 'translateY(-4px)';
              card.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12)';
            }}
            onMouseLeave={(e) => {
              const card = e.currentTarget as HTMLElement;
              card.style.transform = 'translateY(0)';
              card.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.09)';
            }}
          >
            <Statistic
              title="总商品数"
              value={1000}
              prefix={<ProductOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a', fontSize: '24px', fontWeight: 'bold' }}
              suffix="件"
              size={window.innerWidth < 768 ? 'small' : 'default'}
              titleStyle={{ fontSize: '14px', color: '#666' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card 
            hoverable 
            loading={loading}
            style={{
              transition: 'all 0.3s ease',
              borderLeft: '4px solid #faad14'
            }}
            onMouseEnter={(e) => {
              const card = e.currentTarget as HTMLElement;
              card.style.transform = 'translateY(-4px)';
              card.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12)';
            }}
            onMouseLeave={(e) => {
              const card = e.currentTarget as HTMLElement;
              card.style.transform = 'translateY(0)';
              card.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.09)';
            }}
          >
            <Statistic
              title="今日销售额"
              value={10000}
              prefix={<span style={{ color: '#faad14', marginRight: '4px' }}>¥</span>}
              valueStyle={{ color: '#faad14', fontSize: '24px', fontWeight: 'bold' }}
              size={window.innerWidth < 768 ? 'small' : 'default'}
              titleStyle={{ fontSize: '14px', color: '#666' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card 
            hoverable 
            loading={loading}
            style={{
              transition: 'all 0.3s ease',
              borderLeft: '4px solid #f5222d'
            }}
            onMouseEnter={(e) => {
              const card = e.currentTarget as HTMLElement;
              card.style.transform = 'translateY(-4px)';
              card.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12)';
            }}
            onMouseLeave={(e) => {
              const card = e.currentTarget as HTMLElement;
              card.style.transform = 'translateY(0)';
              card.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.09)';
            }}
          >
            <Statistic
              title="库存总量"
              value={5000}
              prefix={<StockOutlined style={{ color: '#f5222d' }} />}
              valueStyle={{ color: '#f5222d', fontSize: '24px', fontWeight: 'bold' }}
              suffix="件"
              size={window.innerWidth < 768 ? 'small' : 'default'}
              titleStyle={{ fontSize: '14px', color: '#666' }}
            />
          </Card>
        </Col>
      </Row>
      
      {/* 最近销售和库存预警 */}
      <Row gutter={[{ xs: 12, sm: 16 }, { xs: 12, sm: 16 }]}>
        <Col xs={24} md={12}>
          <Card 
            title="最近销售订单" 
            hoverable 
            loading={loading}
            style={{
              transition: 'all 0.3s ease',
              borderRadius: 12
            }}
            onMouseEnter={(e) => {
              const card = e.currentTarget as HTMLElement;
              card.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12)';
            }}
            onMouseLeave={(e) => {
              const card = e.currentTarget as HTMLElement;
              card.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.09)';
            }}
            titleStyle={{
              fontWeight: '600',
              fontSize: '16px',
              color: '#333'
            }}
          >
            <Table 
              columns={[
                { 
                  title: '订单号', 
                  dataIndex: 'id', 
                  key: 'id', 
                  width: { xs: 80, sm: 100 },
                  ellipsis: true
                },
                { 
                  title: '店铺', 
                  dataIndex: 'shopId', 
                  key: 'shopId', 
                  ellipsis: true,
                  render: (shopId: string) => (
                    <span style={{ fontWeight: '500' }}>{shopId}</span>
                  )
                },
                { 
                  title: '金额', 
                  dataIndex: 'amount', 
                  key: 'amount', 
                  render: (amount: number) => (
                    <span style={{ fontWeight: '600', color: '#1890ff' }}>¥{amount}</span>
                  ),
                  width: { xs: 100, sm: 120 }
                },
                { 
                  title: '状态', 
                  dataIndex: 'status', 
                  key: 'status', 
                  render: (status: string) => (
                    <Tag 
                      color={status === 'completed' ? 'green' : 'yellow'}
                      style={{ fontSize: '12px', padding: '2px 8px' }}
                    >
                      {status === 'completed' ? '已完成' : '待处理'}
                    </Tag>
                  ),
                  width: { xs: 80, sm: 100 }
                },
                { 
                  title: '时间', 
                  dataIndex: 'time', 
                  key: 'time', 
                  ellipsis: true,
                  width: { xs: 120, sm: 150 },
                  render: (time: string) => (
                    <span style={{ fontSize: '12px', color: '#666' }}>{time}</span>
                  )
                },
              ]} 
              dataSource={[
                { id: '1', shopId: '北京旗舰店', amount: 5999, status: 'completed', time: '2026-04-15 10:00' },
                { id: '2', shopId: '上海分店', amount: 8999, status: 'completed', time: '2026-04-15 09:30' },
                { id: '3', shopId: '广州分店', amount: 12999, status: 'pending', time: '2026-04-15 09:00' },
              ]} 
              rowKey="id"
              pagination={false}
              size={window.innerWidth < 768 ? 'small' : 'default'}
              rowClassName={() => 'hover:bg-gray-50'}
              style={{
                borderRadius: 8,
                overflow: 'hidden'
              }}
            />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card 
            title="库存预警" 
            hoverable 
            loading={loading}
            style={{
              transition: 'all 0.3s ease',
              borderRadius: 12
            }}
            onMouseEnter={(e) => {
              const card = e.currentTarget as HTMLElement;
              card.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12)';
            }}
            onMouseLeave={(e) => {
              const card = e.currentTarget as HTMLElement;
              card.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.09)';
            }}
            titleStyle={{
              fontWeight: '600',
              fontSize: '16px',
              color: '#333'
            }}
          >
            <Table 
              columns={[
                { 
                  title: '商品名称', 
                  dataIndex: 'name', 
                  key: 'name', 
                  ellipsis: true,
                  render: (name: string) => (
                    <span style={{ fontWeight: '500' }}>{name}</span>
                  )
                },
                { 
                  title: '当前库存', 
                  dataIndex: 'current', 
                  key: 'current', 
                  width: 80,
                  render: (current: number, record: any) => (
                    <span style={{ 
                      fontWeight: '600',
                      color: record.status === 'critical' ? '#f5222d' : '#333'
                    }}>{current}</span>
                  )
                },
                { 
                  title: '最低库存', 
                  dataIndex: 'min', 
                  key: 'min', 
                  width: 80,
                  render: (min: number) => (
                    <span style={{ color: '#666' }}>{min}</span>
                  )
                },
                { 
                  title: '店铺', 
                  dataIndex: 'shop', 
                  key: 'shop', 
                  ellipsis: true
                },
                { 
                  title: '状态', 
                  dataIndex: 'status', 
                  key: 'status', 
                  render: (status: string) => (
                    <Tag 
                      color={status === 'critical' ? 'red' : 'orange'}
                      style={{ fontSize: '12px', padding: '2px 8px' }}
                    >
                      {status === 'critical' ? '严重不足' : '即将不足'}
                    </Tag>
                  ),
                  width: { xs: 90, sm: 120 }
                },
              ]} 
              dataSource={[
                { name: 'iPhone 15', current: 5, min: 10, shop: '北京旗舰店', status: 'critical' },
                { name: 'MacBook Pro', current: 8, min: 10, shop: '上海分店', status: 'warning' },
                { name: 'AirPods Pro', current: 15, min: 20, shop: '广州分店', status: 'warning' },
              ]} 
              rowKey="name"
              pagination={false}
              size={window.innerWidth < 768 ? 'small' : 'default'}
              rowClassName={() => 'hover:bg-gray-50'}
              style={{
                borderRadius: 8,
                overflow: 'hidden'
              }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

const ShopPage: React.FC = () => {
  const [shops, setShops] = React.useState<any[]>([]);
  const [filteredShops, setFilteredShops] = React.useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isBatchEditModalOpen, setIsBatchEditModalOpen] = React.useState(false);
  const [editingShop, setEditingShop] = React.useState<any>(null);
  const [selectedShopIds, setSelectedShopIds] = React.useState<string[]>([]);
  const [form] = Form.useForm();
  const [batchForm] = Form.useForm();
  const [searchValue, setSearchValue] = React.useState('');
  const [selectedManager, setSelectedManager] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = React.useState(false);
  const [advancedSearch, setAdvancedSearch] = React.useState({
    name: '',
    address: '',
    phone: '',
    manager: ''
  });

  // 从API获取店铺数据
  React.useEffect(() => {
    const fetchShops = async () => {
      try {
        setLoading(true);
        const response = await shopApi.getAll({ search: searchValue });
        setShops(response.data);
      } catch (error) {
        console.error('Error fetching shops:', error);
        // 失败时使用模拟数据
        setShops([
          { id: '1', name: '北京旗舰店', address: '北京市朝阳区', phone: '13800138001', manager: '张三' },
          { id: '2', name: '上海分店', address: '上海市浦东新区', phone: '13800138002', manager: '李四' },
          { id: '3', name: '广州分店', address: '广州市天河区', phone: '13800138003', manager: '王五' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchShops();
  }, [searchValue]);

  // 处理高级搜索
  const handleAdvancedSearch = () => {
    // 构建搜索参数
    const params: any = {};
    if (advancedSearch.name) params.name = advancedSearch.name;
    if (advancedSearch.address) params.address = advancedSearch.address;
    if (advancedSearch.phone) params.phone = advancedSearch.phone;
    if (advancedSearch.manager) params.manager = advancedSearch.manager;
    
    // 调用API进行高级搜索
    const fetchAdvancedSearch = async () => {
      try {
        setLoading(true);
        const response = await shopApi.getAll(params);
        setFilteredShops(response.data);
      } catch (error) {
        console.error('Error in advanced search:', error);
        // 失败时使用本地过滤
        filterShopsLocally();
      } finally {
        setLoading(false);
      }
    };
    
    fetchAdvancedSearch();
  };

  // 本地过滤店铺数据
  const filterShopsLocally = () => {
    let result = [...shops];
    
    // 按名称搜索
    if (searchValue) {
      result = result.filter(shop => 
        shop.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        shop.address.toLowerCase().includes(searchValue.toLowerCase()) ||
        shop.manager.toLowerCase().includes(searchValue.toLowerCase())
      );
    }
    
    // 按负责人筛选
    if (selectedManager) {
      result = result.filter(shop => shop.manager === selectedManager);
    }
    
    // 高级搜索条件
    if (advancedSearch.name) {
      result = result.filter(shop => 
        shop.name.toLowerCase().includes(advancedSearch.name.toLowerCase())
      );
    }
    if (advancedSearch.address) {
      result = result.filter(shop => 
        shop.address.toLowerCase().includes(advancedSearch.address.toLowerCase())
      );
    }
    if (advancedSearch.phone) {
      result = result.filter(shop => 
        shop.phone.includes(advancedSearch.phone)
      );
    }
    if (advancedSearch.manager) {
      result = result.filter(shop => 
        shop.manager.toLowerCase().includes(advancedSearch.manager.toLowerCase())
      );
    }
    
    setFilteredShops(result);
  };

  // 过滤店铺数据
  React.useEffect(() => {
    // 使用setTimeout模拟异步数据处理，避免阻塞主线程
    const timer = setTimeout(() => {
      filterShopsLocally();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [shops, searchValue, selectedManager, advancedSearch]);

  // 处理重置筛选
  const handleResetFilters = () => {
    setSearchValue('');
    setSelectedManager('');
    setAdvancedSearch({ name: '', address: '', phone: '', manager: '' });
    setIsAdvancedSearchOpen(false);
  };

  const showModal = (shop?: any) => {
    if (shop) {
      setEditingShop(shop);
      form.setFieldsValue(shop);
    } else {
      setEditingShop(null);
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingShop) {
        // 调用API更新店铺
        await shopApi.update(editingShop.id, values);
        // 更新本地状态
        setShops(shops.map(shop => shop.id === editingShop.id ? { ...shop, ...values } : shop));
        message.success('店铺更新成功');
      } else {
        // 调用API添加店铺
        const newShop = await shopApi.create(values);
        // 更新本地状态
        setShops([...shops, newShop]);
        message.success('店铺添加成功');
      }
      setIsModalOpen(false);
      form.resetFields();
    } catch (error) {
      console.error('Error saving shop:', error);
      message.error('操作失败，请重试');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      // 调用API删除店铺
      await shopApi.delete(id);
      // 更新本地状态
      setShops(shops.filter(shop => shop.id !== id));
      message.success('店铺删除成功');
    } catch (error) {
      console.error('Error deleting shop:', error);
      message.error('删除失败，请重试');
    }
  };

  // 导出Excel
  const exportToExcel = () => {
    const exportData = filteredShops.map(shop => ({
      '店铺名称': shop.name,
      '地址': shop.address,
      '电话': shop.phone,
      '负责人': shop.manager
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '店铺数据');
    XLSX.writeFile(workbook, `店铺数据_${new Date().toISOString().split('T')[0]}.xlsx`);
    message.success('导出成功');
  };

  // 导出PDF
  const exportToPDF = () => {
    // 模拟PDF导出功能
    // 实际项目中可以使用jsPDF、html2pdf等库实现
    message.info('PDF导出功能开发中，敬请期待');
    // 这里可以添加实际的PDF导出代码
    // 例如使用jsPDF库生成PDF文件
    /*
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text('店铺数据', 10, 10);
    let y = 20;
    filteredShops.forEach((shop, index) => {
      doc.text(`${index + 1}. ${shop.name} - ${shop.address} - ${shop.phone} - ${shop.manager}`, 10, y);
      y += 10;
    });
    doc.save(`店铺数据_${new Date().toISOString().split('T')[0]}.pdf`);
    */
  };

  // 导入Excel
  const handleImportExcel = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        // 转换数据格式
        const shopsToImport = jsonData.map((item: any) => ({
          name: item['店铺名称'] || item['name'],
          address: item['地址'] || item['address'],
          phone: item['电话'] || item['phone'],
          manager: item['负责人'] || item['manager']
        })).filter((shop: any) => shop.name);
        
        if (shopsToImport.length === 0) {
          message.warning('Excel文件中没有有效的店铺数据');
          return;
        }
        
        // 批量导入店铺
        for (const shop of shopsToImport) {
          try {
            await shopApi.create(shop);
          } catch (error) {
            console.error('Error importing shop:', error);
          }
        }
        
        // 重新获取店铺列表
        const response = await shopApi.getAll({ search: searchValue });
        setShops(response.data);
        message.success(`成功导入 ${shopsToImport.length} 个店铺`);
      } catch (error) {
        console.error('Error importing Excel:', error);
        message.error('导入失败，请检查Excel文件格式');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // 处理选择变化
  const handleSelectChange = (selectedRowKeys: string[]) => {
    setSelectedShopIds(selectedRowKeys);
  };

  // 批量删除
  const handleBatchDelete = () => {
    if (selectedShopIds.length === 0) {
      message.warning('请选择要删除的店铺');
      return;
    }
    setShops(shops.filter(shop => !selectedShopIds.includes(shop.id)));
    setSelectedShopIds([]);
    message.success(`成功删除 ${selectedShopIds.length} 个店铺`);
  };

  // 打开批量编辑模态框
  const handleBatchEdit = () => {
    if (selectedShopIds.length === 0) {
      message.warning('请选择要编辑的店铺');
      return;
    }
    batchForm.resetFields();
    setIsBatchEditModalOpen(true);
  };

  // 批量编辑确定
  const handleBatchEditOk = () => {
    batchForm.validateFields().then(values => {
      setShops(shops.map(shop => {
        if (selectedShopIds.includes(shop.id)) {
          return { ...shop, ...values };
        }
        return shop;
      }));
      setIsBatchEditModalOpen(false);
      setSelectedShopIds([]);
      message.success(`成功编辑 ${selectedShopIds.length} 个店铺`);
    });
  };

  // 批量编辑取消
  const handleBatchEditCancel = () => {
    setIsBatchEditModalOpen(false);
    batchForm.resetFields();
  };

  // 获取所有负责人列表
  const managers = [...new Set(shops.map(shop => shop.manager))];

  const columns = [
    {
      title: () => <Checkbox indeterminate={selectedShopIds.length > 0 && selectedShopIds.length < filteredShops.length} checked={filteredShops.length > 0 && selectedShopIds.length === filteredShops.length} onChange={(e) => {
        if (e.target.checked) {
          setSelectedShopIds(filteredShops.map(shop => shop.id));
        } else {
          setSelectedShopIds([]);
        }
      }} />,
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => (
        <Checkbox checked={selectedShopIds.includes(id)} onChange={(e) => {
          if (e.target.checked) {
            setSelectedShopIds([...selectedShopIds, id]);
          } else {
            setSelectedShopIds(selectedShopIds.filter(shopId => shopId !== id));
          }
        }} />
      ),
      width: 60,
    },
    { title: '店铺名称', dataIndex: 'name', key: 'name' },
    { title: '地址', dataIndex: 'address', key: 'address' },
    { title: '电话', dataIndex: 'phone', key: 'phone' },
    { title: '负责人', dataIndex: 'manager', key: 'manager' },
    { 
      title: '操作', 
      key: 'action', 
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button type="primary" icon={<EditOutlined />} onClick={() => showModal(record)}>编辑</Button>
          <Button danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>删除</Button>
        </Space>
      ) 
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">店铺管理</h1>
        <Space>
          {selectedShopIds.length > 0 && (
            <Space>
              <Button danger icon={<DeleteOutlined />} onClick={handleBatchDelete}>批量删除</Button>
              <Button type="primary" icon={<EditOutlined />} onClick={handleBatchEdit}>批量编辑</Button>
            </Space>
          )}
          <Space>
            <Upload.Dragger
              name="file"
              accept=".xlsx,.xls"
              beforeUpload={(file) => {
                handleImportExcel(file);
                return false;
              }}
              showUploadList={false}
            >
              <Button icon={<UploadOutlined />}>导入Excel</Button>
            </Upload.Dragger>
            <Dropdown 
              menu={{ 
                items: [
                  { key: 'excel', label: '导出Excel', onClick: exportToExcel },
                  { key: 'pdf', label: '导出PDF', onClick: exportToPDF },
                ] 
              }} 
            >
              <Button icon={<DownloadOutlined />}>导出</Button>
            </Dropdown>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>添加店铺</Button>
          </Space>
        </Space>
      </div>
      
      {/* 快捷操作栏 */}
      <Card className="mb-4" hoverable>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={6} md={4}>
            <Button type="default" icon={<SearchOutlined />} onClick={() => setIsAdvancedSearchOpen(true)}>
              高级搜索
            </Button>
          </Col>
          <Col xs={24} sm={6} md={4}>
            <Button type="default" icon={<DownloadOutlined />} onClick={exportToExcel}>
              导出数据
            </Button>
          </Col>
          <Col xs={24} sm={6} md={4}>
            <Button type="default" icon={<UploadOutlined />} onClick={() => {
              // 触发文件选择
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.xlsx,.xls';
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) handleImportExcel(file);
              };
              input.click();
            }}>
              导入数据
            </Button>
          </Col>
          <Col xs={24} sm={6} md={4}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
              快速添加
            </Button>
          </Col>
        </Row>
      </Card>
      
      {/* 搜索和筛选 */}
      <Card className="mb-4" hoverable>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input.Search
              placeholder="搜索店铺名称、地址或负责人"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              allowClear
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="按负责人筛选"
              value={selectedManager || undefined}
              onChange={setSelectedManager}
              allowClear
              style={{ width: '100%' }}
            >
              {managers.map(manager => (
                <Select.Option key={manager} value={manager}>{manager}</Select.Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4} offset={6}>
            <Button type="default" onClick={handleResetFilters}>重置筛选</Button>
          </Col>
        </Row>
        
        {/* 高级搜索 */}
        <div className="mt-4">
          <Button 
            type="link" 
            onClick={() => setIsAdvancedSearchOpen(!isAdvancedSearchOpen)}
            style={{ fontSize: '14px' }}
          >
            {isAdvancedSearchOpen ? '收起高级搜索' : '高级搜索'}
          </Button>
          {isAdvancedSearchOpen && (
            <div className="mt-4 p-4 bg-gray-50 rounded" style={{ borderRadius: 8, border: '1px solid #e8e8e8' }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item label="店铺名称" labelStyle={{ fontSize: '14px', color: '#666' }}>
                    <Input 
                      placeholder="请输入店铺名称" 
                      value={advancedSearch.name} 
                      onChange={(e) => setAdvancedSearch({...advancedSearch, name: e.target.value})}
                      style={{ borderRadius: 4 }}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item label="地址" labelStyle={{ fontSize: '14px', color: '#666' }}>
                    <Input 
                      placeholder="请输入地址" 
                      value={advancedSearch.address} 
                      onChange={(e) => setAdvancedSearch({...advancedSearch, address: e.target.value})}
                      style={{ borderRadius: 4 }}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item label="电话" labelStyle={{ fontSize: '14px', color: '#666' }}>
                    <Input 
                      placeholder="请输入电话" 
                      value={advancedSearch.phone} 
                      onChange={(e) => setAdvancedSearch({...advancedSearch, phone: e.target.value})}
                      style={{ borderRadius: 4 }}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item label="负责人" labelStyle={{ fontSize: '14px', color: '#666' }}>
                    <Input 
                      placeholder="请输入负责人" 
                      value={advancedSearch.manager} 
                      onChange={(e) => setAdvancedSearch({...advancedSearch, manager: e.target.value})}
                      style={{ borderRadius: 4 }}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={24} md={16} className="flex justify-end">
                  <Space>
                    <Button 
                      onClick={() => setAdvancedSearch({ name: '', address: '', phone: '', manager: '' })}
                      style={{ borderRadius: 4 }}
                    >
                      清空
                    </Button>
                    <Button 
                      type="primary" 
                      onClick={handleAdvancedSearch}
                      style={{ borderRadius: 4 }}
                    >
                      应用筛选
                    </Button>
                  </Space>
                </Col>
              </Row>
            </div>
          )}
        </div>
      </Card>
      
      <Table 
        columns={columns} 
        dataSource={filteredShops} 
        rowKey="id" 
        pagination={{ pageSize: 10 }}
        loading={loading}
        style={{ marginBottom: 20 }}
      />
      
      {/* 模态框 */}
      <Modal
        title={editingShop ? '编辑店铺' : '添加店铺'}
        open={isModalOpen}
        onCancel={handleCancel}
        onOk={handleOk}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="店铺名称"
            rules={[
              { required: true, message: '请输入店铺名称' },
              { min: 2, max: 50, message: '店铺名称长度应在2-50个字符之间' }
            ]}
          >
            <Input placeholder="请输入店铺名称" />
          </Form.Item>
          <Form.Item
            name="address"
            label="地址"
            rules={[
              { required: true, message: '请输入地址' },
              { min: 5, max: 200, message: '地址长度应在5-200个字符之间' }
            ]}
          >
            <Input placeholder="请输入地址" />
          </Form.Item>
          <Form.Item
            name="phone"
            label="电话"
            rules={[
              { required: true, message: '请输入电话' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码' }
            ]}
          >
            <Input placeholder="请输入电话" />
          </Form.Item>
          <Form.Item
            name="manager"
            label="负责人"
            rules={[
              { required: true, message: '请输入负责人' },
              { min: 2, max: 20, message: '负责人姓名长度应在2-20个字符之间' }
            ]}
          >
            <Input placeholder="请输入负责人" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 批量编辑模态框 */}
      <Modal
        title="批量编辑店铺"
        open={isBatchEditModalOpen}
        onCancel={handleBatchEditCancel}
        onOk={handleBatchEditOk}
      >
        <Form
          form={batchForm}
          layout="vertical"
        >
          <Form.Item
            name="address"
            label="地址"
          >
            <Input placeholder="请输入地址（留空不修改）" />
          </Form.Item>
          <Form.Item
            name="phone"
            label="电话"
          >
            <Input placeholder="请输入电话（留空不修改）" />
          </Form.Item>
          <Form.Item
            name="manager"
            label="负责人"
          >
            <Input placeholder="请输入负责人（留空不修改）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

const ProductPage: React.FC = () => {
  const [products, setProducts] = React.useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = React.useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isBatchEditModalOpen, setIsBatchEditModalOpen] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<any>(null);
  const [selectedProductIds, setSelectedProductIds] = React.useState<string[]>([]);
  const [form] = Form.useForm();
  const [batchForm] = Form.useForm();
  const [searchValue, setSearchValue] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('');
  const [selectedBrand, setSelectedBrand] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = React.useState(false);
  const [advancedSearch, setAdvancedSearch] = React.useState({
    name: '',
    model: '',
    minPrice: '',
    maxPrice: '',
    minStock: '',
    maxStock: ''
  });

  // 从API获取商品数据
  React.useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await productApi.getAll({ 
          search: searchValue, 
          category: selectedCategory,
          shopId: ''
        });
        setProducts(response.data);
      } catch (error) {
        console.error('Error fetching products:', error);
        // 失败时使用模拟数据
        setProducts([
          { id: '1', name: 'iPhone 15', category: '手机', brand: 'Apple', model: 'A2650', price: 5999, costPrice: 5000, stock: 50, shopId: '1' },
          { id: '2', name: 'MacBook Pro', category: '电脑', brand: 'Apple', model: 'M3', price: 12999, costPrice: 10000, stock: 20, shopId: '1' },
          { id: '3', name: 'iPad Pro', category: '平板', brand: 'Apple', model: 'M2', price: 8999, costPrice: 7000, stock: 30, shopId: '2' },
          { id: '4', name: 'AirPods Pro', category: '耳机', brand: 'Apple', model: '2nd Gen', price: 1999, costPrice: 1500, stock: 100, shopId: '3' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [searchValue, selectedCategory]);

  // 处理高级搜索
  const handleAdvancedSearch = () => {
    // 构建搜索参数
    const params: any = {};
    if (advancedSearch.name) params.name = advancedSearch.name;
    if (advancedSearch.model) params.model = advancedSearch.model;
    if (advancedSearch.minPrice) params.minPrice = parseFloat(advancedSearch.minPrice);
    if (advancedSearch.maxPrice) params.maxPrice = parseFloat(advancedSearch.maxPrice);
    if (advancedSearch.minStock) params.minStock = parseInt(advancedSearch.minStock);
    if (advancedSearch.maxStock) params.maxStock = parseInt(advancedSearch.maxStock);
    
    // 调用API进行高级搜索
    const fetchAdvancedSearch = async () => {
      try {
        setLoading(true);
        const response = await productApi.getAll(params);
        setFilteredProducts(response.data);
      } catch (error) {
        console.error('Error in advanced search:', error);
        // 失败时使用本地过滤
        filterProductsLocally();
      } finally {
        setLoading(false);
      }
    };
    
    fetchAdvancedSearch();
  };

  // 本地过滤商品数据
  const filterProductsLocally = () => {
    let result = [...products];
    
    // 按名称搜索
    if (searchValue) {
      result = result.filter(product => 
        product.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        product.model.toLowerCase().includes(searchValue.toLowerCase())
      );
    }
    
    // 按分类筛选
    if (selectedCategory) {
      result = result.filter(product => product.category === selectedCategory);
    }
    
    // 按品牌筛选
    if (selectedBrand) {
      result = result.filter(product => product.brand === selectedBrand);
    }
    
    // 高级搜索条件
    if (advancedSearch.name) {
      result = result.filter(product => 
        product.name.toLowerCase().includes(advancedSearch.name.toLowerCase())
      );
    }
    if (advancedSearch.model) {
      result = result.filter(product => 
        product.model.toLowerCase().includes(advancedSearch.model.toLowerCase())
      );
    }
    if (advancedSearch.minPrice) {
      result = result.filter(product => 
        product.price >= parseFloat(advancedSearch.minPrice)
      );
    }
    if (advancedSearch.maxPrice) {
      result = result.filter(product => 
        product.price <= parseFloat(advancedSearch.maxPrice)
      );
    }
    if (advancedSearch.minStock) {
      result = result.filter(product => 
        product.stock >= parseInt(advancedSearch.minStock)
      );
    }
    if (advancedSearch.maxStock) {
      result = result.filter(product => 
        product.stock <= parseInt(advancedSearch.maxStock)
      );
    }
    
    setFilteredProducts(result);
  };

  // 过滤商品数据
  React.useEffect(() => {
    // 使用setTimeout模拟异步数据处理，避免阻塞主线程
    const timer = setTimeout(() => {
      filterProductsLocally();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [products, searchValue, selectedCategory, selectedBrand, advancedSearch]);

  // 处理重置筛选
  const handleResetFilters = () => {
    setSearchValue('');
    setSelectedCategory('');
    setSelectedBrand('');
    setAdvancedSearch({ name: '', model: '', minPrice: '', maxPrice: '', minStock: '', maxStock: '' });
    setIsAdvancedSearchOpen(false);
  };

  const showModal = (product?: any) => {
    if (product) {
      setEditingProduct(product);
      form.setFieldsValue(product);
    } else {
      setEditingProduct(null);
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingProduct) {
        // 调用API更新商品
        await productApi.update(editingProduct.id, values);
        // 更新本地状态
        setProducts(products.map(product => product.id === editingProduct.id ? { ...product, ...values } : product));
        message.success('商品更新成功');
      } else {
        // 调用API添加商品
        const newProduct = await productApi.create(values);
        // 更新本地状态
        setProducts([...products, newProduct]);
        message.success('商品添加成功');
      }
      setIsModalOpen(false);
      form.resetFields();
    } catch (error) {
      console.error('Error saving product:', error);
      message.error('操作失败，请重试');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      // 调用API删除商品
      await productApi.delete(id);
      // 更新本地状态
      setProducts(products.filter(product => product.id !== id));
      message.success('商品删除成功');
    } catch (error) {
      console.error('Error deleting product:', error);
      message.error('删除失败，请重试');
    }
  };

  // 导出Excel
  const exportToExcel = () => {
    const exportData = filteredProducts.map(product => ({
      '商品名称': product.name,
      '分类': product.category,
      '品牌': product.brand,
      '型号': product.model,
      '价格': product.price,
      '成本价': product.costPrice,
      '库存': product.stock,
      '所属店铺': product.shopId
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '商品数据');
    XLSX.writeFile(workbook, `商品数据_${new Date().toISOString().split('T')[0]}.xlsx`);
    message.success('导出成功');
  };

  // 导出PDF
  const exportToPDF = () => {
    // 模拟PDF导出功能
    // 实际项目中可以使用jsPDF、html2pdf等库实现
    message.info('PDF导出功能开发中，敬请期待');
    // 这里可以添加实际的PDF导出代码
    // 例如使用jsPDF库生成PDF文件
    /*
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text('商品数据', 10, 10);
    let y = 20;
    filteredProducts.forEach((product, index) => {
      doc.text(`${index + 1}. ${product.name} - ${product.category} - ${product.brand} - ${product.model} - ¥${product.price} - 库存: ${product.stock}`, 10, y);
      y += 10;
    });
    doc.save(`商品数据_${new Date().toISOString().split('T')[0]}.pdf`);
    */
  };

  // 导入Excel
  const handleImportExcel = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        // 转换数据格式
        const productsToImport = jsonData.map((item: any) => ({
          name: item['商品名称'] || item['name'],
          category: item['分类'] || item['category'],
          brand: item['品牌'] || item['brand'],
          model: item['型号'] || item['model'],
          price: parseFloat(item['价格'] || item['price'] || 0),
          costPrice: parseFloat(item['成本价'] || item['costPrice'] || 0),
          stock: parseInt(item['库存'] || item['stock'] || 0),
          shopId: item['所属店铺'] || item['shopId']
        })).filter((product: any) => product.name);
        
        if (productsToImport.length === 0) {
          message.warning('Excel文件中没有有效的商品数据');
          return;
        }
        
        // 批量导入商品
        try {
          await productApi.createBatch(productsToImport);
        } catch (error) {
          console.error('Error importing products in batch:', error);
          // 批量导入失败时，尝试逐个导入
          for (const product of productsToImport) {
            try {
              await productApi.create(product);
            } catch (err) {
              console.error('Error importing product:', err);
            }
          }
        }
        
        // 重新获取商品列表
        const response = await productApi.getAll({ 
          search: searchValue, 
          category: selectedCategory,
          shopId: ''
        });
        setProducts(response.data);
        message.success(`成功导入 ${productsToImport.length} 个商品`);
      } catch (error) {
        console.error('Error importing Excel:', error);
        message.error('导入失败，请检查Excel文件格式');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // 处理选择变化
  const handleSelectChange = (selectedRowKeys: string[]) => {
    setSelectedProductIds(selectedRowKeys);
  };

  // 批量删除
  const handleBatchDelete = () => {
    if (selectedProductIds.length === 0) {
      message.warning('请选择要删除的商品');
      return;
    }
    setProducts(products.filter(product => !selectedProductIds.includes(product.id)));
    setSelectedProductIds([]);
    message.success(`成功删除 ${selectedProductIds.length} 个商品`);
  };

  // 打开批量编辑模态框
  const handleBatchEdit = () => {
    if (selectedProductIds.length === 0) {
      message.warning('请选择要编辑的商品');
      return;
    }
    batchForm.resetFields();
    setIsBatchEditModalOpen(true);
  };

  // 批量编辑确定
  const handleBatchEditOk = () => {
    batchForm.validateFields().then(values => {
      setProducts(products.map(product => {
        if (selectedProductIds.includes(product.id)) {
          return { ...product, ...values };
        }
        return product;
      }));
      setIsBatchEditModalOpen(false);
      setSelectedProductIds([]);
      message.success(`成功编辑 ${selectedProductIds.length} 个商品`);
    });
  };

  // 批量编辑取消
  const handleBatchEditCancel = () => {
    setIsBatchEditModalOpen(false);
    batchForm.resetFields();
  };

  // 获取所有分类和品牌列表
  const categories = [...new Set(products.map(product => product.category))];
  const brands = [...new Set(products.map(product => product.brand))];

  const columns = [
    {
      title: () => <Checkbox indeterminate={selectedProductIds.length > 0 && selectedProductIds.length < filteredProducts.length} checked={filteredProducts.length > 0 && selectedProductIds.length === filteredProducts.length} onChange={(e) => {
        if (e.target.checked) {
          setSelectedProductIds(filteredProducts.map(product => product.id));
        } else {
          setSelectedProductIds([]);
        }
      }} />,
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => (
        <Checkbox checked={selectedProductIds.includes(id)} onChange={(e) => {
          if (e.target.checked) {
            setSelectedProductIds([...selectedProductIds, id]);
          } else {
            setSelectedProductIds(selectedProductIds.filter(productId => productId !== id));
          }
        }} />
      ),
      width: 60,
    },
    { title: '商品名称', dataIndex: 'name', key: 'name' },
    { title: '分类', dataIndex: 'category', key: 'category' },
    { title: '品牌', dataIndex: 'brand', key: 'brand' },
    { title: '型号', dataIndex: 'model', key: 'model' },
    { title: '价格', dataIndex: 'price', key: 'price', render: (price: number) => `¥${price}` },
    { title: '成本价', dataIndex: 'costPrice', key: 'costPrice', render: (costPrice: number) => `¥${costPrice}` },
    { title: '库存', dataIndex: 'stock', key: 'stock' },
    { title: '所属店铺', dataIndex: 'shopId', key: 'shopId' },
    { 
      title: '操作', 
      key: 'action', 
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button type="primary" icon={<EditOutlined />} onClick={() => showModal(record)}>编辑</Button>
          <Button danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>删除</Button>
        </Space>
      ) 
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">商品管理</h1>
        <Space>
          {selectedProductIds.length > 0 && (
            <Space>
              <Button danger icon={<DeleteOutlined />} onClick={handleBatchDelete}>批量删除</Button>
              <Button type="primary" icon={<EditOutlined />} onClick={handleBatchEdit}>批量编辑</Button>
            </Space>
          )}
          <Space>
            <Upload.Dragger
              name="file"
              accept=".xlsx,.xls"
              beforeUpload={(file) => {
                handleImportExcel(file);
                return false;
              }}
              showUploadList={false}
            >
              <Button icon={<UploadOutlined />}>导入Excel</Button>
            </Upload.Dragger>
            <Dropdown 
              menu={{ 
                items: [
                  { key: 'excel', label: '导出Excel', onClick: exportToExcel },
                  { key: 'pdf', label: '导出PDF', onClick: exportToPDF },
                ] 
              }} 
            >
              <Button icon={<DownloadOutlined />}>导出</Button>
            </Dropdown>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>添加商品</Button>
          </Space>
        </Space>
      </div>
      
      {/* 搜索和筛选 */}
      <Card className="mb-4" hoverable>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input.Search
              placeholder="搜索商品名称或型号"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              allowClear
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={6} md={4}>
            <Select
              placeholder="按分类筛选"
              value={selectedCategory || undefined}
              onChange={setSelectedCategory}
              allowClear
              style={{ width: '100%' }}
            >
              {categories.map(category => (
                <Select.Option key={category} value={category}>{category}</Select.Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={6} md={4}>
            <Select
              placeholder="按品牌筛选"
              value={selectedBrand || undefined}
              onChange={setSelectedBrand}
              allowClear
              style={{ width: '100%' }}
            >
              {brands.map(brand => (
                <Select.Option key={brand} value={brand}>{brand}</Select.Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4} offset={4}>
            <Button type="default" onClick={handleResetFilters}>重置筛选</Button>
          </Col>
        </Row>
        
        {/* 高级搜索 */}
        <div className="mt-4">
          <Button 
            type="link" 
            onClick={() => setIsAdvancedSearchOpen(!isAdvancedSearchOpen)}
            style={{ fontSize: '14px' }}
          >
            {isAdvancedSearchOpen ? '收起高级搜索' : '高级搜索'}
          </Button>
          {isAdvancedSearchOpen && (
            <div className="mt-4 p-4 bg-gray-50 rounded" style={{ borderRadius: 8, border: '1px solid #e8e8e8' }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item label="商品名称" labelStyle={{ fontSize: '14px', color: '#666' }}>
                    <Input 
                      placeholder="请输入商品名称" 
                      value={advancedSearch.name} 
                      onChange={(e) => setAdvancedSearch({...advancedSearch, name: e.target.value})}
                      style={{ borderRadius: 4 }}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item label="型号" labelStyle={{ fontSize: '14px', color: '#666' }}>
                    <Input 
                      placeholder="请输入型号" 
                      value={advancedSearch.model} 
                      onChange={(e) => setAdvancedSearch({...advancedSearch, model: e.target.value})}
                      style={{ borderRadius: 4 }}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item label="价格范围" labelStyle={{ fontSize: '14px', color: '#666' }}>
                    <Row gutter={8}>
                      <Col span={12}>
                        <Input 
                          placeholder="最低" 
                          type="number" 
                          min="0" 
                          step="0.01" 
                          value={advancedSearch.minPrice} 
                          onChange={(e) => setAdvancedSearch({...advancedSearch, minPrice: e.target.value})}
                          style={{ borderRadius: 4 }}
                        />
                      </Col>
                      <Col span={12}>
                        <Input 
                          placeholder="最高" 
                          type="number" 
                          min="0" 
                          step="0.01" 
                          value={advancedSearch.maxPrice} 
                          onChange={(e) => setAdvancedSearch({...advancedSearch, maxPrice: e.target.value})}
                          style={{ borderRadius: 4 }}
                        />
                      </Col>
                    </Row>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item label="库存范围" labelStyle={{ fontSize: '14px', color: '#666' }}>
                    <Row gutter={8}>
                      <Col span={12}>
                        <Input 
                          placeholder="最低" 
                          type="number" 
                          min="0" 
                          value={advancedSearch.minStock} 
                          onChange={(e) => setAdvancedSearch({...advancedSearch, minStock: e.target.value})}
                          style={{ borderRadius: 4 }}
                        />
                      </Col>
                      <Col span={12}>
                        <Input 
                          placeholder="最高" 
                          type="number" 
                          min="0" 
                          value={advancedSearch.maxStock} 
                          onChange={(e) => setAdvancedSearch({...advancedSearch, maxStock: e.target.value})}
                          style={{ borderRadius: 4 }}
                        />
                      </Col>
                    </Row>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={24} md={16} className="flex justify-end">
                  <Space>
                    <Button 
                      onClick={() => setAdvancedSearch({ name: '', model: '', minPrice: '', maxPrice: '', minStock: '', maxStock: '' })}
                      style={{ borderRadius: 4 }}
                    >
                      清空
                    </Button>
                    <Button 
                      type="primary" 
                      onClick={handleAdvancedSearch}
                      style={{ borderRadius: 4 }}
                    >
                      应用筛选
                    </Button>
                  </Space>
                </Col>
              </Row>
            </div>
          )}
        </div>
      </Card>
      
      <Table 
        columns={columns} 
        dataSource={filteredProducts} 
        rowKey="id" 
        pagination={{ pageSize: 10 }}
        loading={loading}
        style={{ marginBottom: 20 }}
      />
      
      {/* 模态框 */}
      <Modal
        title={editingProduct ? '编辑商品' : '添加商品'}
        open={isModalOpen}
        onCancel={handleCancel}
        onOk={handleOk}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="商品名称"
            rules={[
              { required: true, message: '请输入商品名称' },
              { min: 2, max: 100, message: '商品名称长度应在2-100个字符之间' }
            ]}
          >
            <Input placeholder="请输入商品名称" />
          </Form.Item>
          <Form.Item
            name="category"
            label="分类"
            rules={[
              { required: true, message: '请输入分类' },
              { min: 1, max: 50, message: '分类长度应在1-50个字符之间' }
            ]}
          >
            <Input placeholder="请输入分类" />
          </Form.Item>
          <Form.Item
            name="brand"
            label="品牌"
            rules={[
              { required: true, message: '请输入品牌' },
              { min: 1, max: 50, message: '品牌长度应在1-50个字符之间' }
            ]}
          >
            <Input placeholder="请输入品牌" />
          </Form.Item>
          <Form.Item
            name="model"
            label="型号"
            rules={[
              { required: true, message: '请输入型号' },
              { min: 1, max: 100, message: '型号长度应在1-100个字符之间' }
            ]}
          >
            <Input placeholder="请输入型号" />
          </Form.Item>
          <Form.Item
            name="price"
            label="价格"
            rules={[
              { required: true, message: '请输入价格' },
              { type: 'number', min: 0.01, message: '价格必须大于0' }
            ]}
          >
            <Input type="number" placeholder="请输入价格" step="0.01" />
          </Form.Item>
          <Form.Item
            name="costPrice"
            label="成本价"
            rules={[
              { required: true, message: '请输入成本价' },
              { type: 'number', min: 0.01, message: '成本价必须大于0' }
            ]}
          >
            <Input type="number" placeholder="请输入成本价" step="0.01" />
          </Form.Item>
          <Form.Item
            name="stock"
            label="库存"
            rules={[
              { required: true, message: '请输入库存' },
              { type: 'number', min: 0, message: '库存必须大于等于0' }
            ]}
          >
            <Input type="number" placeholder="请输入库存" min="0" />
          </Form.Item>
          <Form.Item
            name="shopId"
            label="所属店铺"
            rules={[
              { required: true, message: '请输入所属店铺' },
              { min: 1, max: 50, message: '店铺ID长度应在1-50个字符之间' }
            ]}
          >
            <Input placeholder="请输入所属店铺" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 批量编辑模态框 */}
      <Modal
        title="批量编辑商品"
        open={isBatchEditModalOpen}
        onCancel={handleBatchEditCancel}
        onOk={handleBatchEditOk}
        width={600}
      >
        <Form
          form={batchForm}
          layout="vertical"
        >
          <Form.Item
            name="category"
            label="分类"
          >
            <Input placeholder="请输入分类（留空不修改）" />
          </Form.Item>
          <Form.Item
            name="brand"
            label="品牌"
          >
            <Input placeholder="请输入品牌（留空不修改）" />
          </Form.Item>
          <Form.Item
            name="price"
            label="价格"
          >
            <Input type="number" placeholder="请输入价格（留空不修改）" />
          </Form.Item>
          <Form.Item
            name="costPrice"
            label="成本价"
          >
            <Input type="number" placeholder="请输入成本价（留空不修改）" />
          </Form.Item>
          <Form.Item
            name="stock"
            label="库存"
          >
            <Input type="number" placeholder="请输入库存（留空不修改）" />
          </Form.Item>
          <Form.Item
            name="shopId"
            label="所属店铺"
          >
            <Input placeholder="请输入所属店铺（留空不修改）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

const InventoryPage: React.FC = () => {
  const [inventory, setInventory] = React.useState([
    { id: '1', productId: '1', productName: 'iPhone 15', currentStock: 50, minStock: 10, shopId: '1' },
    { id: '2', productId: '2', productName: 'MacBook Pro', currentStock: 20, minStock: 5, shopId: '1' },
    { id: '3', productId: '3', productName: 'iPad Pro', currentStock: 30, minStock: 8, shopId: '2' },
    { id: '4', productId: '4', productName: 'AirPods Pro', currentStock: 100, minStock: 20, shopId: '3' },
  ]);
  const [filteredInventory, setFilteredInventory] = React.useState(inventory);
  const [inventoryLogs, setInventoryLogs] = React.useState([
    { id: '1', productId: '1', productName: 'iPhone 15', quantity: 10, type: 'in', reason: '采购入库', shopId: '1', createdAt: '2026-04-15 10:00:00' },
    { id: '2', productId: '1', productName: 'iPhone 15', quantity: 5, type: 'out', reason: '销售出库', shopId: '1', createdAt: '2026-04-15 11:00:00' },
    { id: '3', productId: '2', productName: 'MacBook Pro', quantity: 3, type: 'in', reason: '采购入库', shopId: '1', createdAt: '2026-04-15 09:00:00' },
  ]);
  const [filteredLogs, setFilteredLogs] = React.useState(inventoryLogs);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isBatchEditModalOpen, setIsBatchEditModalOpen] = React.useState(false);
  const [selectedInventoryIds, setSelectedInventoryIds] = React.useState<string[]>([]);
  const [form] = Form.useForm();
  const [batchForm] = Form.useForm();
  const [searchValue, setSearchValue] = React.useState('');
  const [selectedShop, setSelectedShop] = React.useState('');
  const [selectedStockStatus, setSelectedStockStatus] = React.useState('');
  const [logSearchValue, setLogSearchValue] = React.useState('');
  const [selectedLogType, setSelectedLogType] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [logsLoading, setLogsLoading] = React.useState(true);

  // 从API获取库存数据
  React.useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true);
        const response = await inventoryApi.getAll();
        setInventory(response.data);
      } catch (error) {
        console.error('Error fetching inventory:', error);
        // 失败时使用模拟数据
        setInventory([
          { id: '1', productId: '1', productName: 'iPhone 15', currentStock: 50, minStock: 10, shopId: '1' },
          { id: '2', productId: '2', productName: 'MacBook Pro', currentStock: 20, minStock: 5, shopId: '1' },
          { id: '3', productId: '3', productName: 'iPad Pro', currentStock: 30, minStock: 8, shopId: '2' },
          { id: '4', productId: '4', productName: 'AirPods Pro', currentStock: 100, minStock: 20, shopId: '3' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    const fetchInventoryLogs = async () => {
      try {
        setLogsLoading(true);
        const response = await inventoryApi.getLogs();
        setInventoryLogs(response.data);
      } catch (error) {
        console.error('Error fetching inventory logs:', error);
        // 失败时使用模拟数据
        setInventoryLogs([
          { id: '1', productId: '1', productName: 'iPhone 15', quantity: 10, type: 'in', reason: '采购入库', shopId: '1', createdAt: '2026-04-15 10:00:00' },
          { id: '2', productId: '1', productName: 'iPhone 15', quantity: 5, type: 'out', reason: '销售出库', shopId: '1', createdAt: '2026-04-15 11:00:00' },
          { id: '3', productId: '2', productName: 'MacBook Pro', quantity: 3, type: 'in', reason: '采购入库', shopId: '1', createdAt: '2026-04-15 09:00:00' },
        ]);
      } finally {
        setLogsLoading(false);
      }
    };

    fetchInventory();
    fetchInventoryLogs();
  }, []);

  // 过滤库存数据
  React.useEffect(() => {
    // 使用setTimeout模拟异步数据处理，避免阻塞主线程
    const timer = setTimeout(() => {
      let result = [...inventory];
      
      // 按商品名称搜索
      if (searchValue) {
        result = result.filter(item => 
          item.productName.toLowerCase().includes(searchValue.toLowerCase())
        );
      }
      
      // 按店铺筛选
      if (selectedShop) {
        result = result.filter(item => item.shopId === selectedShop);
      }
      
      // 按库存状态筛选
      if (selectedStockStatus) {
        if (selectedStockStatus === 'low') {
          result = result.filter(item => item.currentStock <= item.minStock);
        } else if (selectedStockStatus === 'normal') {
          result = result.filter(item => item.currentStock > item.minStock);
        }
      }
      
      setFilteredInventory(result);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [inventory, searchValue, selectedShop, selectedStockStatus]);

  // 处理重置筛选
  const handleResetFilters = () => {
    setSearchValue('');
    setSelectedShop('');
    setSelectedStockStatus('');
    setLogSearchValue('');
    setSelectedLogType('');
  };

  // 过滤库存日志数据
  React.useEffect(() => {
    // 使用setTimeout模拟异步数据处理，避免阻塞主线程
    const timer = setTimeout(() => {
      let result = [...inventoryLogs];
      
      // 按商品名称搜索
      if (logSearchValue) {
        result = result.filter(log => 
          log.productName.toLowerCase().includes(logSearchValue.toLowerCase()) ||
          log.reason.toLowerCase().includes(logSearchValue.toLowerCase())
        );
      }
      
      // 按变动类型筛选
      if (selectedLogType) {
        result = result.filter(log => log.type === selectedLogType);
      }
      
      setFilteredLogs(result);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [inventoryLogs, logSearchValue, selectedLogType]);

  const showModal = () => {
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      // 调用API调整库存
      await inventoryApi.adjust(values);
      
      // 处理库存调整
      if (values.type === 'in') {
        setInventory(inventory.map(item => 
          item.productId === values.productId ? 
          { ...item, currentStock: item.currentStock + values.quantity } : item
        ));
      } else {
        setInventory(inventory.map(item => 
          item.productId === values.productId ? 
          { ...item, currentStock: Math.max(0, item.currentStock - values.quantity) } : item
        ));
      }
      
      // 添加库存变动记录
      const newLog = {
        id: String(inventoryLogs.length + 1),
        productId: values.productId,
        productName: inventory.find(item => item.productId === values.productId)?.productName || '',
        quantity: values.quantity,
        type: values.type,
        reason: values.reason,
        shopId: values.shopId,
        createdAt: new Date().toLocaleString('zh-CN'),
      };
      setInventoryLogs([...inventoryLogs, newLog]);
      message.success('库存调整成功');
      setIsModalOpen(false);
      form.resetFields();
    } catch (error) {
      console.error('Error adjusting inventory:', error);
      message.error('库存调整失败，请重试');
    }
  };

  // 获取所有店铺列表
  const shops = [...new Set(inventory.map(item => item.shopId))];

  // 导出Excel
  const exportToExcel = () => {
    const exportData = filteredInventory.map(item => ({
      '商品名称': item.productName,
      '当前库存': item.currentStock,
      '最低库存': item.minStock,
      '所属店铺': item.shopId,
      '状态': item.currentStock <= item.minStock ? '库存不足' : '库存正常'
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '库存数据');
    XLSX.writeFile(workbook, `库存数据_${new Date().toISOString().split('T')[0]}.xlsx`);
    message.success('导出成功');
  };

  // 导出PDF
  const exportToPDF = () => {
    // 模拟PDF导出功能
    // 实际项目中可以使用jsPDF、html2pdf等库实现
    message.info('PDF导出功能开发中，敬请期待');
    // 这里可以添加实际的PDF导出代码
    // 例如使用jsPDF库生成PDF文件
    /*
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text('库存数据', 10, 10);
    let y = 20;
    filteredInventory.forEach((item, index) => {
      doc.text(`${index + 1}. ${item.productName} - 当前库存: ${item.currentStock} - 最低库存: ${item.minStock} - 店铺: ${item.shopId} - 状态: ${item.currentStock <= item.minStock ? '库存不足' : '库存正常'}`, 10, y);
      y += 10;
    });
    doc.save(`库存数据_${new Date().toISOString().split('T')[0]}.pdf`);
    */
  };

  // 导出库存日志
  const exportLogsToExcel = () => {
    const exportData = filteredLogs.map(log => ({
      '商品名称': log.productName,
      '变动数量': log.type === 'in' ? `+${log.quantity}` : `-${log.quantity}`,
      '变动类型': log.type === 'in' ? '入库' : '出库',
      '变动原因': log.reason,
      '所属店铺': log.shopId,
      '变动时间': log.createdAt
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '库存变动记录');
    XLSX.writeFile(workbook, `库存变动记录_${new Date().toISOString().split('T')[0]}.xlsx`);
    message.success('导出成功');
  };

  // 导出库存日志PDF
  const exportLogsToPDF = () => {
    // 模拟PDF导出功能
    // 实际项目中可以使用jsPDF、html2pdf等库实现
    message.info('PDF导出功能开发中，敬请期待');
    // 这里可以添加实际的PDF导出代码
    // 例如使用jsPDF库生成PDF文件
    /*
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text('库存变动记录', 10, 10);
    let y = 20;
    filteredLogs.forEach((log, index) => {
      doc.text(`${index + 1}. ${log.productName} - ${log.type === 'in' ? '+' : '-'}${log.quantity} - ${log.type === 'in' ? '入库' : '出库'} - ${log.reason} - ${log.shopId} - ${log.createdAt}`, 10, y);
      y += 10;
    });
    doc.save(`库存变动记录_${new Date().toISOString().split('T')[0]}.pdf`);
    */
  };

  // 处理选择变化
  const handleSelectChange = (selectedRowKeys: string[]) => {
    setSelectedInventoryIds(selectedRowKeys);
  };

  // 批量删除
  const handleBatchDelete = () => {
    if (selectedInventoryIds.length === 0) {
      message.warning('请选择要删除的库存');
      return;
    }
    setInventory(inventory.filter(item => !selectedInventoryIds.includes(item.id)));
    setSelectedInventoryIds([]);
    message.success(`成功删除 ${selectedInventoryIds.length} 个库存记录`);
  };

  // 打开批量编辑模态框
  const handleBatchEdit = () => {
    if (selectedInventoryIds.length === 0) {
      message.warning('请选择要编辑的库存');
      return;
    }
    batchForm.resetFields();
    setIsBatchEditModalOpen(true);
  };

  // 批量编辑确定
  const handleBatchEditOk = () => {
    batchForm.validateFields().then(values => {
      setInventory(inventory.map(item => {
        if (selectedInventoryIds.includes(item.id)) {
          return { ...item, ...values };
        }
        return item;
      }));
      setIsBatchEditModalOpen(false);
      setSelectedInventoryIds([]);
      message.success(`成功编辑 ${selectedInventoryIds.length} 个库存记录`);
    });
  };

  // 批量编辑取消
  const handleBatchEditCancel = () => {
    setIsBatchEditModalOpen(false);
    batchForm.resetFields();
  };

  const inventoryColumns = [
    {
      title: () => <Checkbox indeterminate={selectedInventoryIds.length > 0 && selectedInventoryIds.length < filteredInventory.length} checked={filteredInventory.length > 0 && selectedInventoryIds.length === filteredInventory.length} onChange={(e) => {
        if (e.target.checked) {
          setSelectedInventoryIds(filteredInventory.map(item => item.id));
        } else {
          setSelectedInventoryIds([]);
        }
      }} />,
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => (
        <Checkbox checked={selectedInventoryIds.includes(id)} onChange={(e) => {
          if (e.target.checked) {
            setSelectedInventoryIds([...selectedInventoryIds, id]);
          } else {
            setSelectedInventoryIds(selectedInventoryIds.filter(inventoryId => inventoryId !== id));
          }
        }} />
      ),
      width: 60,
    },
    { title: '商品名称', dataIndex: 'productName', key: 'productName' },
    { title: '当前库存', dataIndex: 'currentStock', key: 'currentStock' },
    { title: '最低库存', dataIndex: 'minStock', key: 'minStock' },
    { title: '所属店铺', dataIndex: 'shopId', key: 'shopId' },
    { 
      title: '状态', 
      key: 'status', 
      render: (_: any, record: any) => (
        <Tag color={record.currentStock <= record.minStock ? 'red' : 'green'}>
          {record.currentStock <= record.minStock ? '库存不足' : '库存正常'}
        </Tag>
      ) 
    },
  ];

  const logColumns = [
    { title: '商品名称', dataIndex: 'productName', key: 'productName' },
    { 
      title: '变动数量', 
      key: 'quantity', 
      render: (_: any, record: any) => (
        <span className={record.type === 'in' ? 'text-green-500' : 'text-red-500'}>
          {record.type === 'in' ? '+' : '-'}{record.quantity}
        </span>
      ) 
    },
    { 
      title: '变动类型', 
      key: 'type', 
      render: (_: any, record: any) => (
        <Tag color={record.type === 'in' ? 'green' : 'red'}>
          {record.type === 'in' ? '入库' : '出库'}
        </Tag>
      ) 
    },
    { title: '变动原因', dataIndex: 'reason', key: 'reason' },
    { title: '所属店铺', dataIndex: 'shopId', key: 'shopId' },
    { title: '变动时间', dataIndex: 'createdAt', key: 'createdAt' },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">库存管理</h1>
        <Space>
          {selectedInventoryIds.length > 0 && (
            <Space>
              <Button danger icon={<DeleteOutlined />} onClick={handleBatchDelete}>批量删除</Button>
              <Button type="primary" icon={<EditOutlined />} onClick={handleBatchEdit}>批量编辑</Button>
            </Space>
          )}
          <Dropdown menu={{ items: [
            { key: 'inventory-excel', label: '导出库存数据(Excel)', onClick: exportToExcel },
            { key: 'inventory-pdf', label: '导出库存数据(PDF)', onClick: exportToPDF },
            { key: 'logs-excel', label: '导出变动记录(Excel)', onClick: exportLogsToExcel },
            { key: 'logs-pdf', label: '导出变动记录(PDF)', onClick: exportLogsToPDF }
          ] }}>
            <Button icon={<DownloadOutlined />}>导出</Button>
          </Dropdown>
          <Button type="primary" icon={<PlusOutlined />} onClick={showModal}>调整库存</Button>
        </Space>
      </div>

      {/* 库存预警 */}
      <Card className="mb-6" hoverable>
        <h2 className="text-xl font-bold mb-4">库存预警</h2>
        {inventory.filter(item => item.currentStock <= item.minStock).length > 0 ? (
          <ul>
            {inventory.filter(item => item.currentStock <= item.minStock).map(item => (
              <li key={item.id} className="text-red-500 mb-2">
                {item.productName} 库存不足，当前库存: {item.currentStock}，最低库存: {item.minStock}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-green-500">所有商品库存正常</p>
        )}
      </Card>

      {/* 库存列表 */}
      <Card className="mb-6" hoverable>
        <h2 className="text-xl font-bold mb-4">库存列表</h2>
        
        {/* 搜索和筛选 */}
        <Row gutter={[16, 16]} className="mb-4" align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input.Search
              placeholder="搜索商品名称"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              allowClear
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={6} md={4}>
            <Select
              placeholder="按店铺筛选"
              value={selectedShop || undefined}
              onChange={setSelectedShop}
              allowClear
              style={{ width: '100%' }}
            >
              {shops.map(shop => (
                <Select.Option key={shop} value={shop}>店铺 {shop}</Select.Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={6} md={4}>
            <Select
              placeholder="按库存状态筛选"
              value={selectedStockStatus || undefined}
              onChange={setSelectedStockStatus}
              allowClear
              style={{ width: '100%' }}
            >
              <Select.Option value="low">库存不足</Select.Option>
              <Select.Option value="normal">库存正常</Select.Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4} offset={4}>
            <Button type="default" onClick={handleResetFilters}>重置筛选</Button>
          </Col>
        </Row>
        
        <Table 
          columns={inventoryColumns} 
          dataSource={filteredInventory} 
          rowKey="id" 
          pagination={{ pageSize: 10 }}
          loading={loading}
        />
      </Card>

      {/* 库存变动记录 */}
      <Card hoverable>
        <h2 className="text-xl font-bold mb-4">库存变动记录</h2>
        
        {/* 搜索和筛选 */}
        <Row gutter={[16, 16]} className="mb-4" align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input.Search
              placeholder="搜索商品名称或变动原因"
              value={logSearchValue}
              onChange={(e) => setLogSearchValue(e.target.value)}
              allowClear
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={6} md={4}>
            <Select
              placeholder="按变动类型筛选"
              value={selectedLogType || undefined}
              onChange={setSelectedLogType}
              allowClear
              style={{ width: '100%' }}
            >
              <Select.Option value="in">入库</Select.Option>
              <Select.Option value="out">出库</Select.Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4} offset={8}>
            <Button type="default" onClick={handleResetFilters}>重置筛选</Button>
          </Col>
        </Row>
        
        <Table 
          columns={logColumns} 
          dataSource={filteredLogs} 
          rowKey="id" 
          pagination={{ pageSize: 10 }}
          loading={logsLoading}
        />
      </Card>

      {/* 调整库存模态框 */}
      <Modal
        title="调整库存"
        open={isModalOpen}
        onCancel={handleCancel}
        onOk={handleOk}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="productId"
            label="商品"
            rules={[{ required: true, message: '请选择商品' }]}
          >
            <Select placeholder="请选择商品">
              {inventory.map(item => (
                <Select.Option key={item.productId} value={item.productId}>{item.productName}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="type"
            label="变动类型"
            rules={[{ required: true, message: '请选择变动类型' }]}
          >
            <Select placeholder="请选择变动类型">
              <Select.Option value="in">入库</Select.Option>
              <Select.Option value="out">出库</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="quantity"
            label="变动数量"
            rules={[
              { required: true, message: '请输入变动数量' },
              { type: 'number', min: 1, message: '变动数量必须大于0' }
            ]}
          >
            <Input type="number" placeholder="请输入变动数量" min="1" />
          </Form.Item>
          <Form.Item
            name="reason"
            label="变动原因"
            rules={[
              { required: true, message: '请输入变动原因' },
              { min: 2, max: 200, message: '变动原因长度应在2-200个字符之间' }
            ]}
          >
            <Input placeholder="请输入变动原因" />
          </Form.Item>
          <Form.Item
            name="shopId"
            label="所属店铺"
            rules={[
              { required: true, message: '请输入所属店铺' },
              { min: 1, max: 50, message: '店铺ID长度应在1-50个字符之间' }
            ]}
          >
            <Input placeholder="请输入所属店铺" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 批量编辑模态框 */}
      <Modal
        title="批量编辑库存"
        open={isBatchEditModalOpen}
        onCancel={handleBatchEditCancel}
        onOk={handleBatchEditOk}
        width={500}
      >
        <Form
          form={batchForm}
          layout="vertical"
        >
          <Form.Item
            name="minStock"
            label="最低库存"
          >
            <Input type="number" placeholder="请输入最低库存（留空不修改）" />
          </Form.Item>
          <Form.Item
            name="shopId"
            label="所属店铺"
          >
            <Input placeholder="请输入所属店铺（留空不修改）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

const SalesPage: React.FC = () => {
  const [orders, setOrders] = React.useState([
    { id: '1', shopId: '1', totalAmount: 5999, status: 'completed', createdAt: '2026-04-15 10:00:00', items: [
      { productId: '1', productName: 'iPhone 15', quantity: 1, price: 5999 }
    ]},
    { id: '2', shopId: '1', totalAmount: 12999, status: 'completed', createdAt: '2026-04-15 11:00:00', items: [
      { productId: '2', productName: 'MacBook Pro', quantity: 1, price: 12999 }
    ]},
    { id: '3', shopId: '2', totalAmount: 8999, status: 'pending', createdAt: '2026-04-15 12:00:00', items: [
      { productId: '3', productName: 'iPad Pro', quantity: 1, price: 8999 }
    ]},
  ]);
  const [filteredOrders, setFilteredOrders] = React.useState(orders);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isBatchEditModalOpen, setIsBatchEditModalOpen] = React.useState(false);
  const [selectedOrder, setSelectedOrder] = React.useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = React.useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = React.useState<string[]>([]);
  const [form] = Form.useForm();
  const [batchForm] = Form.useForm();
  const [searchValue, setSearchValue] = React.useState('');
  const [selectedShop, setSelectedShop] = React.useState('');
  const [selectedStatus, setSelectedStatus] = React.useState('');
  const [loading, setLoading] = React.useState(true);

  // 从API获取订单数据
  React.useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await salesApi.getAll({});
        setOrders(response.data);
      } catch (error) {
        console.error('Error fetching orders:', error);
        // 失败时使用模拟数据
        setOrders([
          { id: '1', shopId: '1', totalAmount: 5999, status: 'completed', createdAt: '2026-04-15 10:00:00', items: [
            { productId: '1', productName: 'iPhone 15', quantity: 1, price: 5999 }
          ]},
          { id: '2', shopId: '1', totalAmount: 12999, status: 'completed', createdAt: '2026-04-15 11:00:00', items: [
            { productId: '2', productName: 'MacBook Pro', quantity: 1, price: 12999 }
          ]},
          { id: '3', shopId: '2', totalAmount: 8999, status: 'pending', createdAt: '2026-04-15 12:00:00', items: [
            { productId: '3', productName: 'iPad Pro', quantity: 1, price: 8999 }
          ]},
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // 过滤订单数据
  React.useEffect(() => {
    // 使用setTimeout模拟异步数据处理，避免阻塞主线程
    const timer = setTimeout(() => {
      let result = [...orders];
      
      // 按订单号或商品名称搜索
      if (searchValue) {
        result = result.filter(order => 
          order.id.includes(searchValue) ||
          order.items.some(item => item.productName.toLowerCase().includes(searchValue.toLowerCase()))
        );
      }
      
      // 按店铺筛选
      if (selectedShop) {
        result = result.filter(order => order.shopId === selectedShop);
      }
      
      // 按状态筛选
      if (selectedStatus) {
        result = result.filter(order => order.status === selectedStatus);
      }
      
      setFilteredOrders(result);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [orders, searchValue, selectedShop, selectedStatus]);

  // 处理重置筛选
  const handleResetFilters = () => {
    setSearchValue('');
    setSelectedShop('');
    setSelectedStatus('');
  };

  const showModal = () => {
    form.setFieldsValue({ shopId: '', items: [{ productId: '', productName: '', quantity: 1, price: 0 }] });
    setIsModalOpen(true);
  };

  const showDetail = (order: any) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setIsDetailOpen(false);
    form.resetFields();
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      // 计算总金额
      const totalAmount = values.items.reduce((sum: number, item: any) => sum + item.quantity * item.price, 0);
      
      // 调用API创建订单
      const newOrder = await salesApi.create({
        shopId: values.shopId,
        items: values.items,
        status: 'pending'
      });
      
      setOrders([...orders, newOrder]);
      message.success('订单添加成功');
      setIsModalOpen(false);
      form.resetFields();
    } catch (error) {
      console.error('Error creating order:', error);
      message.error('订单添加失败，请重试');
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      // 调用API更新订单状态
      await salesApi.updateStatus(id, status);
      setOrders(orders.map(order => order.id === id ? { ...order, status } : order));
      message.success('订单状态更新成功');
    } catch (error) {
      console.error('Error updating order status:', error);
      message.error('订单状态更新失败，请重试');
    }
  };

  // 处理选择变化
  const handleSelectChange = (selectedRowKeys: string[]) => {
    setSelectedOrderIds(selectedRowKeys);
  };

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedOrderIds.length === 0) {
      message.warning('请选择要删除的订单');
      return;
    }
    try {
      // 逐个删除订单
      for (const id of selectedOrderIds) {
        await salesApi.delete(id);
      }
      setOrders(orders.filter(order => !selectedOrderIds.includes(order.id)));
      setSelectedOrderIds([]);
      message.success(`成功删除 ${selectedOrderIds.length} 个订单`);
    } catch (error) {
      console.error('Error deleting orders:', error);
      message.error('批量删除失败，请重试');
    }
  };

  // 打开批量编辑模态框
  const handleBatchEdit = () => {
    if (selectedOrderIds.length === 0) {
      message.warning('请选择要编辑的订单');
      return;
    }
    batchForm.resetFields();
    setIsBatchEditModalOpen(true);
  };

  // 批量编辑确定
  const handleBatchEditOk = () => {
    batchForm.validateFields().then(values => {
      setOrders(orders.map(order => {
        if (selectedOrderIds.includes(order.id)) {
          return { ...order, ...values };
        }
        return order;
      }));
      setIsBatchEditModalOpen(false);
      setSelectedOrderIds([]);
      message.success(`成功编辑 ${selectedOrderIds.length} 个订单`);
    });
  };

  // 批量编辑取消
  const handleBatchEditCancel = () => {
    setIsBatchEditModalOpen(false);
    batchForm.resetFields();
  };

  // 获取所有店铺列表
  const shops = [...new Set(orders.map(order => order.shopId))];

  // 导出Excel
  const exportToExcel = () => {
    const exportData = filteredOrders.map(order => ({
      '订单号': order.id,
      '店铺': order.shopId,
      '总金额': order.totalAmount,
      '状态': order.status === 'completed' ? '已完成' : order.status === 'pending' ? '待处理' : '已取消',
      '创建时间': order.createdAt,
      '商品数量': order.items.length,
      '商品清单': order.items.map(item => `${item.productName} x ${item.quantity}`).join('; ')
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '销售订单');
    XLSX.writeFile(workbook, `销售订单_${new Date().toISOString().split('T')[0]}.xlsx`);
    message.success('导出成功');
  };

  // 导出PDF
  const exportToPDF = () => {
    // 模拟PDF导出功能
    // 实际项目中可以使用jsPDF、html2pdf等库实现
    message.info('PDF导出功能开发中，敬请期待');
    // 这里可以添加实际的PDF导出代码
    // 例如使用jsPDF库生成PDF文件
    /*
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text('销售订单数据', 10, 10);
    let y = 20;
    filteredOrders.forEach((order, index) => {
      doc.text(`${index + 1}. 订单号: ${order.id} - 店铺: ${order.shopId} - 金额: ¥${order.totalAmount} - 状态: ${order.status === 'completed' ? '已完成' : order.status === 'pending' ? '待处理' : '已取消'}`, 10, y);
      y += 10;
      order.items.forEach((item: any) => {
        doc.text(`  - ${item.productName} x ${item.quantity} - ¥${item.price}`, 20, y);
        y += 8;
      });
      y += 5;
    });
    doc.save(`销售订单_${new Date().toISOString().split('T')[0]}.pdf`);
    */
  };

  const columns = [
    {
      title: () => <Checkbox indeterminate={selectedOrderIds.length > 0 && selectedOrderIds.length < filteredOrders.length} checked={filteredOrders.length > 0 && selectedOrderIds.length === filteredOrders.length} onChange={(e) => {
        if (e.target.checked) {
          setSelectedOrderIds(filteredOrders.map(order => order.id));
        } else {
          setSelectedOrderIds([]);
        }
      }} />,
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => (
        <Checkbox checked={selectedOrderIds.includes(id)} onChange={(e) => {
          if (e.target.checked) {
            setSelectedOrderIds([...selectedOrderIds, id]);
          } else {
            setSelectedOrderIds(selectedOrderIds.filter(orderId => orderId !== id));
          }
        }} />
      ),
      width: 60,
    },
    { title: '订单号', dataIndex: 'id', key: 'id' },
    { title: '店铺', dataIndex: 'shopId', key: 'shopId' },
    { title: '总金额', dataIndex: 'totalAmount', key: 'totalAmount', render: (amount: number) => `¥${amount}` },
    { 
      title: '状态', 
      key: 'status', 
      render: (_: any, record: any) => (
        <Tag color={
          record.status === 'completed' ? 'green' :
          record.status === 'pending' ? 'yellow' :
          'red'
        }>
          {record.status === 'completed' ? '已完成' :
           record.status === 'pending' ? '待处理' :
           '已取消'}
        </Tag>
      ) 
    },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt' },
    { 
      title: '操作', 
      key: 'action', 
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button type="primary" icon={<EyeOutlined />} onClick={() => showDetail(record)}>详情</Button>
          {record.status === 'pending' && (
            <>
              <Button type="success" onClick={() => updateStatus(record.id, 'completed')}>完成</Button>
              <Button danger onClick={() => updateStatus(record.id, 'cancelled')}>取消</Button>
            </>
          )}
        </Space>
      ) 
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">销售管理</h1>
        <Space>
          {selectedOrderIds.length > 0 && (
            <Space>
              <Button danger icon={<DeleteOutlined />} onClick={handleBatchDelete}>批量删除</Button>
              <Button type="primary" icon={<EditOutlined />} onClick={handleBatchEdit}>批量编辑</Button>
            </Space>
          )}
          <Dropdown 
            menu={{ 
              items: [
                { key: 'excel', label: '导出Excel', onClick: exportToExcel },
                { key: 'pdf', label: '导出PDF', onClick: exportToPDF },
              ] 
            }} 
          >
            <Button icon={<DownloadOutlined />}>导出</Button>
          </Dropdown>
          <Button type="primary" icon={<PlusOutlined />} onClick={showModal}>添加订单</Button>
        </Space>
      </div>

      {/* 搜索和筛选 */}
      <Card className="mb-4" hoverable>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input.Search
              placeholder="搜索订单号或商品名称"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              allowClear
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={6} md={4}>
            <Select
              placeholder="按店铺筛选"
              value={selectedShop || undefined}
              onChange={setSelectedShop}
              allowClear
              style={{ width: '100%' }}
            >
              {shops.map(shop => (
                <Select.Option key={shop} value={shop}>店铺 {shop}</Select.Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={6} md={4}>
            <Select
              placeholder="按状态筛选"
              value={selectedStatus || undefined}
              onChange={setSelectedStatus}
              allowClear
              style={{ width: '100%' }}
            >
              <Select.Option value="pending">待处理</Select.Option>
              <Select.Option value="completed">已完成</Select.Option>
              <Select.Option value="cancelled">已取消</Select.Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4} offset={4}>
            <Button type="default" onClick={handleResetFilters}>重置筛选</Button>
          </Col>
        </Row>
      </Card>

      {/* 销售订单列表 */}
      <Table 
        columns={columns} 
        dataSource={filteredOrders} 
        rowKey="id" 
        pagination={{ pageSize: 10 }}
        loading={loading}
        style={{ marginBottom: 20 }}
      />

      {/* 添加订单模态框 */}
      <Modal
        title="添加订单"
        open={isModalOpen}
        onCancel={handleCancel}
        onOk={handleOk}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="shopId"
            label="店铺"
            rules={[
              { required: true, message: '请输入店铺' },
              { min: 1, max: 50, message: '店铺ID长度应在1-50个字符之间' }
            ]}
          >
            <Input placeholder="请输入店铺" />
          </Form.Item>
          
          <Form.Item
            name="items"
            label="商品列表"
            rules={[{ required: true, message: '请添加至少一个商品' }]}
          >
            <Form.List name="items">
              {(fields, { add, remove }) => (
                <div>
                  {fields.map((field, index) => (
                    <Card key={field.key} className="mb-3">
                      <Form.Item
                        {...field}
                        name={[field.name, 'productName']}
                        label="商品名称"
                        rules={[
                          { required: true, message: '请输入商品名称' },
                          { min: 2, max: 100, message: '商品名称长度应在2-100个字符之间' }
                        ]}
                      >
                        <Input placeholder="请输入商品名称" />
                      </Form.Item>
                      <Form.Item
                        {...field}
                        name={[field.name, 'productId']}
                        label="商品ID"
                        rules={[
                          { required: true, message: '请输入商品ID' },
                          { min: 1, max: 50, message: '商品ID长度应在1-50个字符之间' }
                        ]}
                      >
                        <Input placeholder="请输入商品ID" />
                      </Form.Item>
                      <div className="grid grid-cols-2 gap-4">
                        <Form.Item
                          {...field}
                          name={[field.name, 'quantity']}
                          label="数量"
                          rules={[
                            { required: true, message: '请输入数量' },
                            { type: 'number', min: 1, message: '数量必须大于0' }
                          ]}
                        >
                          <Input type="number" placeholder="请输入数量" min="1" />
                        </Form.Item>
                        <Form.Item
                          {...field}
                          name={[field.name, 'price']}
                          label="单价"
                          rules={[
                            { required: true, message: '请输入单价' },
                            { type: 'number', min: 0.01, message: '单价必须大于0' }
                          ]}
                        >
                          <Input type="number" placeholder="请输入单价" min="0.01" step="0.01" />
                        </Form.Item>
                      </div>
                      <Button danger onClick={() => remove(field.name)}>删除商品</Button>
                    </Card>
                  ))}
                  <Button type="dashed" onClick={() => add({ productId: '', productName: '', quantity: 1, price: 0 })}>
                    添加商品
                  </Button>
                </div>
              )}
            </Form.List>
          </Form.Item>
        </Form>
      </Modal>

      {/* 订单详情模态框 */}
      <Modal
        title="订单详情"
        open={isDetailOpen}
        onCancel={handleCancel}
        footer={[
          <Button key="close" onClick={handleCancel}>关闭</Button>
        ]}
        width={600}
      >
        {selectedOrder && (
          <div>
            <div className="mb-4">
              <p><strong>订单号:</strong> {selectedOrder.id}</p>
              <p><strong>店铺:</strong> {selectedOrder.shopId}</p>
              <p><strong>总金额:</strong> ¥{selectedOrder.totalAmount}</p>
              <p><strong>状态:</strong> {selectedOrder.status === 'completed' ? '已完成' : selectedOrder.status === 'pending' ? '待处理' : '已取消'}</p>
              <p><strong>创建时间:</strong> {selectedOrder.createdAt}</p>
            </div>
            <div>
              <h3 className="font-bold mb-2">商品列表</h3>
              <Table 
                columns={[
                  { title: '商品名称', dataIndex: 'productName', key: 'productName' },
                  { title: '数量', dataIndex: 'quantity', key: 'quantity' },
                  { title: '单价', dataIndex: 'price', key: 'price', render: (price: number) => `¥${price}` },
                  { title: '小计', key: 'subtotal', render: (_: any, record: any) => `¥${record.quantity * record.price}` }
                ]} 
                dataSource={selectedOrder.items} 
                rowKey={(record, index) => index}
                pagination={false}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* 批量编辑模态框 */}
      <Modal
        title="批量编辑订单"
        open={isBatchEditModalOpen}
        onCancel={handleBatchEditCancel}
        onOk={handleBatchEditOk}
        width={500}
      >
        <Form
          form={batchForm}
          layout="vertical"
        >
          <Form.Item
            name="shopId"
            label="店铺"
          >
            <Input placeholder="请输入店铺（留空不修改）" />
          </Form.Item>
          <Form.Item
            name="status"
            label="状态"
          >
            <Select placeholder="请选择状态（留空不修改）">
              <Select.Option value="pending">待处理</Select.Option>
              <Select.Option value="completed">已完成</Select.Option>
              <Select.Option value="cancelled">已取消</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

const FinancialPage: React.FC = () => {
  const [financialRecords, setFinancialRecords] = React.useState([
    { id: '1', shopId: '1', amount: 5999, type: 'income', category: '销售', description: 'iPhone 15 销售', createdAt: '2026-04-15 10:00:00' },
    { id: '2', shopId: '1', amount: 12999, type: 'income', category: '销售', description: 'MacBook Pro 销售', createdAt: '2026-04-15 11:00:00' },
    { id: '3', shopId: '1', amount: 1000, type: 'expense', category: '采购', description: '办公用品采购', createdAt: '2026-04-15 09:00:00' },
    { id: '4', shopId: '2', amount: 8999, type: 'income', category: '销售', description: 'iPad Pro 销售', createdAt: '2026-04-15 12:00:00' },
    { id: '5', shopId: '3', amount: 500, type: 'expense', category: '租金', description: '店铺租金', createdAt: '2026-04-15 08:00:00' },
  ]);
  const [filteredRecords, setFilteredRecords] = React.useState(financialRecords);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isBatchEditModalOpen, setIsBatchEditModalOpen] = React.useState(false);
  const [selectedRecordIds, setSelectedRecordIds] = React.useState<string[]>([]);
  const [form] = Form.useForm();
  const [batchForm] = Form.useForm();
  const [searchValue, setSearchValue] = React.useState('');
  const [selectedShop, setSelectedShop] = React.useState('');
  const [selectedType, setSelectedType] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('');
  const [loading, setLoading] = React.useState(true);

  // 从API获取财务记录数据
  React.useEffect(() => {
    const fetchFinancialRecords = async () => {
      try {
        setLoading(true);
        const response = await financialApi.getAll({});
        setFinancialRecords(response.data);
      } catch (error) {
        console.error('Error fetching financial records:', error);
        // 失败时使用模拟数据
        setFinancialRecords([
          { id: '1', shopId: '1', amount: 5999, type: 'income', category: '销售', description: 'iPhone 15 销售', createdAt: '2026-04-15 10:00:00' },
          { id: '2', shopId: '1', amount: 12999, type: 'income', category: '销售', description: 'MacBook Pro 销售', createdAt: '2026-04-15 11:00:00' },
          { id: '3', shopId: '1', amount: 1000, type: 'expense', category: '采购', description: '办公用品采购', createdAt: '2026-04-15 09:00:00' },
          { id: '4', shopId: '2', amount: 8999, type: 'income', category: '销售', description: 'iPad Pro 销售', createdAt: '2026-04-15 12:00:00' },
          { id: '5', shopId: '3', amount: 500, type: 'expense', category: '租金', description: '店铺租金', createdAt: '2026-04-15 08:00:00' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchFinancialRecords();
  }, []);

  // 计算收支统计
  const incomeTotal = financialRecords.filter(record => record.type === 'income').reduce((sum, record) => sum + record.amount, 0);
  const expenseTotal = financialRecords.filter(record => record.type === 'expense').reduce((sum, record) => sum + record.amount, 0);
  const netProfit = incomeTotal - expenseTotal;

  // 过滤财务记录数据
  React.useEffect(() => {
    // 使用setTimeout模拟异步数据处理，避免阻塞主线程
    const timer = setTimeout(() => {
      let result = [...financialRecords];
      
      // 按描述搜索
      if (searchValue) {
        result = result.filter(record => 
          record.description.toLowerCase().includes(searchValue.toLowerCase())
        );
      }
      
      // 按店铺筛选
      if (selectedShop) {
        result = result.filter(record => record.shopId === selectedShop);
      }
      
      // 按类型筛选
      if (selectedType) {
        result = result.filter(record => record.type === selectedType);
      }
      
      // 按分类筛选
      if (selectedCategory) {
        result = result.filter(record => record.category === selectedCategory);
      }
      
      setFilteredRecords(result);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [financialRecords, searchValue, selectedShop, selectedType, selectedCategory]);

  const showModal = () => {
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      // 调用API创建财务记录
      const newRecord = await financialApi.create(values);
      setFinancialRecords([...financialRecords, newRecord]);
      message.success('财务记录添加成功');
      setIsModalOpen(false);
      form.resetFields();
    } catch (error) {
      console.error('Error creating financial record:', error);
      message.error('财务记录添加失败，请重试');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      // 调用API删除财务记录
      await financialApi.delete(id);
      setFinancialRecords(financialRecords.filter(record => record.id !== id));
      message.success('财务记录删除成功');
    } catch (error) {
      console.error('Error deleting financial record:', error);
      message.error('财务记录删除失败，请重试');
    }
  };

  // 处理选择变化
  const handleSelectChange = (selectedRowKeys: string[]) => {
    setSelectedRecordIds(selectedRowKeys);
  };

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedRecordIds.length === 0) {
      message.warning('请选择要删除的财务记录');
      return;
    }
    try {
      // 逐个删除财务记录
      for (const id of selectedRecordIds) {
        await financialApi.delete(id);
      }
      setFinancialRecords(financialRecords.filter(record => !selectedRecordIds.includes(record.id)));
      setSelectedRecordIds([]);
      message.success(`成功删除 ${selectedRecordIds.length} 个财务记录`);
    } catch (error) {
      console.error('Error deleting financial records:', error);
      message.error('批量删除失败，请重试');
    }
  };

  // 打开批量编辑模态框
  const handleBatchEdit = () => {
    if (selectedRecordIds.length === 0) {
      message.warning('请选择要编辑的财务记录');
      return;
    }
    batchForm.resetFields();
    setIsBatchEditModalOpen(true);
  };

  // 批量编辑确定
  const handleBatchEditOk = () => {
    batchForm.validateFields().then(values => {
      setFinancialRecords(financialRecords.map(record => {
        if (selectedRecordIds.includes(record.id)) {
          return { ...record, ...values };
        }
        return record;
      }));
      setIsBatchEditModalOpen(false);
      setSelectedRecordIds([]);
      message.success(`成功编辑 ${selectedRecordIds.length} 个财务记录`);
    });
  };

  // 批量编辑取消
  const handleBatchEditCancel = () => {
    setIsBatchEditModalOpen(false);
    batchForm.resetFields();
  };

  // 获取所有店铺和分类列表
  const shops = [...new Set(financialRecords.map(record => record.shopId))];
  const categories = [...new Set(financialRecords.map(record => record.category))];

  // 导出Excel
  const exportToExcel = () => {
    const exportData = filteredRecords.map(record => ({
      '记录ID': record.id,
      '店铺': record.shopId,
      '金额': record.amount,
      '类型': record.type === 'income' ? '收入' : '支出',
      '分类': record.category,
      '描述': record.description,
      '创建时间': record.createdAt
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '财务记录');
    XLSX.writeFile(workbook, `财务记录_${new Date().toISOString().split('T')[0]}.xlsx`);
    message.success('导出成功');
  };

  const columns = [
    {
      title: () => <Checkbox indeterminate={selectedRecordIds.length > 0 && selectedRecordIds.length < filteredRecords.length} checked={filteredRecords.length > 0 && selectedRecordIds.length === filteredRecords.length} onChange={(e) => {
        if (e.target.checked) {
          setSelectedRecordIds(filteredRecords.map(record => record.id));
        } else {
          setSelectedRecordIds([]);
        }
      }} />,
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => (
        <Checkbox checked={selectedRecordIds.includes(id)} onChange={(e) => {
          if (e.target.checked) {
            setSelectedRecordIds([...selectedRecordIds, id]);
          } else {
            setSelectedRecordIds(selectedRecordIds.filter(recordId => recordId !== id));
          }
        }} />
      ),
      width: 60,
    },
    { title: '记录ID', dataIndex: 'id', key: 'id' },
    { title: '店铺', dataIndex: 'shopId', key: 'shopId' },
    { 
      title: '金额', 
      key: 'amount', 
      render: (_: any, record: any) => (
        <span className={record.type === 'income' ? 'text-green-500' : 'text-red-500'}>
          {record.type === 'income' ? '+' : '-'}{record.amount}
        </span>
      ) 
    },
    { 
      title: '类型', 
      key: 'type', 
      render: (_: any, record: any) => (
        <Tag color={record.type === 'income' ? 'green' : 'red'}>
          {record.type === 'income' ? '收入' : '支出'}
        </Tag>
      ) 
    },
    { title: '分类', dataIndex: 'category', key: 'category' },
    { title: '描述', dataIndex: 'description', key: 'description' },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt' },
    { 
      title: '操作', 
      key: 'action', 
      render: (_: any, record: any) => (
        <Button danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>删除</Button>
      ) 
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">财务管理</h1>
        <Space>
          {selectedRecordIds.length > 0 && (
            <Space>
              <Button danger icon={<DeleteOutlined />} onClick={handleBatchDelete}>批量删除</Button>
              <Button type="primary" icon={<EditOutlined />} onClick={handleBatchEdit}>批量编辑</Button>
            </Space>
          )}
          <Dropdown menu={{ items: [{ key: 'excel', label: '导出Excel', onClick: exportToExcel }] }}>
            <Button icon={<DownloadOutlined />}>导出</Button>
          </Dropdown>
          <Button type="primary" icon={<PlusOutlined />} onClick={showModal}>添加记录</Button>
        </Space>
      </div>

      {/* 收支统计 */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={8}>
          <Card hoverable>
            <Statistic
              title="总收入"
              value={incomeTotal}
              prefix="¥"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card hoverable>
            <Statistic
              title="总支出"
              value={expenseTotal}
              prefix="¥"
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card hoverable>
            <Statistic
              title="净利润"
              value={netProfit}
              prefix="¥"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 搜索和筛选 */}
      <Card className="mb-4" hoverable>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input.Search
              placeholder="搜索描述"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              allowClear
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={6} md={4}>
            <Select
              placeholder="按店铺筛选"
              value={selectedShop || undefined}
              onChange={setSelectedShop}
              allowClear
              style={{ width: '100%' }}
            >
              {shops.map(shop => (
                <Select.Option key={shop} value={shop}>店铺 {shop}</Select.Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={6} md={4}>
            <Select
              placeholder="按类型筛选"
              value={selectedType || undefined}
              onChange={setSelectedType}
              allowClear
              style={{ width: '100%' }}
            >
              <Select.Option value="income">收入</Select.Option>
              <Select.Option value="expense">支出</Select.Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4} offset={4}>
            <Select
              placeholder="按分类筛选"
              value={selectedCategory || undefined}
              onChange={setSelectedCategory}
              allowClear
              style={{ width: '100%' }}
            >
              {categories.map(category => (
                <Select.Option key={category} value={category}>{category}</Select.Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4} offset={20}>
            <Button type="default" onClick={() => {
              setSearchValue('');
              setSelectedShop('');
              setSelectedType('');
              setSelectedCategory('');
            }}>重置筛选</Button>
          </Col>
        </Row>
      </Card>

      {/* 财务记录列表 */}
      <Table 
        columns={columns} 
        dataSource={filteredRecords} 
        rowKey="id" 
        pagination={{ pageSize: 10 }}
        loading={loading}
        style={{ marginBottom: 20 }}
      />

      {/* 添加财务记录模态框 */}
      <Modal
        title="添加财务记录"
        open={isModalOpen}
        onCancel={handleCancel}
        onOk={handleOk}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="shopId"
            label="店铺"
            rules={[
              { required: true, message: '请输入店铺' },
              { min: 1, max: 50, message: '店铺ID长度应在1-50个字符之间' }
            ]}
          >
            <Input placeholder="请输入店铺" />
          </Form.Item>
          <Form.Item
            name="amount"
            label="金额"
            rules={[
              { required: true, message: '请输入金额' },
              { type: 'number', min: 0.01, message: '金额必须大于0' }
            ]}
          >
            <Input type="number" placeholder="请输入金额" min="0.01" step="0.01" />
          </Form.Item>
          <Form.Item
            name="type"
            label="类型"
            rules={[{ required: true, message: '请选择类型' }]}
          >
            <Select placeholder="请选择类型">
              <Select.Option value="income">收入</Select.Option>
              <Select.Option value="expense">支出</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="category"
            label="分类"
            rules={[
              { required: true, message: '请输入分类' },
              { min: 1, max: 50, message: '分类长度应在1-50个字符之间' }
            ]}
          >
            <Input placeholder="请输入分类" />
          </Form.Item>
          <Form.Item
            name="description"
            label="描述"
            rules={[
              { required: true, message: '请输入描述' },
              { min: 2, max: 200, message: '描述长度应在2-200个字符之间' }
            ]}
          >
            <Input placeholder="请输入描述" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 批量编辑模态框 */}
      <Modal
        title="批量编辑财务记录"
        open={isBatchEditModalOpen}
        onCancel={handleBatchEditCancel}
        onOk={handleBatchEditOk}
        width={500}
      >
        <Form
          form={batchForm}
          layout="vertical"
        >
          <Form.Item
            name="shopId"
            label="店铺"
          >
            <Input placeholder="请输入店铺（留空不修改）" />
          </Form.Item>
          <Form.Item
            name="type"
            label="类型"
          >
            <Select placeholder="请选择类型（留空不修改）">
              <Select.Option value="income">收入</Select.Option>
              <Select.Option value="expense">支出</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="category"
            label="分类"
          >
            <Input placeholder="请输入分类（留空不修改）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

const ReportPage: React.FC = () => {
  const [dateRange, setDateRange] = React.useState<[string, string]>([new Date(new Date().getFullYear() - 1, new Date().getMonth(), 1).toISOString().split('T')[0], new Date().toISOString().split('T')[0]]);
  const [loading, setLoading] = React.useState(false);
  
  // 销售趋势数据
  const [salesData, setSalesData] = React.useState([
    { month: '1月', sales: 10000 },
    { month: '2月', sales: 15000 },
    { month: '3月', sales: 12000 },
    { month: '4月', sales: 18000 },
    { month: '5月', sales: 20000 },
    { month: '6月', sales: 25000 },
  ]);

  // 库存状况数据
  const [inventoryData, setInventoryData] = React.useState([
    { name: 'iPhone 15', stock: 50, minStock: 10 },
    { name: 'MacBook Pro', stock: 20, minStock: 5 },
    { name: 'iPad Pro', stock: 30, minStock: 8 },
    { name: 'AirPods Pro', stock: 100, minStock: 20 },
  ]);

  // 财务分析数据
  const [financialData, setFinancialData] = React.useState([
    { category: '销售', income: 50000, expense: 0 },
    { category: '采购', income: 0, expense: 15000 },
    { category: '租金', income: 0, expense: 5000 },
    { category: '薪资', income: 0, expense: 10000 },
    { category: '其他', income: 5000, expense: 3000 },
  ]);

  // 店铺销售对比
  const [shopSalesData, setShopSalesData] = React.useState([
    { name: '北京旗舰店', sales: 30000 },
    { name: '上海分店', sales: 20000 },
    { name: '广州分店', sales: 15000 },
  ]);

  // 处理日期范围变化
  const handleDateRangeChange = async (dates: [string, string]) => {
    setDateRange(dates);
    setLoading(true);
    try {
      // 调用API获取对应日期范围的数据
      // 这里使用模拟数据，实际项目中应该调用API
      setTimeout(() => {
        // 模拟数据更新
        setSalesData([
          { month: '1月', sales: 12000 },
          { month: '2月', sales: 18000 },
          { month: '3月', sales: 15000 },
          { month: '4月', sales: 22000 },
          { month: '5月', sales: 25000 },
          { month: '6月', sales: 30000 },
        ]);
        setLoading(false);
        message.success('数据已更新');
      }, 1000);
    } catch (error) {
      console.error('Error fetching report data:', error);
      setLoading(false);
      message.error('获取数据失败');
    }
  };

  // 初始化图表
  React.useEffect(() => {
    // 动态加载 Chart.js
    const loadChartJS = async () => {
      try {
        // 检查是否已经加载了 Chart.js
        if (typeof window !== 'undefined' && !window.Chart) {
          // 动态导入 Chart.js
          const Chart = (await import('chart.js')).default;
          window.Chart = Chart;
        }

        const Chart = window.Chart;
        if (Chart) {
          // 清除旧图表
          const charts = window.charts || {};
          Object.values(charts).forEach(chart => chart.destroy());
          window.charts = {};

          // 销售趋势图表
          const salesCtx = document.getElementById('salesChart');
          if (salesCtx) {
            window.charts.salesChart = new Chart(salesCtx, {
              type: 'line',
              data: {
                labels: salesData.map(item => item.month),
                datasets: [{
                  label: '销售额',
                  data: salesData.map(item => item.sales),
                  borderColor: 'blue',
                  backgroundColor: 'rgba(0, 0, 255, 0.1)',
                  tension: 0.4,
                  fill: true,
                  pointRadius: 5,
                  pointHoverRadius: 8
                }]
              },
              options: {
                responsive: true,
                interaction: {
                  mode: 'index',
                  intersect: false,
                },
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  title: {
                    display: true,
                    text: '半年销售趋势'
                  },
                  tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleFont: {
                      size: 14
                    },
                    bodyFont: {
                      size: 12
                    },
                    padding: 10,
                    cornerRadius: 4
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: function(value) {
                        return '¥' + value;
                      }
                    }
                  }
                }
              }
            });
          }

          // 库存状况图表
          const inventoryCtx = document.getElementById('inventoryChart');
          if (inventoryCtx) {
            window.charts.inventoryChart = new Chart(inventoryCtx, {
              type: 'bar',
              data: {
                labels: inventoryData.map(item => item.name),
                datasets: [
                  {
                    label: '当前库存',
                    data: inventoryData.map(item => item.stock),
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderRadius: 4
                  },
                  {
                    label: '最低库存',
                    data: inventoryData.map(item => item.minStock),
                    backgroundColor: 'rgba(255, 99, 132, 0.6)',
                    borderRadius: 4
                  }
                ]
              },
              options: {
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  title: {
                    display: true,
                    text: '商品库存状况'
                  },
                  tooltip: {
                    enabled: true
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true
                  }
                }
              }
            });
          }

          // 财务分析图表
          const financialCtx = document.getElementById('financialChart');
          if (financialCtx) {
            window.charts.financialChart = new Chart(financialCtx, {
              type: 'bar',
              data: {
                labels: financialData.map(item => item.category),
                datasets: [
                  {
                    label: '收入',
                    data: financialData.map(item => item.income),
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderRadius: 4
                  },
                  {
                    label: '支出',
                    data: financialData.map(item => item.expense),
                    backgroundColor: 'rgba(255, 99, 132, 0.6)',
                    borderRadius: 4
                  }
                ]
              },
              options: {
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  title: {
                    display: true,
                    text: '财务分析'
                  },
                  tooltip: {
                    enabled: true,
                    callbacks: {
                      label: function(context) {
                        return context.dataset.label + ': ¥' + context.parsed.y;
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: function(value) {
                        return '¥' + value;
                      }
                    }
                  }
                }
              }
            });
          }

          // 店铺销售对比图表
          const shopSalesCtx = document.getElementById('shopSalesChart');
          if (shopSalesCtx) {
            window.charts.shopSalesChart = new Chart(shopSalesCtx, {
              type: 'pie',
              data: {
                labels: shopSalesData.map(item => item.name),
                datasets: [{
                  data: shopSalesData.map(item => item.sales),
                  backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(153, 102, 255, 0.6)'
                  ],
                  borderWidth: 1
                }]
              },
              options: {
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  title: {
                    display: true,
                    text: '店铺销售占比'
                  },
                  tooltip: {
                    enabled: true,
                    callbacks: {
                      label: function(context) {
                        const label = context.label || '';
                        const value = context.parsed || 0;
                        const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                        const percentage = Math.round((value / total) * 100);
                        return `${label}: ¥${value} (${percentage}%)`;
                      }
                    }
                  }
                }
              }
            });
          }

          // 添加雷达图 - 销售业绩对比
          const performanceCtx = document.getElementById('performanceChart');
          if (performanceCtx) {
            window.charts.performanceChart = new Chart(performanceCtx, {
              type: 'radar',
              data: {
                labels: ['销售额', '订单量', '客户满意度', '库存周转率', '利润率'],
                datasets: [
                  {
                    label: '北京旗舰店',
                    data: [85, 90, 95, 80, 85],
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    pointBackgroundColor: 'rgba(255, 99, 132, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(255, 99, 132, 1)'
                  },
                  {
                    label: '上海分店',
                    data: [75, 85, 90, 70, 75],
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    pointBackgroundColor: 'rgba(54, 162, 235, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(54, 162, 235, 1)'
                  }
                ]
              },
              options: {
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  title: {
                    display: true,
                    text: '店铺业绩对比'
                  }
                },
                scales: {
                  r: {
                    angleLines: {
                      display: true
                    },
                    suggestedMin: 0,
                    suggestedMax: 100
                  }
                }
              }
            });
          }
        }
      } catch (error) {
        console.error('Failed to load Chart.js:', error);
      }
    };

    loadChartJS();
  }, [salesData, inventoryData, financialData, shopSalesData]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">报表分析</h1>
        <DatePicker.RangePicker
          value={[moment(dateRange[0]), moment(dateRange[1])]}
          onChange={(dates) => {
            if (dates) {
              handleDateRangeChange([dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD')]);
            }
          }}
          style={{ width: 300 }}
        />
      </div>

      {/* 销售趋势 */}
      <Card className="mb-6" loading={loading}>
        <h2 className="text-xl font-bold mb-4">销售趋势</h2>
        <div className="p-4">
          <canvas id="salesChart" height="300"></canvas>
        </div>
      </Card>

      {/* 库存状况 */}
      <Card className="mb-6" loading={loading}>
        <h2 className="text-xl font-bold mb-4">库存状况</h2>
        <div className="p-4">
          <canvas id="inventoryChart" height="300"></canvas>
        </div>
      </Card>

      {/* 财务分析 */}
      <Card className="mb-6" loading={loading}>
        <h2 className="text-xl font-bold mb-4">财务分析</h2>
        <div className="p-4">
          <canvas id="financialChart" height="300"></canvas>
        </div>
      </Card>

      {/* 店铺销售对比 */}
      <Card className="mb-6" loading={loading}>
        <h2 className="text-xl font-bold mb-4">店铺销售对比</h2>
        <div className="p-4">
          <canvas id="shopSalesChart" height="300"></canvas>
        </div>
      </Card>

      {/* 店铺业绩对比 */}
      <Card className="mb-6" loading={loading}>
        <h2 className="text-xl font-bold mb-4">店铺业绩对比</h2>
        <div className="p-4">
          <canvas id="performanceChart" height="300"></canvas>
        </div>
      </Card>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总销售额"
              value={65000}
              prefix="¥"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总利润"
              value={22000}
              prefix="¥"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总订单数"
              value={100}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="商品种类"
              value={50}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

const UserPage: React.FC = () => {
  const [users, setUsers] = React.useState([
    { id: '1', username: 'admin', role: 'admin', shopId: null, createdAt: '2026-04-15 08:00:00' },
    { id: '2', username: 'zhang san', role: 'manager', shopId: '1', createdAt: '2026-04-15 09:00:00' },
    { id: '3', username: 'li si', role: 'staff', shopId: '1', createdAt: '2026-04-15 10:00:00' },
    { id: '4', username: 'wang wu', role: 'manager', shopId: '2', createdAt: '2026-04-15 11:00:00' },
    { id: '5', username: 'zhao liu', role: 'staff', shopId: '3', createdAt: '2026-04-15 12:00:00' },
  ]);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<any>(null);
  const [form] = Form.useForm();

  const showModal = (user?: any) => {
    if (user) {
      setEditingUser(user);
      form.setFieldsValue(user);
    } else {
      setEditingUser(null);
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const handleOk = () => {
    form.validateFields().then(values => {
      if (editingUser) {
        setUsers(users.map(user => user.id === editingUser.id ? { ...user, ...values } : user));
        message.success('用户更新成功');
      } else {
        setUsers([...users, { id: String(users.length + 1), ...values, createdAt: new Date().toLocaleString('zh-CN') }]);
        message.success('用户添加成功');
      }
      setIsModalOpen(false);
      form.resetFields();
    });
  };

  const handleDelete = (id: string) => {
    setUsers(users.filter(user => user.id !== id));
    message.success('用户删除成功');
  };

  const columns = [
    { title: '用户ID', dataIndex: 'id', key: 'id' },
    { title: '用户名', dataIndex: 'username', key: 'username' },
    { 
      title: '角色', 
      key: 'role', 
      render: (_: any, record: any) => (
        <Tag color={
          record.role === 'admin' ? 'purple' :
          record.role === 'manager' ? 'blue' :
          'green'
        }>
          {record.role === 'admin' ? '管理员' : record.role === 'manager' ? '店长' : '员工'}
        </Tag>
      ) 
    },
    { title: '所属店铺', dataIndex: 'shopId', key: 'shopId', render: (shopId: any) => shopId || '全部店铺' },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt' },
    { 
      title: '操作', 
      key: 'action', 
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button type="primary" icon={<EditOutlined />} onClick={() => showModal(record)}>编辑</Button>
          <Button danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>删除</Button>
        </Space>
      ) 
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">用户管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>添加用户</Button>
      </div>

      <Table 
        columns={columns} 
        dataSource={users} 
        rowKey="id" 
        pagination={{ pageSize: 10 }}
        style={{ marginBottom: 20 }}
      />

      {/* 模态框 */}
      <Modal
        title={editingUser ? '编辑用户' : '添加用户'}
        open={isModalOpen}
        onCancel={handleCancel}
        onOk={handleOk}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="请选择角色">
              <Select.Option value="admin">管理员</Select.Option>
              <Select.Option value="manager">店长</Select.Option>
              <Select.Option value="staff">员工</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="shopId"
            label="所属店铺"
          >
            <Input placeholder="留空表示全部店铺" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

import { getRoles, getRolePermissions, updateRolePermissions, createRole, updateRole, deleteRole } from './services/roleService';
import { getPermissions, createPermission, updatePermission, deletePermission } from './services/permissionService';

const RolePage: React.FC = () => {
  const [roles, setRoles] = React.useState<any[]>([]);
  const [permissions, setPermissions] = React.useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = React.useState(false);
  const [editingRole, setEditingRole] = React.useState<any>(null);
  const [selectedRole, setSelectedRole] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isPermissionLoading, setIsPermissionLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [form] = Form.useForm();
  const [permissionForm] = Form.useForm();

  React.useEffect(() => {
    loadRoles();
    loadPermissions();
  }, []);

  const loadRoles = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const rolesData = await getRoles();
      setRoles(rolesData);
    } catch (err) {
      console.error('Error loading roles:', err);
      setError('加载角色列表失败');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPermissions = async () => {
    try {
      const permissionsData = await getPermissions();
      setPermissions(permissionsData);
    } catch (err) {
      console.error('Error loading permissions:', err);
    }
  };

  const showModal = (role?: any) => {
    if (role) {
      setEditingRole(role);
      form.setFieldsValue(role);
    } else {
      setEditingRole(null);
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingRole) {
        await updateRole(editingRole.id, values);
        await loadRoles();
        message.success('角色更新成功');
      } else {
        await createRole({ ...values, isSystem: false });
        await loadRoles();
        message.success('角色添加成功');
      }
      setIsModalOpen(false);
      form.resetFields();
    } catch (error) {
      console.error('Error saving role:', error);
      message.error('操作失败，请重试');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRole(id);
      await loadRoles();
      message.success('角色删除成功');
    } catch (error) {
      console.error('Error deleting role:', error);
      message.error('删除失败，请重试');
    }
  };

  const handlePermissionManage = async (role: any) => {
    try {
      setIsPermissionLoading(true);
      setError(null);
      const rolePermissions = await getRolePermissions(role.id);
      setSelectedRole(role);
      // 提取权限ID数组
      const permissionIds = rolePermissions.map((permission: any) => permission.id);
      permissionForm.setFieldsValue({ permissions: permissionIds || [] });
      setIsPermissionModalOpen(true);
    } catch (err) {
      console.error('Error loading role permissions:', err);
      message.error('加载角色权限失败');
    } finally {
      setIsPermissionLoading(false);
    }
  };

  const handlePermissionCancel = () => {
    setIsPermissionModalOpen(false);
    permissionForm.resetFields();
  };

  const handlePermissionOk = async () => {
    try {
      setIsPermissionLoading(true);
      setError(null);
      const values = await permissionForm.validateFields();
      await updateRolePermissions(selectedRole.id, values.permissions);
      // 重新加载角色列表以更新权限信息
      await loadRoles();
      message.success('权限更新成功');
      setIsPermissionModalOpen(false);
      permissionForm.resetFields();
    } catch (err) {
      console.error('Error updating role permissions:', err);
      message.error('更新角色权限失败');
    } finally {
      setIsPermissionLoading(false);
    }
  };

  const columns = [
    { title: '角色名称', dataIndex: 'name', key: 'name' },
    { title: '描述', dataIndex: 'description', key: 'description' },
    { 
      title: '类型', 
      key: 'isSystem', 
      render: (_: any, record: any) => (
        <Tag color={record.isSystem ? 'blue' : 'green'}>
          {record.isSystem ? '系统内置' : '自定义'}
        </Tag>
      ) 
    },
    { 
      title: '操作', 
      key: 'action', 
      render: (_: any, record: any) => (
        <Space size="middle">
          {!record.isSystem && (
            <Button type="primary" icon={<EditOutlined />} onClick={() => showModal(record)}>编辑</Button>
          )}
          {!record.isSystem && (
            <Button danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>删除</Button>
          )}
          <Button icon={<EyeOutlined />} onClick={() => handlePermissionManage(record)}>权限管理</Button>
        </Space>
      ) 
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">角色管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>添加角色</Button>
      </div>
      <Table 
        columns={columns} 
        dataSource={roles} 
        rowKey="id" 
        pagination={{ pageSize: 10 }}
        style={{ marginBottom: 20 }}
      />
      
      {/* 模态框 */}
      <Modal
        title={editingRole ? '编辑角色' : '添加角色'}
        open={isModalOpen}
        onCancel={handleCancel}
        onOk={handleOk}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="角色名称"
            rules={[{ required: true, message: '请输入角色名称' }]}
          >
            <Input placeholder="请输入角色名称" />
          </Form.Item>
          <Form.Item
            name="description"
            label="描述"
          >
            <Input placeholder="请输入角色描述" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 权限管理模态框 */}
      <Modal
        title={`${selectedRole?.name} - 权限管理`}
        open={isPermissionModalOpen}
        onCancel={handlePermissionCancel}
        onOk={handlePermissionOk}
        confirmLoading={isPermissionLoading}
        width={600}
      >
        <Form
          form={permissionForm}
          layout="vertical"
        >
          <Form.Item
            name="permissions"
            label="权限列表"
            rules={[{ required: true, message: '请选择至少一个权限' }]}
          >
            <Select
              mode="multiple"
              placeholder="请选择权限"
              style={{ width: '100%' }}
              options={permissions.map(permission => ({
                value: permission.id,
                label: permission.name
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

const PermissionPage: React.FC = () => {
  const [permissions, setPermissions] = React.useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingPermission, setEditingPermission] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [form] = Form.useForm();

  React.useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const permissionsData = await getPermissions();
      setPermissions(permissionsData);
    } catch (err) {
      console.error('Error loading permissions:', err);
      setError('加载权限列表失败');
    } finally {
      setIsLoading(false);
    }
  };

  const showModal = (permission?: any) => {
    if (permission) {
      setEditingPermission(permission);
      form.setFieldsValue(permission);
    } else {
      setEditingPermission(null);
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingPermission) {
        await updatePermission(editingPermission.id, values);
        await loadPermissions();
        message.success('权限更新成功');
      } else {
        await createPermission(values);
        await loadPermissions();
        message.success('权限添加成功');
      }
      setIsModalOpen(false);
      form.resetFields();
    } catch (error) {
      console.error('Error saving permission:', error);
      message.error('操作失败，请重试');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePermission(id);
      await loadPermissions();
      message.success('权限删除成功');
    } catch (error) {
      console.error('Error deleting permission:', error);
      message.error('删除失败，请重试');
    }
  };

  const columns = [
    { title: '权限编码', dataIndex: 'code', key: 'code' },
    { title: '权限名称', dataIndex: 'name', key: 'name' },
    { title: '描述', dataIndex: 'description', key: 'description' },
    { 
      title: '类型', 
      key: 'type', 
      render: (_: any, record: any) => (
        <Tag color={
          record.type === 'menu' ? 'blue' :
          record.type === 'api' ? 'green' :
          'orange'
        }>
          {record.type === 'menu' ? '菜单' :
           record.type === 'api' ? 'API' :
           '操作'}
        </Tag>
      ) 
    },
    { 
      title: '操作', 
      key: 'action', 
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button type="primary" icon={<EditOutlined />} onClick={() => showModal(record)}>编辑</Button>
          <Button danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>删除</Button>
        </Space>
      ) 
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">权限管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>添加权限</Button>
      </div>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      <Table 
        columns={columns} 
        dataSource={permissions} 
        rowKey="id" 
        pagination={{ pageSize: 10 }}
        loading={isLoading}
        style={{ marginBottom: 20 }}
      />
      
      {/* 模态框 */}
      <Modal
        title={editingPermission ? '编辑权限' : '添加权限'}
        open={isModalOpen}
        onCancel={handleCancel}
        onOk={handleOk}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="code"
            label="权限编码"
            rules={[{ required: true, message: '请输入权限编码' }]}
          >
            <Input placeholder="请输入权限编码，如 dashboard.view" />
          </Form.Item>
          <Form.Item
            name="name"
            label="权限名称"
            rules={[{ required: true, message: '请输入权限名称' }]}
          >
            <Input placeholder="请输入权限名称" />
          </Form.Item>
          <Form.Item
            name="description"
            label="描述"
          >
            <Input placeholder="请输入权限描述" />
          </Form.Item>
          <Form.Item
            name="type"
            label="类型"
            rules={[{ required: true, message: '请选择权限类型' }]}
          >
            <Select placeholder="请选择权限类型">
              <Select.Option value="menu">菜单</Select.Option>
              <Select.Option value="api">API</Select.Option>
              <Select.Option value="action">操作</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default App;
