import React, { useState, useCallback } from 'react';
import { Layout, Menu, Button, Table, Modal, Form, Input, Select, Card, Statistic, Row, Col, Tag, Space, message, Breadcrumb, ConfigProvider, theme, Dropdown, Checkbox, Upload, DatePicker } from 'antd';
import moment from 'moment';
import { Link, Routes, Route, useLocation } from 'react-router-dom';
import { ShopOutlined, ProductOutlined, StockOutlined, ShoppingOutlined, DollarOutlined, BarChartOutlined, PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, MenuFoldOutlined, MenuUnfoldOutlined, SearchOutlined, DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import { useAuthStore, filterMenuByPermission } from './store/authStore';
import { menuConfig } from './config/menu';
import { shopApi, productApi, inventoryApi, salesApi, financialApi, userApi, reportApi } from './api';
import { LogService } from './services/logService';
import { debounce } from './utils/requestUtils';
import { ErrorHandler } from './utils/errorHandler';

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

  // 全局搜索处理
  const handleSearch = useCallback(
    debounce(async (value: string) => {
      if (!value.trim()) {
        return;
      }
      
      LogService.logUserAction('search', 'global', undefined, { keyword: value });
      
      try {
        // 搜索店铺
        const shopsResponse = await shopApi.getAll({ search: value });
        // 搜索商品
        const productsResponse = await productApi.getAll({ search: value });
        
        const results = [];
        
        if (shopsResponse.data && shopsResponse.data.length > 0) {
          results.push(...shopsResponse.data.map((shop: any) => ({
            type: 'shop',
            id: shop.id,
            name: shop.name,
            description: shop.address,
            path: '/shops'
          })));
        }
        
        if (productsResponse.data && productsResponse.data.length > 0) {
          results.push(...productsResponse.data.map((product: any) => ({
            type: 'product',
            id: product.id,
            name: product.name,
            description: `${product.brand} ${product.model} - ¥${product.price}`,
            path: '/products'
          })));
        }
        
        if (results.length > 0) {
          const resultText = results.map(r => `${r.type === 'shop' ? '店铺' : '商品'}: ${r.name}`).join('\n');
          message.info(`找到 ${results.length} 条结果:\n${resultText}`, 5);
        } else {
          message.info(`未找到与 "${value}" 相关的结果`);
        }
      } catch (error) {
        console.error('Search error:', error);
        message.error('搜索失败，请重试');
      }
    }, 500),
    []
  );

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
          colorBgLayout: '#f0f2f5',
        },
      }}
    >
      <Layout style={{ minHeight: '100vh' }}>
        <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#001529', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: '16px', width: 64, height: 64, color: 'white' }}
            />
            <div style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', marginLeft: 16, display: { xs: 'none', sm: 'block' } }}>多门店 ERP 系统</div>
            <div style={{ color: 'white', fontSize: '16px', fontWeight: 'bold', marginLeft: 16, display: { xs: 'block', sm: 'none' } }}>ERP</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            {isAuthenticated && (
              <>
                <Search
                  placeholder="搜索"
                  allowClear
                  enterButton={<SearchOutlined />}
                  style={{ width: { xs: 150, sm: 200 }, marginRight: { xs: 0, sm: 16 } }}
                  onSearch={handleSearch}
                />
                <span style={{ color: 'white', marginRight: { xs: 0, sm: 16 }, display: { xs: 'none', sm: 'inline' } }}>欢迎, {user?.username}</span>
                  <Button onClick={() => {
                    LogService.logUserAction('logout', 'auth', undefined, { username: user?.username });
                    logout();
                  }}>退出登录</Button>
              </>
            )}
            {!isAuthenticated && (
              <Button type="primary" onClick={() => setIsLoginModalOpen(true)}>登录</Button>
            )}
          </div>
        </Header>
        <Layout>
          <Sider
            width={200}
            collapsedWidth={80}
            collapsed={collapsed}
            collapsible
            breakpoint="lg"
            style={{
              backgroundColor: 'white',
              boxShadow: '2px 0 8px rgba(0, 0, 0, 0.09)',
            }}
          >
            <Menu
              mode="inline"
              style={{ height: '100%', borderRight: 0 }}
              items={menuItems}
              selectedKeys={[location.pathname]}
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
          >
            {error && <div className="text-red-500 mb-4">{error}</div>}
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
                name="password"
                label="密码"
                rules={[{ required: true, message: '请输入密码' }]}
              >
                <Input.Password placeholder="请输入密码" />
              </Form.Item>
            </Form>
          </Modal>
          <Layout style={{ padding: { xs: '12px', sm: '24px' } }}>
            <Content style={{ backgroundColor: 'white', padding: { xs: '16px', sm: '24px' }, minHeight: 280, borderRadius: 8, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)' }}>
              {/* 面包屑导航 */}
              <Breadcrumb items={getBreadcrumbItems()} style={{ marginBottom: 24, display: { xs: 'none', sm: 'block' } }} />
              
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
    <div>
      <h1 className="text-2xl font-bold mb-6">欢迎使用多门店 ERP 系统</h1>
      
      {/* 常用操作快捷方式 */}
      <Card className="mb-8" hoverable>
        <h2 className="text-xl font-bold mb-4">常用操作</h2>
        <Row gutter={[16, 16]}>
          {commonActions.map((action, index) => (
            <Col key={index} xs={24} sm={12} md={8} lg={4}>
              <Link to={action.path}>
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  padding: '20px', 
                  backgroundColor: '#f6f8fa', 
                  borderRadius: '8px', 
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  border: `1px solid ${action.color}20`
                }} onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                }} onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}>
                  <div style={{ fontSize: '32px', color: action.color, marginBottom: '8px' }}>
                    {action.icon}
                  </div>
                  <div style={{ fontWeight: '500' }}>{action.title}</div>
                </div>
              </Link>
            </Col>
          ))}
        </Row>
      </Card>
      
      {/* 统计卡片 */}
      <Row gutter={[16, 16]} className="mb-8">
        <Col xs={24} sm={12} md={6}>
          <Card hoverable loading={loading}>
            <Statistic
              title="总店铺数"
              value={10}
              prefix={<ShopOutlined />}
              valueStyle={{ color: '#1890ff' }}
              suffix="家"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card hoverable loading={loading}>
            <Statistic
              title="总商品数"
              value={1000}
              prefix={<ProductOutlined />}
              valueStyle={{ color: '#52c41a' }}
              suffix="件"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card hoverable loading={loading}>
            <Statistic
              title="今日销售额"
              value={10000}
              prefix="¥"
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card hoverable loading={loading}>
            <Statistic
              title="库存总量"
              value={5000}
              prefix={<StockOutlined />}
              valueStyle={{ color: '#f5222d' }}
              suffix="件"
            />
          </Card>
        </Col>
      </Row>
      
      {/* 最近销售和库存预警 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="最近销售订单" hoverable loading={loading}>
            <Table 
              columns={[
                { title: '订单号', dataIndex: 'id', key: 'id' },
                { title: '店铺', dataIndex: 'shopId', key: 'shopId' },
                { title: '金额', dataIndex: 'amount', key: 'amount', render: (amount: number) => `¥${amount}` },
                { title: '状态', dataIndex: 'status', key: 'status', render: (status: string) => (
                  <Tag color={status === 'completed' ? 'green' : 'yellow'}>
                    {status === 'completed' ? '已完成' : '待处理'}
                  </Tag>
                )},
                { title: '时间', dataIndex: 'time', key: 'time' },
              ]} 
              dataSource={[
                { id: '1', shopId: '北京旗舰店', amount: 5999, status: 'completed', time: '2026-04-15 10:00' },
                { id: '2', shopId: '上海分店', amount: 8999, status: 'completed', time: '2026-04-15 09:30' },
                { id: '3', shopId: '广州分店', amount: 12999, status: 'pending', time: '2026-04-15 09:00' },
              ]} 
              rowKey="id"
              pagination={false}
            />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="库存预警" hoverable loading={loading}>
            <Table 
              columns={[
                { title: '商品名称', dataIndex: 'name', key: 'name' },
                { title: '当前库存', dataIndex: 'current', key: 'current' },
                { title: '最低库存', dataIndex: 'min', key: 'min' },
                { title: '店铺', dataIndex: 'shop', key: 'shop' },
                { title: '状态', dataIndex: 'status', key: 'status', render: (status: string) => (
                  <Tag color={status === 'critical' ? 'red' : 'orange'}>
                    {status === 'critical' ? '严重不足' : '即将不足'}
                  </Tag>
                )},
              ]} 
              dataSource={[
                { name: 'iPhone 15', current: 5, min: 10, shop: '北京旗舰店', status: 'critical' },
                { name: 'MacBook Pro', current: 8, min: 10, shop: '上海分店', status: 'warning' },
                { name: 'AirPods Pro', current: 15, min: 20, shop: '广州分店', status: 'warning' },
              ]} 
              rowKey="name"
              pagination={false}
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
  const [users, setUsers] = React.useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isBatchEditModalOpen, setIsBatchEditModalOpen] = React.useState(false);
  const [editingShop, setEditingShop] = React.useState<any>(null);
  const [selectedShopIds, setSelectedShopIds] = React.useState<string[]>([]);
  const [form] = Form.useForm();
  const [batchForm] = Form.useForm();
  const [searchValue, setSearchValue] = React.useState('');
  const [selectedManager, setSelectedManager] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [usersLoading, setUsersLoading] = React.useState(true);
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = React.useState(false);
  const [advancedSearch, setAdvancedSearch] = React.useState({
    name: '',
    address: '',
    phone: '',
    manager: ''
  });

  // 从API获取用户列表
  React.useEffect(() => {
    const fetchUsers = async () => {
      try {
        setUsersLoading(true);
        const response = await userApi.getAll();
        setUsers(response.data || []);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setUsersLoading(false);
      }
    };

    fetchUsers();
  }, []);

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
          { id: '1', name: '北京旗舰店', address: '北京市朝阳区', phone: '13800138001', manager: 'admin', managerId: '1' },
          { id: '2', name: '上海分店', address: '上海市浦东新区', phone: '13800138002', manager: 'admin', managerId: '1' },
          { id: '3', name: '广州分店', address: '广州市天河区', phone: '13800138003', manager: 'admin', managerId: '1' },
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

  const showModal = (shop?: any) => {
    if (shop) {
      setEditingShop(shop);
      form.setFieldsValue({
        name: shop.name,
        address: shop.address,
        phone: shop.phone,
        managerId: shop.managerId
      });
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
            <Dropdown menu={{ items: [{ key: 'excel', label: '导出Excel', onClick: exportToExcel }] }}>
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
            <Button type="default" onClick={() => {
              setSearchValue('');
              setSelectedManager('');
            }}>重置筛选</Button>
          </Col>
        </Row>
        
        {/* 高级搜索 */}
        <div className="mt-4">
          <Button type="link" onClick={() => setIsAdvancedSearchOpen(!isAdvancedSearchOpen)}>
            {isAdvancedSearchOpen ? '收起高级搜索' : '高级搜索'}
          </Button>
          {isAdvancedSearchOpen && (
            <div className="mt-4 p-4 bg-gray-50 rounded">
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item label="店铺名称">
                    <Input placeholder="请输入店铺名称" value={advancedSearch.name} onChange={(e) => setAdvancedSearch({...advancedSearch, name: e.target.value})} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item label="地址">
                    <Input placeholder="请输入地址" value={advancedSearch.address} onChange={(e) => setAdvancedSearch({...advancedSearch, address: e.target.value})} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item label="电话">
                    <Input placeholder="请输入电话" value={advancedSearch.phone} onChange={(e) => setAdvancedSearch({...advancedSearch, phone: e.target.value})} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item label="负责人">
                    <Input placeholder="请输入负责人" value={advancedSearch.manager} onChange={(e) => setAdvancedSearch({...advancedSearch, manager: e.target.value})} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={24} md={16} className="flex justify-end">
                  <Space>
                    <Button onClick={() => setAdvancedSearch({ name: '', address: '', phone: '', manager: '' })}>清空</Button>
                    <Button type="primary" onClick={handleAdvancedSearch}>应用筛选</Button>
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
            name="managerId"
            label="负责人"
            rules={[
              { required: true, message: '请选择负责人' },
            ]}
          >
            <Select placeholder="请选择负责人" loading={usersLoading}>
              {users.map(user => (
                <Select.Option key={user.id} value={user.id}>{user.username}</Select.Option>
              ))}
            </Select>
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
            name="managerId"
            label="负责人"
          >
            <Select placeholder="请选择负责人（留空不修改）" loading={usersLoading} allowClear>
              {users.map(user => (
                <Select.Option key={user.id} value={user.id}>{user.username}</Select.Option>
              ))}
            </Select>
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
            <Dropdown menu={{ items: [{ key: 'excel', label: '导出Excel', onClick: exportToExcel }] }}>
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
            <Button type="default" onClick={() => {
              setSearchValue('');
              setSelectedCategory('');
              setSelectedBrand('');
              setAdvancedSearch({ name: '', model: '', minPrice: '', maxPrice: '', minStock: '', maxStock: '' });
            }}>重置筛选</Button>
          </Col>
        </Row>
        
        {/* 高级搜索 */}
        <div className="mt-4">
          <Button type="link" onClick={() => setIsAdvancedSearchOpen(!isAdvancedSearchOpen)}>
            {isAdvancedSearchOpen ? '收起高级搜索' : '高级搜索'}
          </Button>
          {isAdvancedSearchOpen && (
            <div className="mt-4 p-4 bg-gray-50 rounded">
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item label="商品名称">
                    <Input placeholder="请输入商品名称" value={advancedSearch.name} onChange={(e) => setAdvancedSearch({...advancedSearch, name: e.target.value})} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item label="型号">
                    <Input placeholder="请输入型号" value={advancedSearch.model} onChange={(e) => setAdvancedSearch({...advancedSearch, model: e.target.value})} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item label="价格范围">
                    <Row gutter={8}>
                      <Col span={12}>
                        <Input placeholder="最低" type="number" min="0" step="0.01" value={advancedSearch.minPrice} onChange={(e) => setAdvancedSearch({...advancedSearch, minPrice: e.target.value})} />
                      </Col>
                      <Col span={12}>
                        <Input placeholder="最高" type="number" min="0" step="0.01" value={advancedSearch.maxPrice} onChange={(e) => setAdvancedSearch({...advancedSearch, maxPrice: e.target.value})} />
                      </Col>
                    </Row>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item label="库存范围">
                    <Row gutter={8}>
                      <Col span={12}>
                        <Input placeholder="最低" type="number" min="0" value={advancedSearch.minStock} onChange={(e) => setAdvancedSearch({...advancedSearch, minStock: e.target.value})} />
                      </Col>
                      <Col span={12}>
                        <Input placeholder="最高" type="number" min="0" value={advancedSearch.maxStock} onChange={(e) => setAdvancedSearch({...advancedSearch, maxStock: e.target.value})} />
                      </Col>
                    </Row>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={24} md={16} className="flex justify-end">
                  <Space>
                    <Button onClick={() => setAdvancedSearch({ name: '', model: '', minPrice: '', maxPrice: '', minStock: '', maxStock: '' })}>清空</Button>
                    <Button type="primary" onClick={handleAdvancedSearch}>应用筛选</Button>
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

  // 处理选择变化
  const handleSelectChange = (selectedRowKeys: string[]) => {
    setSelectedInventoryIds(selectedRowKeys);
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
            <Button type="primary" icon={<EditOutlined />} onClick={handleBatchEdit}>批量编辑</Button>
          )}
          <Dropdown menu={{ items: [
            { key: 'inventory', label: '导出库存数据', onClick: exportToExcel },
            { key: 'logs', label: '导出变动记录', onClick: exportLogsToExcel }
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
            <Button type="default" onClick={() => {
              setSearchValue('');
              setSelectedShop('');
              setSelectedStockStatus('');
            }}>重置筛选</Button>
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
            <Button type="default" onClick={() => {
              setLogSearchValue('');
              setSelectedLogType('');
            }}>重置筛选</Button>
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
          <Dropdown menu={{ items: [{ key: 'excel', label: '导出Excel', onClick: exportToExcel }] }}>
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
            <Button type="default" onClick={() => {
              setSearchValue('');
              setSelectedShop('');
              setSelectedStatus('');
            }}>重置筛选</Button>
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
  const [salesData, setSalesData] = React.useState<any[]>([]);

  // 库存状况数据
  const [inventoryStatus, setInventoryStatus] = React.useState<any>(null);

  // 财务分析数据
  const [financialAnalysis, setFinancialAnalysis] = React.useState<any>(null);

  // 店铺销售对比
  const [shopComparisonData, setShopComparisonData] = React.useState<any[]>([]);

  // 概览数据
  const [overviewData, setOverviewData] = React.useState<any>(null);

  // 加载报表数据
  const loadReportData = React.useCallback(async () => {
    setLoading(true);
    try {
      // 并行加载所有报表数据
      const [salesTrendRes, inventoryStatusRes, financialAnalysisRes, shopComparisonRes, overviewRes] = await Promise.all([
        reportApi.getSalesTrend(),
        reportApi.getInventoryStatus(),
        reportApi.getFinancialAnalysis(),
        reportApi.getShopComparison(),
        reportApi.getOverview(),
      ]);

      // 处理销售趋势数据
      if (salesTrendRes.data) {
        setSalesData(salesTrendRes.data.map((item: any) => ({
          month: item.month.split('-')[1] + '月',
          sales: item.sales,
          orders: item.orders
        })));
      }

      // 处理库存状况数据 - 转换为前端需要的格式
      if (inventoryStatusRes.data) {
        // 后端返回的是统计对象，我们需要转换为数组格式用于图表
        const inventoryArray = [
          { name: '总商品数', stock: inventoryStatusRes.data.totalProducts, minStock: 0 },
          { name: '总库存量', stock: inventoryStatusRes.data.totalStock, minStock: 0 },
          { name: '低库存商品', stock: inventoryStatusRes.data.lowStock, minStock: 0 }
        ];
        setInventoryStatus(inventoryArray);
      }

      // 处理财务分析数据 - 转换为前端需要的格式
      if (financialAnalysisRes.data) {
        // 后端返回的是统计对象，我们需要转换为数组格式用于图表
        const financialArray = [
          { category: '总收入', income: financialAnalysisRes.data.totalIncome, expense: 0 },
          { category: '总支出', income: 0, expense: financialAnalysisRes.data.totalExpense },
          { category: '净收入', income: financialAnalysisRes.data.netProfit, expense: 0 }
        ];
        setFinancialAnalysis(financialArray);
      }

      // 处理店铺对比数据 - 转换字段名
      if (shopComparisonRes.data) {
        const shopData = shopComparisonRes.data.map((item: any) => ({
          name: item.shopName,
          sales: item.totalSales
        }));
        setShopComparisonData(shopData);
      }

      // 处理概览数据
      if (overviewRes.data) {
        setOverviewData(overviewRes.data);
      }

      message.success('报表数据加载成功');
    } catch (error) {
      console.error('Error fetching report data:', error);
      message.error('获取报表数据失败，请重试');
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始化加载数据
  React.useEffect(() => {
    loadReportData();
  }, [loadReportData]);

  // 处理日期范围变化
  const handleDateRangeChange = async (dates: [string, string]) => {
    setDateRange(dates);
    await loadReportData();
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
                labels: inventoryStatus?.map((item: any) => item.name) || [],
                datasets: [
                  {
                    label: '当前库存',
                    data: inventoryStatus?.map((item: any) => item.stock) || [],
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderRadius: 4
                  },
                  {
                    label: '最低库存',
                    data: inventoryStatus?.map((item: any) => item.minStock) || [],
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
                labels: financialAnalysis?.map((item: any) => item.category) || [],
                datasets: [
                  {
                    label: '收入',
                    data: financialAnalysis?.map((item: any) => item.income) || [],
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderRadius: 4
                  },
                  {
                    label: '支出',
                    data: financialAnalysis?.map((item: any) => item.expense) || [],
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
                labels: shopComparisonData?.map((item: any) => item.name) || [],
                datasets: [{
                  data: shopComparisonData?.map((item: any) => item.sales) || [],
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
  }, [salesData, inventoryStatus, financialAnalysis, shopComparisonData]);

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
          <Card loading={loading}>
            <Statistic
              title="总销售额"
              value={overviewData?.totalSales || 0}
              prefix="¥"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic
              title="总利润"
              value={overviewData?.netProfit || 0}
              prefix="¥"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic
              title="总订单数"
              value={overviewData?.orders || 0}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic
              title="商品种类"
              value={overviewData?.products || 0}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

const UserPage: React.FC = () => {
  const [users, setUsers] = React.useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<any>(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState('');
  const [selectedRole, setSelectedRole] = React.useState('');

  // 加载用户数据
  const loadUsers = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await userApi.getAll();
      setUsers(response.data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      message.error('加载用户列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始化加载
  React.useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // 过滤用户数据
  const filteredUsers = React.useMemo(() => {
    return users.filter(user => {
      const matchesSearch = !searchValue || 
        user.username.toLowerCase().includes(searchValue.toLowerCase());
      const matchesRole = !selectedRole || user.role === selectedRole;
      return matchesSearch && matchesRole;
    });
  }, [users, searchValue, selectedRole]);

  const showModal = (user?: any) => {
    if (user) {
      setEditingUser(user);
      form.setFieldsValue({
        username: user.username,
        role: user.role,
        shopId: user.shopId,
      });
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

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingUser) {
        await userApi.update(editingUser.id, values);
        message.success('用户更新成功');
      } else {
        await userApi.create(values);
        message.success('用户添加成功');
      }
      
      setIsModalOpen(false);
      form.resetFields();
      await loadUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      message.error('操作失败，请重试');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await userApi.delete(id);
      message.success('用户删除成功');
      await loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      message.error('删除失败，请重试');
    }
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
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', render: (date: string) => new Date(date).toLocaleString('zh-CN') },
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

      {/* 搜索和筛选 */}
      <Card className="mb-4" hoverable>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input.Search
              placeholder="搜索用户名"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              allowClear
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={6} md={4}>
            <Select
              placeholder="按角色筛选"
              value={selectedRole || undefined}
              onChange={setSelectedRole}
              allowClear
              style={{ width: '100%' }}
            >
              <Select.Option value="admin">管理员</Select.Option>
              <Select.Option value="manager">店长</Select.Option>
              <Select.Option value="staff">员工</Select.Option>
            </Select>
          </Col>
          <Col xs={24} sm={6} md={4} offset={8}>
            <Button type="default" onClick={() => {
              setSearchValue('');
              setSelectedRole('');
            }}>重置筛选</Button>
          </Col>
        </Row>
      </Card>

      <Table 
        columns={columns} 
        dataSource={filteredUsers} 
        rowKey="id" 
        pagination={{ pageSize: 10 }}
        loading={loading}
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
          {!editingUser && (
            <Form.Item
              name="password"
              label="密码"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password placeholder="请输入密码" />
            </Form.Item>
          )}
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
