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
  return <h1>店铺管理页面</h1>;
};

const ProductPage: React.FC = () => {
  return <h1>商品管理页面</h1>;
};

const InventoryPage: React.FC = () => {
  return <h1>库存管理页面</h1>;
};

const SalesPage: React.FC = () => {
  return <h1>销售管理页面</h1>;
};

const FinancialPage: React.FC = () => {
  return <h1>财务管理页面</h1>;
};

const ReportPage: React.FC = () => {
  return <h1>报表分析页面</h1>;
};

const UserPage: React.FC = () => {
  return <h1>用户管理页面</h1>;
};

export default App;
