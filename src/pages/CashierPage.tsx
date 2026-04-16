import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Input, Select, message, Modal, Form, InputNumber, Space, Divider, Typography } from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';
import { salesApi, productApi } from '../api';

const { Option } = Select;
const { Title, Text } = Typography;

interface Product {
  id: string;
  name: string;
  category: string;
  brand: string;
  model: string;
  price: number;
  stock: number;
  shopId: string;
  createdAt: string;
  updatedAt: string;
}

interface CartItem {
  product: Product;
  quantity: number;
  price: number;
  subtotal: number;
}

const CashierPage: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedShop, setSelectedShop] = useState<string>('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  const fetchProducts = async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    try {
      const response = await productApi.getAll({ shopId: selectedShop });
      setProducts(response.data);
    } catch (error) {
      message.error('获取商品列表失败');
      console.error('获取商品列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.shopId) {
      setSelectedShop(user.shopId);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (selectedShop) {
      fetchProducts();
    }
  }, [selectedShop]);

  const handleSearch = () => {
    // 实现搜索逻辑
    fetchProducts();
  };

  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.id === product.id);
      if (existingItem) {
        return prevCart.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.price } 
            : item
        );
      } else {
        return [...prevCart, {
          product,
          quantity: 1,
          price: product.price,
          subtotal: product.price
        }];
      }
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCart(prevCart => 
      prevCart.map(item => 
        item.product.id === productId 
          ? { ...item, quantity, subtotal: quantity * item.price } 
          : item
      )
    );
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.subtotal, 0);
  };

  const handleCheckout = async () => {
    if (!isAuthenticated || cart.length === 0) return;
    
    try {
      const items = cart.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        price: item.price
      }));
      
      await salesApi.create({
        shopId: selectedShop,
        items,
        status: 'completed'
      });
      
      message.success('收银成功');
      setCart([]);
      fetchProducts(); // 刷新商品库存
    } catch (error) {
      message.error('收银失败');
      console.error('收银失败:', error);
    }
  };

  const columns = [
    {
      title: '商品名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '品牌',
      dataIndex: 'brand',
      key: 'brand',
    },
    {
      title: '型号',
      dataIndex: 'model',
      key: 'model',
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => `¥${price.toFixed(2)}`,
    },
    {
      title: '库存',
      dataIndex: 'stock',
      key: 'stock',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, product: Product) => (
        <Button
          type="primary"
          icon={<ShoppingCartOutlined />}
          size="small"
          onClick={() => addToCart(product)}
        >
          加入购物车
        </Button>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', gap: 20, height: 'calc(100vh - 120px)' }}>
      {/* 商品列表 */}
      <Card
        title="商品列表"
        extra={
          <div style={{ display: 'flex', gap: 8 }}>
            <Input
              placeholder="搜索商品"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 200 }}
            />
            <Select
              placeholder="选择店铺"
              value={selectedShop}
              onChange={setSelectedShop}
              style={{ width: 150 }}
            >
              {/* 这里应该从shopApi获取店铺列表，暂时使用空选项 */}
            </Select>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchProducts}
            >
              刷新
            </Button>
          </div>
        }
        style={{ flex: 1, overflow: 'auto' }}
      >
        <Table
          columns={columns}
          dataSource={products}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
        />
      </Card>

      {/* 购物车 */}
      <Card
        title="购物车"
        style={{ width: 400, display: 'flex', flexDirection: 'column' }}
      >
        {cart.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <ShoppingCartOutlined style={{ fontSize: 48, color: '#ccc' }} />
            <p style={{ marginTop: 16, color: '#999' }}>购物车为空</p>
          </div>
        ) : (
          <>
            <div style={{ flex: 1, overflow: 'auto' }}>
              {cart.map((item, index) => (
                <div key={item.product.id} style={{ marginBottom: 16, padding: 16, border: '1px solid #e8e8e8', borderRadius: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div>
                      <Text strong>{item.product.name}</Text>
                      <Text style={{ marginLeft: 8, color: '#999' }}>{item.product.brand} {item.product.model}</Text>
                    </div>
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      size="small"
                      onClick={() => removeFromCart(item.product.id)}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text>¥{item.price.toFixed(2)}</Text>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Button
                        size="small"
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      >
                        -
                      </Button>
                      <InputNumber
                        min={1}
                        value={item.quantity}
                        onChange={(value) => updateQuantity(item.product.id, value || 1)}
                        style={{ width: 60 }}
                      />
                      <Button
                        size="small"
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      >
                        +
                      </Button>
                      <Text strong>¥{item.subtotal.toFixed(2)}</Text>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Divider />
            <div style={{ padding: '16px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <Text strong>合计:</Text>
                <Text strong style={{ fontSize: 18, color: '#f5222d' }}>¥{calculateTotal().toFixed(2)}</Text>
              </div>
              <Button
                type="primary"
                size="large"
                block
                onClick={handleCheckout}
              >
                收银
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default CashierPage;