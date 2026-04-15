import React, { useState } from 'react';
import { Layout, Menu, Button, Table, Modal, Form, Input, Select, Card, Statistic, Row, Col, Tag, Space, message } from 'antd';
import { Link, Routes, Route } from 'react-router-dom';
import { HomeOutlined, ShopOutlined, ProductOutlined, StockOutlined, ShoppingOutlined, DollarOutlined, BarChartOutlined, UserOutlined, PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, SettingOutlined } from '@ant-design/icons';
import { useAuthStore, filterMenuByPermission } from './store/authStore';
import { menuConfig } from './config/menu';

const { Header, Content, Sider } = Layout;

const App: React.FC = () => {
  const { user, isAuthenticated, login, logout, isLoading, error, clearError } = useAuthStore();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [form] = Form.useForm();

  const handleLogin = async () => {
    try {
      const values = await form.validateFields();
      await login(values.username, values.password);
      setIsLoginModalOpen(false);
      form.resetFields();
      message.success('登录成功');
    } catch (err: any) {
      console.error('Login error:', err);
      // 表单验证失败，显示错误消息
      if (err.errorFields && err.errorFields.length > 0) {
        message.error(err.errorFields[0].errors[0]);
      } else {
        message.error('登录失败，请检查用户名和密码');
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

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#001529' }}>
        <div style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>多门店 ERP 系统</div>
        <div>
          {isAuthenticated ? (
            <>
              <span style={{ color: 'white', marginRight: 16 }}>欢迎, {user?.username}</span>
              <Button onClick={logout}>退出登录</Button>
            </>
          ) : (
            <Button type="primary" onClick={() => setIsLoginModalOpen(true)}>登录</Button>
          )}
        </div>
      </Header>
      <Layout>
        <Sider width={200} style={{ backgroundColor: '#f0f2f5' }}>
          <Menu
            mode="inline"
            style={{ height: '100%', borderRight: 0 }}
            items={menuItems}
          />
        </Sider>
        
        {/* 登录模态框 */}
        <Modal
          title="用户登录"
          open={isLoginModalOpen}
          onCancel={() => setIsLoginModalOpen(false)}
          onOk={handleLogin}
          confirmLoading={isLoading}
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
        <Layout style={{ padding: '24px' }}>
          <Content style={{ backgroundColor: 'white', padding: '24px', minHeight: 280 }}>
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
  );
};

const HomePage: React.FC = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">欢迎使用多门店 ERP 系统</h1>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总店铺数"
              value={10}
              prefix={<ShopOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总商品数"
              value={1000}
              prefix={<ProductOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="今日销售额"
              value={10000}
              prefix="¥"
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="库存总量"
              value={5000}
              prefix={<StockOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

const ShopPage: React.FC = () => {
  const [shops, setShops] = React.useState([
    { id: '1', name: '北京旗舰店', address: '北京市朝阳区', phone: '13800138001', manager: '张三' },
    { id: '2', name: '上海分店', address: '上海市浦东新区', phone: '13800138002', manager: '李四' },
    { id: '3', name: '广州分店', address: '广州市天河区', phone: '13800138003', manager: '王五' },
  ]);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingShop, setEditingShop] = React.useState<any>(null);
  const [form] = Form.useForm();

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

  const handleOk = () => {
    form.validateFields().then(values => {
      if (editingShop) {
        setShops(shops.map(shop => shop.id === editingShop.id ? { ...shop, ...values } : shop));
        message.success('店铺更新成功');
      } else {
        setShops([...shops, { id: String(shops.length + 1), ...values }]);
        message.success('店铺添加成功');
      }
      setIsModalOpen(false);
      form.resetFields();
    });
  };

  const handleDelete = (id: string) => {
    setShops(shops.filter(shop => shop.id !== id));
    message.success('店铺删除成功');
  };

  const columns = [
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
        <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>添加店铺</Button>
      </div>
      <Table 
        columns={columns} 
        dataSource={shops} 
        rowKey="id" 
        pagination={{ pageSize: 10 }}
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
            rules={[{ required: true, message: '请输入店铺名称' }]}
          >
            <Input placeholder="请输入店铺名称" />
          </Form.Item>
          <Form.Item
            name="address"
            label="地址"
            rules={[{ required: true, message: '请输入地址' }]}
          >
            <Input placeholder="请输入地址" />
          </Form.Item>
          <Form.Item
            name="phone"
            label="电话"
            rules={[{ required: true, message: '请输入电话' }]}
          >
            <Input placeholder="请输入电话" />
          </Form.Item>
          <Form.Item
            name="manager"
            label="负责人"
            rules={[{ required: true, message: '请输入负责人' }]}
          >
            <Input placeholder="请输入负责人" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

const ProductPage: React.FC = () => {
  const [products, setProducts] = React.useState([
    { id: '1', name: 'iPhone 15', category: '手机', brand: 'Apple', model: 'A2650', price: 5999, costPrice: 5000, stock: 50, shopId: '1' },
    { id: '2', name: 'MacBook Pro', category: '电脑', brand: 'Apple', model: 'M3', price: 12999, costPrice: 10000, stock: 20, shopId: '1' },
    { id: '3', name: 'iPad Pro', category: '平板', brand: 'Apple', model: 'M2', price: 8999, costPrice: 7000, stock: 30, shopId: '2' },
    { id: '4', name: 'AirPods Pro', category: '耳机', brand: 'Apple', model: '2nd Gen', price: 1999, costPrice: 1500, stock: 100, shopId: '3' },
  ]);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<any>(null);
  const [form] = Form.useForm();

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

  const handleOk = () => {
    form.validateFields().then(values => {
      if (editingProduct) {
        setProducts(products.map(product => product.id === editingProduct.id ? { ...product, ...values } : product));
        message.success('商品更新成功');
      } else {
        setProducts([...products, { id: String(products.length + 1), ...values }]);
        message.success('商品添加成功');
      }
      setIsModalOpen(false);
      form.resetFields();
    });
  };

  const handleDelete = (id: string) => {
    setProducts(products.filter(product => product.id !== id));
    message.success('商品删除成功');
  };

  const columns = [
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
        <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>添加商品</Button>
      </div>
      <Table 
        columns={columns} 
        dataSource={products} 
        rowKey="id" 
        pagination={{ pageSize: 10 }}
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
            rules={[{ required: true, message: '请输入商品名称' }]}
          >
            <Input placeholder="请输入商品名称" />
          </Form.Item>
          <Form.Item
            name="category"
            label="分类"
            rules={[{ required: true, message: '请输入分类' }]}
          >
            <Input placeholder="请输入分类" />
          </Form.Item>
          <Form.Item
            name="brand"
            label="品牌"
            rules={[{ required: true, message: '请输入品牌' }]}
          >
            <Input placeholder="请输入品牌" />
          </Form.Item>
          <Form.Item
            name="model"
            label="型号"
            rules={[{ required: true, message: '请输入型号' }]}
          >
            <Input placeholder="请输入型号" />
          </Form.Item>
          <Form.Item
            name="price"
            label="价格"
            rules={[{ required: true, message: '请输入价格' }]}
          >
            <Input type="number" placeholder="请输入价格" />
          </Form.Item>
          <Form.Item
            name="costPrice"
            label="成本价"
            rules={[{ required: true, message: '请输入成本价' }]}
          >
            <Input type="number" placeholder="请输入成本价" />
          </Form.Item>
          <Form.Item
            name="stock"
            label="库存"
            rules={[{ required: true, message: '请输入库存' }]}
          >
            <Input type="number" placeholder="请输入库存" />
          </Form.Item>
          <Form.Item
            name="shopId"
            label="所属店铺"
            rules={[{ required: true, message: '请输入所属店铺' }]}
          >
            <Input placeholder="请输入所属店铺" />
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
  const [inventoryLogs, setInventoryLogs] = React.useState([
    { id: '1', productId: '1', productName: 'iPhone 15', quantity: 10, type: 'in', reason: '采购入库', shopId: '1', createdAt: '2026-04-15 10:00:00' },
    { id: '2', productId: '1', productName: 'iPhone 15', quantity: 5, type: 'out', reason: '销售出库', shopId: '1', createdAt: '2026-04-15 11:00:00' },
    { id: '3', productId: '2', productName: 'MacBook Pro', quantity: 3, type: 'in', reason: '采购入库', shopId: '1', createdAt: '2026-04-15 09:00:00' },
  ]);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [form] = Form.useForm();

  const showModal = () => {
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const handleOk = () => {
    form.validateFields().then(values => {
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
    });
  };

  const inventoryColumns = [
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
        <Button type="primary" icon={<PlusOutlined />} onClick={showModal}>调整库存</Button>
      </div>

      {/* 库存预警 */}
      <Card className="mb-6">
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
      <Card className="mb-6">
        <h2 className="text-xl font-bold mb-4">库存列表</h2>
        <Table 
          columns={inventoryColumns} 
          dataSource={inventory} 
          rowKey="id" 
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* 库存变动记录 */}
      <Card>
        <h2 className="text-xl font-bold mb-4">库存变动记录</h2>
        <Table 
          columns={logColumns} 
          dataSource={inventoryLogs} 
          rowKey="id" 
          pagination={{ pageSize: 10 }}
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
            rules={[{ required: true, message: '请输入变动数量' }]}
          >
            <Input type="number" placeholder="请输入变动数量" min="1" />
          </Form.Item>
          <Form.Item
            name="reason"
            label="变动原因"
            rules={[{ required: true, message: '请输入变动原因' }]}
          >
            <Input placeholder="请输入变动原因" />
          </Form.Item>
          <Form.Item
            name="shopId"
            label="所属店铺"
            rules={[{ required: true, message: '请输入所属店铺' }]}
          >
            <Input placeholder="请输入所属店铺" />
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
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedOrder, setSelectedOrder] = React.useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = React.useState(false);
  const [form] = Form.useForm();

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

  const handleOk = () => {
    form.validateFields().then(values => {
      // 计算总金额
      const totalAmount = values.items.reduce((sum: number, item: any) => sum + item.quantity * item.price, 0);
      
      // 创建新订单
      const newOrder = {
        id: String(orders.length + 1),
        shopId: values.shopId,
        totalAmount,
        status: 'pending',
        createdAt: new Date().toLocaleString('zh-CN'),
        items: values.items,
      };
      
      setOrders([...orders, newOrder]);
      message.success('订单添加成功');
      setIsModalOpen(false);
      form.resetFields();
    });
  };

  const updateStatus = (id: string, status: string) => {
    setOrders(orders.map(order => order.id === id ? { ...order, status } : order));
    message.success('订单状态更新成功');
  };

  const columns = [
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
        <Button type="primary" icon={<PlusOutlined />} onClick={showModal}>添加订单</Button>
      </div>

      {/* 销售订单列表 */}
      <Table 
        columns={columns} 
        dataSource={orders} 
        rowKey="id" 
        pagination={{ pageSize: 10 }}
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
            rules={[{ required: true, message: '请输入店铺' }]}
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
                        rules={[{ required: true, message: '请输入商品名称' }]}
                      >
                        <Input placeholder="请输入商品名称" />
                      </Form.Item>
                      <Form.Item
                        {...field}
                        name={[field.name, 'productId']}
                        label="商品ID"
                        rules={[{ required: true, message: '请输入商品ID' }]}
                      >
                        <Input placeholder="请输入商品ID" />
                      </Form.Item>
                      <div className="grid grid-cols-2 gap-4">
                        <Form.Item
                          {...field}
                          name={[field.name, 'quantity']}
                          label="数量"
                          rules={[{ required: true, message: '请输入数量' }]}
                        >
                          <Input type="number" placeholder="请输入数量" min="1" />
                        </Form.Item>
                        <Form.Item
                          {...field}
                          name={[field.name, 'price']}
                          label="单价"
                          rules={[{ required: true, message: '请输入单价' }]}
                        >
                          <Input type="number" placeholder="请输入单价" min="0" />
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
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [form] = Form.useForm();

  // 计算收支统计
  const incomeTotal = financialRecords.filter(record => record.type === 'income').reduce((sum, record) => sum + record.amount, 0);
  const expenseTotal = financialRecords.filter(record => record.type === 'expense').reduce((sum, record) => sum + record.amount, 0);
  const netProfit = incomeTotal - expenseTotal;

  const showModal = () => {
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const handleOk = () => {
    form.validateFields().then(values => {
      const newRecord = {
        id: String(financialRecords.length + 1),
        ...values,
        createdAt: new Date().toLocaleString('zh-CN'),
      };
      setFinancialRecords([...financialRecords, newRecord]);
      message.success('财务记录添加成功');
      setIsModalOpen(false);
      form.resetFields();
    });
  };

  const handleDelete = (id: string) => {
    setFinancialRecords(financialRecords.filter(record => record.id !== id));
    message.success('财务记录删除成功');
  };

  const columns = [
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
        <Button type="primary" icon={<PlusOutlined />} onClick={showModal}>添加记录</Button>
      </div>

      {/* 收支统计 */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="总收入"
              value={incomeTotal}
              prefix="¥"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="总支出"
              value={expenseTotal}
              prefix="¥"
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="净利润"
              value={netProfit}
              prefix="¥"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 财务记录列表 */}
      <Table 
        columns={columns} 
        dataSource={financialRecords} 
        rowKey="id" 
        pagination={{ pageSize: 10 }}
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
            rules={[{ required: true, message: '请输入店铺' }]}
          >
            <Input placeholder="请输入店铺" />
          </Form.Item>
          <Form.Item
            name="amount"
            label="金额"
            rules={[{ required: true, message: '请输入金额' }]}
          >
            <Input type="number" placeholder="请输入金额" min="0" />
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
            rules={[{ required: true, message: '请输入分类' }]}
          >
            <Input placeholder="请输入分类" />
          </Form.Item>
          <Form.Item
            name="description"
            label="描述"
            rules={[{ required: true, message: '请输入描述' }]}
          >
            <Input placeholder="请输入描述" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

const ReportPage: React.FC = () => {
  // 销售趋势数据
  const salesData = [
    { month: '1月', sales: 10000 },
    { month: '2月', sales: 15000 },
    { month: '3月', sales: 12000 },
    { month: '4月', sales: 18000 },
    { month: '5月', sales: 20000 },
    { month: '6月', sales: 25000 },
  ];

  // 库存状况数据
  const inventoryData = [
    { name: 'iPhone 15', stock: 50, minStock: 10 },
    { name: 'MacBook Pro', stock: 20, minStock: 5 },
    { name: 'iPad Pro', stock: 30, minStock: 8 },
    { name: 'AirPods Pro', stock: 100, minStock: 20 },
  ];

  // 财务分析数据
  const financialData = [
    { category: '销售', income: 50000, expense: 0 },
    { category: '采购', income: 0, expense: 15000 },
    { category: '租金', income: 0, expense: 5000 },
    { category: '薪资', income: 0, expense: 10000 },
    { category: '其他', income: 5000, expense: 3000 },
  ];

  // 店铺销售对比
  const shopSalesData = [
    { name: '北京旗舰店', sales: 30000 },
    { name: '上海分店', sales: 20000 },
    { name: '广州分店', sales: 15000 },
  ];

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
          // 销售趋势图表
          const salesCtx = document.getElementById('salesChart');
          if (salesCtx) {
            new Chart(salesCtx, {
              type: 'line',
              data: {
                labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
                datasets: [{
                  label: '销售额',
                  data: [10000, 15000, 12000, 18000, 20000, 25000],
                  borderColor: 'blue',
                  backgroundColor: 'rgba(0, 0, 255, 0.1)',
                  tension: 0.4
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
                    text: '半年销售趋势'
                  }
                }
              }
            });
          }

          // 库存状况图表
          const inventoryCtx = document.getElementById('inventoryChart');
          if (inventoryCtx) {
            new Chart(inventoryCtx, {
              type: 'bar',
              data: {
                labels: ['iPhone 15', 'MacBook Pro', 'iPad Pro', 'AirPods Pro'],
                datasets: [
                  {
                    label: '当前库存',
                    data: [50, 20, 30, 100],
                    backgroundColor: 'rgba(54, 162, 235, 0.6)'
                  },
                  {
                    label: '最低库存',
                    data: [10, 5, 8, 20],
                    backgroundColor: 'rgba(255, 99, 132, 0.6)'
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
                  }
                }
              }
            });
          }

          // 财务分析图表
          const financialCtx = document.getElementById('financialChart');
          if (financialCtx) {
            new Chart(financialCtx, {
              type: 'bar',
              data: {
                labels: ['销售', '采购', '租金', '薪资', '其他'],
                datasets: [
                  {
                    label: '收入',
                    data: [50000, 0, 0, 0, 5000],
                    backgroundColor: 'rgba(75, 192, 192, 0.6)'
                  },
                  {
                    label: '支出',
                    data: [0, 15000, 5000, 10000, 3000],
                    backgroundColor: 'rgba(255, 99, 132, 0.6)'
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
                  }
                }
              }
            });
          }

          // 店铺销售对比图表
          const shopSalesCtx = document.getElementById('shopSalesChart');
          if (shopSalesCtx) {
            new Chart(shopSalesCtx, {
              type: 'pie',
              data: {
                labels: ['北京旗舰店', '上海分店', '广州分店'],
                datasets: [{
                  data: [30000, 20000, 15000],
                  backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 206, 86, 0.6)'
                  ]
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
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">报表分析</h1>

      {/* 销售趋势 */}
      <Card className="mb-6">
        <h2 className="text-xl font-bold mb-4">销售趋势</h2>
        <div className="p-4">
          <canvas id="salesChart" height="300"></canvas>
        </div>
      </Card>

      {/* 库存状况 */}
      <Card className="mb-6">
        <h2 className="text-xl font-bold mb-4">库存状况</h2>
        <div className="p-4">
          <canvas id="inventoryChart" height="300"></canvas>
        </div>
      </Card>

      {/* 财务分析 */}
      <Card className="mb-6">
        <h2 className="text-xl font-bold mb-4">财务分析</h2>
        <div className="p-4">
          <canvas id="financialChart" height="300"></canvas>
        </div>
      </Card>

      {/* 店铺销售对比 */}
      <Card className="mb-6">
        <h2 className="text-xl font-bold mb-4">店铺销售对比</h2>
        <div className="p-4">
          <canvas id="shopSalesChart" height="300"></canvas>
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
