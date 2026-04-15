import React from 'react';
import { Layout, Menu, Button } from 'antd';
import { Link, Routes, Route } from 'react-router-dom';
import { HomeOutlined, ShopOutlined, ProductOutlined, StockOutlined, ShoppingOutlined, DollarOutlined, BarChartOutlined, UserOutlined } from '@ant-design/icons';

const { Header, Content, Sider } = Layout;

const App: React.FC = () => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#001529' }}>
        <div style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>多门店 ERP 系统</div>
        <div>
          <Button type="primary" style={{ marginRight: 8 }}>登录</Button>
          <Button>注册</Button>
        </div>
      </Header>
      <Layout>
        <Sider width={200} style={{ backgroundColor: '#f0f2f5' }}>
          <Menu
            mode="inline"
            style={{ height: '100%', borderRight: 0 }}
            items={[
              { key: '1', icon: <HomeOutlined />, label: <Link to="/">首页</Link> },
              { key: '2', icon: <ShopOutlined />, label: <Link to="/shops">店铺管理</Link> },
              { key: '3', icon: <ProductOutlined />, label: <Link to="/products">商品管理</Link> },
              { key: '4', icon: <StockOutlined />, label: <Link to="/inventory">库存管理</Link> },
              { key: '5', icon: <ShoppingOutlined />, label: <Link to="/sales">销售管理</Link> },
              { key: '6', icon: <DollarOutlined />, label: <Link to="/financial">财务管理</Link> },
              { key: '7', icon: <BarChartOutlined />, label: <Link to="/reports">报表分析</Link> },
              { key: '8', icon: <UserOutlined />, label: <Link to="/users">用户管理</Link> },
            ]}
          />
        </Sider>
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
      <h1 className="text-2xl font-bold mb-4">欢迎使用多门店 ERP 系统</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-100 p-4 rounded-lg">
          <h3 className="font-bold">总店铺数</h3>
          <p className="text-2xl">10</p>
        </div>
        <div className="bg-green-100 p-4 rounded-lg">
          <h3 className="font-bold">总商品数</h3>
          <p className="text-2xl">1000</p>
        </div>
        <div className="bg-yellow-100 p-4 rounded-lg">
          <h3 className="font-bold">今日销售额</h3>
          <p className="text-2xl">¥10,000</p>
        </div>
        <div className="bg-red-100 p-4 rounded-lg">
          <h3 className="font-bold">库存总量</h3>
          <p className="text-2xl">5000</p>
        </div>
      </div>
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
  const [formData, setFormData] = React.useState<any>({});

  const showModal = (shop?: any) => {
    if (shop) {
      setEditingShop(shop);
      setFormData(shop);
    } else {
      setEditingShop(null);
      setFormData({});
    }
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const handleOk = () => {
    if (editingShop) {
      setShops(shops.map(shop => shop.id === editingShop.id ? { ...shop, ...formData } : shop));
    } else {
      setShops([...shops, { id: String(shops.length + 1), ...formData }]);
    }
    setIsModalOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDelete = (id: string) => {
    setShops(shops.filter(shop => shop.id !== id));
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
        <div>
          <button className="mr-2 text-blue-500" onClick={() => showModal(record)}>编辑</button>
          <button className="text-red-500" onClick={() => handleDelete(record.id)}>删除</button>
        </div>
      ) 
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">店铺管理</h1>
        <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={() => showModal()}>添加店铺</button>
      </div>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">店铺名称</th>
            <th className="border p-2">地址</th>
            <th className="border p-2">电话</th>
            <th className="border p-2">负责人</th>
            <th className="border p-2">操作</th>
          </tr>
        </thead>
        <tbody>
          {shops.map(shop => (
            <tr key={shop.id}>
              <td className="border p-2">{shop.name}</td>
              <td className="border p-2">{shop.address}</td>
              <td className="border p-2">{shop.phone}</td>
              <td className="border p-2">{shop.manager}</td>
              <td className="border p-2">
                <button className="mr-2 text-blue-500" onClick={() => showModal(shop)}>编辑</button>
                <button className="text-red-500" onClick={() => handleDelete(shop.id)}>删除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* 模态框 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold mb-4">{editingShop ? '编辑店铺' : '添加店铺'}</h2>
            <form>
              <div className="mb-4">
                <label className="block mb-2">店铺名称</label>
                <input 
                  type="text" 
                  className="w-full p-2 border" 
                  name="name" 
                  value={formData.name || ''} 
                  onChange={handleInputChange} 
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2">地址</label>
                <input 
                  type="text" 
                  className="w-full p-2 border" 
                  name="address" 
                  value={formData.address || ''} 
                  onChange={handleInputChange} 
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2">电话</label>
                <input 
                  type="text" 
                  className="w-full p-2 border" 
                  name="phone" 
                  value={formData.phone || ''} 
                  onChange={handleInputChange} 
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2">负责人</label>
                <input 
                  type="text" 
                  className="w-full p-2 border" 
                  name="manager" 
                  value={formData.manager || ''} 
                  onChange={handleInputChange} 
                />
              </div>
              <div className="flex justify-end">
                <button type="button" className="mr-2 px-4 py-2 border" onClick={handleCancel}>取消</button>
                <button type="button" className="px-4 py-2 bg-blue-500 text-white" onClick={handleOk}>确定</button>
              </div>
            </form>
          </div>
        </div>
      )}
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
  const [formData, setFormData] = React.useState<any>({});

  const showModal = (product?: any) => {
    if (product) {
      setEditingProduct(product);
      setFormData(product);
    } else {
      setEditingProduct(null);
      setFormData({});
    }
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const handleOk = () => {
    if (editingProduct) {
      setProducts(products.map(product => product.id === editingProduct.id ? { ...product, ...formData } : product));
    } else {
      setProducts([...products, { id: String(products.length + 1), ...formData }]);
    }
    setIsModalOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'price' || name === 'costPrice' || name === 'stock' ? Number(value) : value }));
  };

  const handleDelete = (id: string) => {
    setProducts(products.filter(product => product.id !== id));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">商品管理</h1>
        <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={() => showModal()}>添加商品</button>
      </div>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">商品名称</th>
            <th className="border p-2">分类</th>
            <th className="border p-2">品牌</th>
            <th className="border p-2">型号</th>
            <th className="border p-2">价格</th>
            <th className="border p-2">成本价</th>
            <th className="border p-2">库存</th>
            <th className="border p-2">所属店铺</th>
            <th className="border p-2">操作</th>
          </tr>
        </thead>
        <tbody>
          {products.map(product => (
            <tr key={product.id}>
              <td className="border p-2">{product.name}</td>
              <td className="border p-2">{product.category}</td>
              <td className="border p-2">{product.brand}</td>
              <td className="border p-2">{product.model}</td>
              <td className="border p-2">¥{product.price}</td>
              <td className="border p-2">¥{product.costPrice}</td>
              <td className="border p-2">{product.stock}</td>
              <td className="border p-2">{product.shopId}</td>
              <td className="border p-2">
                <button className="mr-2 text-blue-500" onClick={() => showModal(product)}>编辑</button>
                <button className="text-red-500" onClick={() => handleDelete(product.id)}>删除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* 模态框 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold mb-4">{editingProduct ? '编辑商品' : '添加商品'}</h2>
            <form>
              <div className="mb-4">
                <label className="block mb-2">商品名称</label>
                <input 
                  type="text" 
                  className="w-full p-2 border" 
                  name="name" 
                  value={formData.name || ''} 
                  onChange={handleInputChange} 
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2">分类</label>
                <input 
                  type="text" 
                  className="w-full p-2 border" 
                  name="category" 
                  value={formData.category || ''} 
                  onChange={handleInputChange} 
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2">品牌</label>
                <input 
                  type="text" 
                  className="w-full p-2 border" 
                  name="brand" 
                  value={formData.brand || ''} 
                  onChange={handleInputChange} 
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2">型号</label>
                <input 
                  type="text" 
                  className="w-full p-2 border" 
                  name="model" 
                  value={formData.model || ''} 
                  onChange={handleInputChange} 
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2">价格</label>
                <input 
                  type="number" 
                  className="w-full p-2 border" 
                  name="price" 
                  value={formData.price || ''} 
                  onChange={handleInputChange} 
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2">成本价</label>
                <input 
                  type="number" 
                  className="w-full p-2 border" 
                  name="costPrice" 
                  value={formData.costPrice || ''} 
                  onChange={handleInputChange} 
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2">库存</label>
                <input 
                  type="number" 
                  className="w-full p-2 border" 
                  name="stock" 
                  value={formData.stock || ''} 
                  onChange={handleInputChange} 
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2">所属店铺</label>
                <input 
                  type="text" 
                  className="w-full p-2 border" 
                  name="shopId" 
                  value={formData.shopId || ''} 
                  onChange={handleInputChange} 
                />
              </div>
              <div className="flex justify-end">
                <button type="button" className="mr-2 px-4 py-2 border" onClick={handleCancel}>取消</button>
                <button type="button" className="px-4 py-2 bg-blue-500 text-white" onClick={handleOk}>确定</button>
              </div>
            </form>
          </div>
        </div>
      )}
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
  const [formData, setFormData] = React.useState<any>({});

  const showModal = () => {
    setFormData({});
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const handleOk = () => {
    // 处理库存调整
    if (formData.type === 'in') {
      setInventory(inventory.map(item => 
        item.productId === formData.productId ? 
        { ...item, currentStock: item.currentStock + formData.quantity } : item
      ));
    } else {
      setInventory(inventory.map(item => 
        item.productId === formData.productId ? 
        { ...item, currentStock: Math.max(0, item.currentStock - formData.quantity) } : item
      ));
    }
    
    // 添加库存变动记录
    const newLog = {
      id: String(inventoryLogs.length + 1),
      productId: formData.productId,
      productName: inventory.find(item => item.productId === formData.productId)?.productName || '',
      quantity: formData.quantity,
      type: formData.type,
      reason: formData.reason,
      shopId: formData.shopId,
      createdAt: new Date().toLocaleString('zh-CN'),
    };
    setInventoryLogs([...inventoryLogs, newLog]);
    setIsModalOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'quantity' ? Number(value) : value }));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">库存管理</h1>
        <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={showModal}>调整库存</button>
      </div>

      {/* 库存预警 */}
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">库存预警</h2>
        <div className="bg-yellow-50 p-4 rounded-lg">
          {inventory.filter(item => item.currentStock <= item.minStock).length > 0 ? (
            <ul>
              {inventory.filter(item => item.currentStock <= item.minStock).map(item => (
                <li key={item.id} className="text-red-500">
                  {item.productName} 库存不足，当前库存: {item.currentStock}，最低库存: {item.minStock}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-green-500">所有商品库存正常</p>
          )}
        </div>
      </div>

      {/* 库存列表 */}
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">库存列表</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">商品名称</th>
              <th className="border p-2">当前库存</th>
              <th className="border p-2">最低库存</th>
              <th className="border p-2">所属店铺</th>
              <th className="border p-2">状态</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map(item => (
              <tr key={item.id}>
                <td className="border p-2">{item.productName}</td>
                <td className="border p-2">{item.currentStock}</td>
                <td className="border p-2">{item.minStock}</td>
                <td className="border p-2">{item.shopId}</td>
                <td className="border p-2">
                  <span className={item.currentStock <= item.minStock ? 'text-red-500' : 'text-green-500'}>
                    {item.currentStock <= item.minStock ? '库存不足' : '库存正常'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 库存变动记录 */}
      <div>
        <h2 className="text-xl font-bold mb-2">库存变动记录</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">商品名称</th>
              <th className="border p-2">变动数量</th>
              <th className="border p-2">变动类型</th>
              <th className="border p-2">变动原因</th>
              <th className="border p-2">所属店铺</th>
              <th className="border p-2">变动时间</th>
            </tr>
          </thead>
          <tbody>
            {inventoryLogs.map(log => (
              <tr key={log.id}>
                <td className="border p-2">{log.productName}</td>
                <td className={`border p-2 ${log.type === 'in' ? 'text-green-500' : 'text-red-500'}`}>
                  {log.type === 'in' ? '+' : '-'}{log.quantity}
                </td>
                <td className="border p-2">{log.type === 'in' ? '入库' : '出库'}</td>
                <td className="border p-2">{log.reason}</td>
                <td className="border p-2">{log.shopId}</td>
                <td className="border p-2">{log.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 调整库存模态框 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold mb-4">调整库存</h2>
            <form>
              <div className="mb-4">
                <label className="block mb-2">商品</label>
                <select 
                  className="w-full p-2 border" 
                  name="productId" 
                  value={formData.productId || ''} 
                  onChange={handleInputChange}
                >
                  <option value="">请选择商品</option>
                  {inventory.map(item => (
                    <option key={item.id} value={item.productId}>{item.productName}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block mb-2">变动类型</label>
                <select 
                  className="w-full p-2 border" 
                  name="type" 
                  value={formData.type || ''} 
                  onChange={handleInputChange}
                >
                  <option value="">请选择类型</option>
                  <option value="in">入库</option>
                  <option value="out">出库</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block mb-2">变动数量</label>
                <input 
                  type="number" 
                  className="w-full p-2 border" 
                  name="quantity" 
                  value={formData.quantity || ''} 
                  onChange={handleInputChange} 
                  min="1"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2">变动原因</label>
                <input 
                  type="text" 
                  className="w-full p-2 border" 
                  name="reason" 
                  value={formData.reason || ''} 
                  onChange={handleInputChange} 
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2">所属店铺</label>
                <input 
                  type="text" 
                  className="w-full p-2 border" 
                  name="shopId" 
                  value={formData.shopId || ''} 
                  onChange={handleInputChange} 
                />
              </div>
              <div className="flex justify-end">
                <button type="button" className="mr-2 px-4 py-2 border" onClick={handleCancel}>取消</button>
                <button type="button" className="px-4 py-2 bg-blue-500 text-white" onClick={handleOk}>确定</button>
              </div>
            </form>
          </div>
        </div>
      )}
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
  const [formData, setFormData] = React.useState<any>({ items: [{ productId: '', productName: '', quantity: 1, price: 0 }] });

  const showModal = () => {
    setFormData({ shopId: '', items: [{ productId: '', productName: '', quantity: 1, price: 0 }] });
    setIsModalOpen(true);
  };

  const showDetail = (order: any) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setIsDetailOpen(false);
  };

  const handleOk = () => {
    // 计算总金额
    const totalAmount = formData.items.reduce((sum: number, item: any) => sum + item.quantity * item.price, 0);
    
    // 创建新订单
    const newOrder = {
      id: String(orders.length + 1),
      shopId: formData.shopId,
      totalAmount,
      status: 'pending',
      createdAt: new Date().toLocaleString('zh-CN'),
      items: formData.items,
    };
    
    setOrders([...orders, newOrder]);
    setIsModalOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, index?: number) => {
    const { name, value } = e.target;
    if (index !== undefined) {
      // 处理商品项的变化
      setFormData(prev => {
        const newItems = [...prev.items];
        newItems[index] = {
          ...newItems[index],
          [name]: name === 'quantity' || name === 'price' ? Number(value) : value
        };
        return { ...prev, items: newItems };
      });
    } else {
      // 处理订单级别的变化
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { productId: '', productName: '', quantity: 1, price: 0 }]
    }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateStatus = (id: string, status: string) => {
    setOrders(orders.map(order => order.id === id ? { ...order, status } : order));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">销售管理</h1>
        <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={showModal}>添加订单</button>
      </div>

      {/* 销售订单列表 */}
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">订单号</th>
            <th className="border p-2">店铺</th>
            <th className="border p-2">总金额</th>
            <th className="border p-2">状态</th>
            <th className="border p-2">创建时间</th>
            <th className="border p-2">操作</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order.id}>
              <td className="border p-2">{order.id}</td>
              <td className="border p-2">{order.shopId}</td>
              <td className="border p-2">¥{order.totalAmount}</td>
              <td className="border p-2">
                <span className={
                  order.status === 'completed' ? 'text-green-500' :
                  order.status === 'pending' ? 'text-yellow-500' :
                  'text-red-500'
                }>
                  {order.status === 'completed' ? '已完成' :
                   order.status === 'pending' ? '待处理' :
                   '已取消'}
                </span>
              </td>
              <td className="border p-2">{order.createdAt}</td>
              <td className="border p-2">
                <button className="mr-2 text-blue-500" onClick={() => showDetail(order)}>详情</button>
                {order.status === 'pending' && (
                  <>
                    <button className="mr-2 text-green-500" onClick={() => updateStatus(order.id, 'completed')}>完成</button>
                    <button className="text-red-500" onClick={() => updateStatus(order.id, 'cancelled')}>取消</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 添加订单模态框 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold mb-4">添加订单</h2>
            <form>
              <div className="mb-4">
                <label className="block mb-2">店铺</label>
                <input 
                  type="text" 
                  className="w-full p-2 border" 
                  name="shopId" 
                  value={formData.shopId || ''} 
                  onChange={handleInputChange} 
                />
              </div>
              
              <div className="mb-4">
                <label className="block mb-2">商品列表</label>
                {formData.items.map((item: any, index: number) => (
                  <div key={index} className="mb-2 p-2 border rounded">
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div>
                        <label className="block mb-1">商品名称</label>
                        <input 
                          type="text" 
                          className="w-full p-1 border" 
                          name="productName" 
                          value={item.productName || ''} 
                          onChange={(e) => handleInputChange(e, index)} 
                        />
                      </div>
                      <div>
                        <label className="block mb-1">商品ID</label>
                        <input 
                          type="text" 
                          className="w-full p-1 border" 
                          name="productId" 
                          value={item.productId || ''} 
                          onChange={(e) => handleInputChange(e, index)} 
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block mb-1">数量</label>
                        <input 
                          type="number" 
                          className="w-full p-1 border" 
                          name="quantity" 
                          value={item.quantity || ''} 
                          onChange={(e) => handleInputChange(e, index)} 
                          min="1"
                        />
                      </div>
                      <div>
                        <label className="block mb-1">单价</label>
                        <input 
                          type="number" 
                          className="w-full p-1 border" 
                          name="price" 
                          value={item.price || ''} 
                          onChange={(e) => handleInputChange(e, index)} 
                          min="0"
                        />
                      </div>
                    </div>
                    <button 
                      type="button" 
                      className="mt-2 text-red-500 text-sm" 
                      onClick={() => removeItem(index)}
                    >
                      删除商品
                    </button>
                  </div>
                ))}
                <button type="button" className="mt-2 text-blue-500" onClick={addItem}>
                  添加商品
                </button>
              </div>
              
              <div className="flex justify-end">
                <button type="button" className="mr-2 px-4 py-2 border" onClick={handleCancel}>取消</button>
                <button type="button" className="px-4 py-2 bg-blue-500 text-white" onClick={handleOk}>确定</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 订单详情模态框 */}
      {isDetailOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold mb-4">订单详情</h2>
            <div className="mb-4">
              <p><strong>订单号:</strong> {selectedOrder.id}</p>
              <p><strong>店铺:</strong> {selectedOrder.shopId}</p>
              <p><strong>总金额:</strong> ¥{selectedOrder.totalAmount}</p>
              <p><strong>状态:</strong> {selectedOrder.status === 'completed' ? '已完成' : selectedOrder.status === 'pending' ? '待处理' : '已取消'}</p>
              <p><strong>创建时间:</strong> {selectedOrder.createdAt}</p>
            </div>
            <div>
              <h3 className="font-bold mb-2">商品列表</h3>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-1">商品名称</th>
                    <th className="border p-1">数量</th>
                    <th className="border p-1">单价</th>
                    <th className="border p-1">小计</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items.map((item: any, index: number) => (
                    <tr key={index}>
                      <td className="border p-1">{item.productName}</td>
                      <td className="border p-1">{item.quantity}</td>
                      <td className="border p-1">¥{item.price}</td>
                      <td className="border p-1">¥{item.quantity * item.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex justify-end">
              <button type="button" className="px-4 py-2 border" onClick={handleCancel}>关闭</button>
            </div>
          </div>
        </div>
      )}
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
  const [formData, setFormData] = React.useState<any>({});

  // 计算收支统计
  const incomeTotal = financialRecords.filter(record => record.type === 'income').reduce((sum, record) => sum + record.amount, 0);
  const expenseTotal = financialRecords.filter(record => record.type === 'expense').reduce((sum, record) => sum + record.amount, 0);
  const netProfit = incomeTotal - expenseTotal;

  const showModal = () => {
    setFormData({});
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const handleOk = () => {
    const newRecord = {
      id: String(financialRecords.length + 1),
      ...formData,
      createdAt: new Date().toLocaleString('zh-CN'),
    };
    setFinancialRecords([...financialRecords, newRecord]);
    setIsModalOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'amount' ? Number(value) : value }));
  };

  const handleDelete = (id: string) => {
    setFinancialRecords(financialRecords.filter(record => record.id !== id));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">财务管理</h1>
        <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={showModal}>添加记录</button>
      </div>

      {/* 收支统计 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-green-100 p-4 rounded-lg">
          <h3 className="font-bold">总收入</h3>
          <p className="text-2xl">¥{incomeTotal}</p>
        </div>
        <div className="bg-red-100 p-4 rounded-lg">
          <h3 className="font-bold">总支出</h3>
          <p className="text-2xl">¥{expenseTotal}</p>
        </div>
        <div className="bg-blue-100 p-4 rounded-lg">
          <h3 className="font-bold">净利润</h3>
          <p className="text-2xl">¥{netProfit}</p>
        </div>
      </div>

      {/* 财务记录列表 */}
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">记录ID</th>
            <th className="border p-2">店铺</th>
            <th className="border p-2">金额</th>
            <th className="border p-2">类型</th>
            <th className="border p-2">分类</th>
            <th className="border p-2">描述</th>
            <th className="border p-2">创建时间</th>
            <th className="border p-2">操作</th>
          </tr>
        </thead>
        <tbody>
          {financialRecords.map(record => (
            <tr key={record.id}>
              <td className="border p-2">{record.id}</td>
              <td className="border p-2">{record.shopId}</td>
              <td className={`border p-2 ${record.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                {record.type === 'income' ? '+' : '-'}{record.amount}
              </td>
              <td className="border p-2">{record.type === 'income' ? '收入' : '支出'}</td>
              <td className="border p-2">{record.category}</td>
              <td className="border p-2">{record.description}</td>
              <td className="border p-2">{record.createdAt}</td>
              <td className="border p-2">
                <button className="text-red-500" onClick={() => handleDelete(record.id)}>删除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 添加财务记录模态框 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold mb-4">添加财务记录</h2>
            <form>
              <div className="mb-4">
                <label className="block mb-2">店铺</label>
                <input 
                  type="text" 
                  className="w-full p-2 border" 
                  name="shopId" 
                  value={formData.shopId || ''} 
                  onChange={handleInputChange} 
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2">金额</label>
                <input 
                  type="number" 
                  className="w-full p-2 border" 
                  name="amount" 
                  value={formData.amount || ''} 
                  onChange={handleInputChange} 
                  min="0"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2">类型</label>
                <select 
                  className="w-full p-2 border" 
                  name="type" 
                  value={formData.type || ''} 
                  onChange={handleInputChange}
                >
                  <option value="">请选择类型</option>
                  <option value="income">收入</option>
                  <option value="expense">支出</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block mb-2">分类</label>
                <input 
                  type="text" 
                  className="w-full p-2 border" 
                  name="category" 
                  value={formData.category || ''} 
                  onChange={handleInputChange} 
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2">描述</label>
                <input 
                  type="text" 
                  className="w-full p-2 border" 
                  name="description" 
                  value={formData.description || ''} 
                  onChange={handleInputChange} 
                />
              </div>
              <div className="flex justify-end">
                <button type="button" className="mr-2 px-4 py-2 border" onClick={handleCancel}>取消</button>
                <button type="button" className="px-4 py-2 bg-blue-500 text-white" onClick={handleOk}>确定</button>
              </div>
            </form>
          </div>
        </div>
      )}
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
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">销售趋势</h2>
        <div className="bg-white p-4 rounded-lg shadow">
          <canvas id="salesChart" height="300"></canvas>
        </div>
      </div>

      {/* 库存状况 */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">库存状况</h2>
        <div className="bg-white p-4 rounded-lg shadow">
          <canvas id="inventoryChart" height="300"></canvas>
        </div>
      </div>

      {/* 财务分析 */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">财务分析</h2>
        <div className="bg-white p-4 rounded-lg shadow">
          <canvas id="financialChart" height="300"></canvas>
        </div>
      </div>

      {/* 店铺销售对比 */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">店铺销售对比</h2>
        <div className="bg-white p-4 rounded-lg shadow">
          <canvas id="shopSalesChart" height="300"></canvas>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-blue-100 p-4 rounded-lg">
          <h3 className="font-bold">总销售额</h3>
          <p className="text-2xl">¥65,000</p>
        </div>
        <div className="bg-green-100 p-4 rounded-lg">
          <h3 className="font-bold">总利润</h3>
          <p className="text-2xl">¥22,000</p>
        </div>
        <div className="bg-yellow-100 p-4 rounded-lg">
          <h3 className="font-bold">总订单数</h3>
          <p className="text-2xl">150</p>
        </div>
        <div className="bg-red-100 p-4 rounded-lg">
          <h3 className="font-bold">库存总量</h3>
          <p className="text-2xl">200</p>
        </div>
      </div>

      {/* 图表初始化将在组件挂载后通过 useEffect 实现 */}
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
  const [formData, setFormData] = React.useState<any>({});

  const showModal = (user?: any) => {
    if (user) {
      setEditingUser(user);
      setFormData(user);
    } else {
      setEditingUser(null);
      setFormData({});
    }
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const handleOk = () => {
    if (editingUser) {
      setUsers(users.map(user => user.id === editingUser.id ? { ...user, ...formData } : user));
    } else {
      setUsers([...users, { id: String(users.length + 1), ...formData, createdAt: new Date().toLocaleString('zh-CN') }]);
    }
    setIsModalOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDelete = (id: string) => {
    setUsers(users.filter(user => user.id !== id));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">用户管理</h1>
        <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={() => showModal()}>添加用户</button>
      </div>

      {/* 用户列表 */}
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">用户ID</th>
            <th className="border p-2">用户名</th>
            <th className="border p-2">角色</th>
            <th className="border p-2">所属店铺</th>
            <th className="border p-2">创建时间</th>
            <th className="border p-2">操作</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td className="border p-2">{user.id}</td>
              <td className="border p-2">{user.username}</td>
              <td className="border p-2">
                <span className={
                  user.role === 'admin' ? 'text-red-500' :
                  user.role === 'manager' ? 'text-blue-500' :
                  'text-green-500'
                }>
                  {user.role === 'admin' ? '管理员' :
                   user.role === 'manager' ? '店长' :
                   '员工'}
                </span>
              </td>
              <td className="border p-2">{user.shopId || '全部店铺'}</td>
              <td className="border p-2">{user.createdAt}</td>
              <td className="border p-2">
                <button className="mr-2 text-blue-500" onClick={() => showModal(user)}>编辑</button>
                <button className="text-red-500" onClick={() => handleDelete(user.id)}>删除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 添加/编辑用户模态框 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold mb-4">{editingUser ? '编辑用户' : '添加用户'}</h2>
            <form>
              <div className="mb-4">
                <label className="block mb-2">用户名</label>
                <input 
                  type="text" 
                  className="w-full p-2 border" 
                  name="username" 
                  value={formData.username || ''} 
                  onChange={handleInputChange} 
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2">角色</label>
                <select 
                  className="w-full p-2 border" 
                  name="role" 
                  value={formData.role || ''} 
                  onChange={handleInputChange}
                >
                  <option value="">请选择角色</option>
                  <option value="admin">管理员</option>
                  <option value="manager">店长</option>
                  <option value="staff">员工</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block mb-2">所属店铺</label>
                <input 
                  type="text" 
                  className="w-full p-2 border" 
                  name="shopId" 
                  value={formData.shopId || ''} 
                  onChange={handleInputChange} 
                  placeholder="留空表示全部店铺"
                />
              </div>
              <div className="flex justify-end">
                <button type="button" className="mr-2 px-4 py-2 border" onClick={handleCancel}>取消</button>
                <button type="button" className="px-4 py-2 bg-blue-500 text-white" onClick={handleOk}>确定</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
