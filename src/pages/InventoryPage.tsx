import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Button, Space, Statistic, Row, Col, Modal, Form, Input, Select, message, Tabs } from 'antd';
import { StockOutlined, WarningOutlined, CheckCircleOutlined, InboxOutlined, ExportOutlined, HistoryOutlined } from '@ant-design/icons';
import { inventoryApi, productApi, shopApi } from '../api';
import { useAuthStore } from '../store/authStore';
import type { InventoryLog } from '../api';

const InventoryPage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [shops, setShops] = useState<any[]>([]);
  const [adjustModalVisible, setAdjustModalVisible] = useState(false);
  const [adjustForm] = Form.useForm();
  const [adjustType, setAdjustType] = useState<'in' | 'out'>('in');
  const [logsModalVisible, setLogsModalVisible] = useState(false);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  const fetchData = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const response = await inventoryApi.getAll();
      setProducts(response.data || []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchShops = async () => {
    try {
      const response = await shopApi.getAllSimple();
      setShops(response.data || []);
    } catch (error) {
      console.error('Error fetching shops:', error);
    }
  };

  useEffect(() => {
    fetchData();
    fetchShops();
  }, [isAuthenticated]);

  const lowStockProducts = products.filter(p => Number(p.stock) <= 10);
  const totalStock = products.reduce((sum, p) => sum + Number(p.stock), 0);
  const totalValue = products.reduce((sum, p) => sum + Number(p.price) * Number(p.stock), 0);

  const handleAdjustment = async (values: any) => {
    try {
      await inventoryApi.adjust({
        productId: values.productId,
        quantity: values.quantity,
        type: adjustType,
        reason: values.reason,
        shopId: values.shopId
      });
      message.success(`${adjustType === 'in' ? '入库' : '出库'}操作成功`);
      setAdjustModalVisible(false);
      adjustForm.resetFields();
      fetchData();
    } catch (error) {
      message.error(`${adjustType === 'in' ? '入库' : '出库'}操作失败`);
    }
  };

  const fetchLogs = async (productId: string) => {
    setLogsLoading(true);
    try {
      const response = await inventoryApi.getLogs({ productId });
      setLogs(response.data || []);
      setSelectedProductId(productId);
      setLogsModalVisible(true);
    } catch (error) {
      console.error('Error fetching logs:', error);
      message.error('获取库存日志失败');
    } finally {
      setLogsLoading(false);
    }
  };

  const columns = [
    {
      title: '商品名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <span style={{ fontWeight: 500 }}>{name}</span>,
    },
    {
      title: '品牌',
      dataIndex: 'brand',
      key: 'brand',
      render: (brand: any) => brand?.name || brand || '',
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (category: any) => <Tag color="blue">{category?.name || category || ''}</Tag>,
    },
    {
      title: '当前库存',
      dataIndex: 'stock',
      key: 'stock',
      render: (stock: number) => {
        const num = Number(stock);
        return (
          <Tag color={num > 20 ? 'green' : num > 10 ? 'orange' : 'red'}>
            {num}
          </Tag>
        );
      },
    },
    {
      title: '预警状态',
      key: 'alert',
      render: (_: any, record: any) => {
        const stock = Number(record.stock);
        if (stock <= 5) {
          return <Tag icon={<WarningOutlined />} color="red">库存告急</Tag>;
        } else if (stock <= 10) {
          return <Tag icon={<WarningOutlined />} color="orange">库存偏低</Tag>;
        } else {
          return <Tag icon={<CheckCircleOutlined />} color="green">库存充足</Tag>;
        }
      },
    },
    {
      title: '最低库存',
      dataIndex: 'minStock',
      key: 'minStock',
    },
    {
      title: '单价',
      dataIndex: 'price',
      key: 'price',
      render: (price: string) => <span style={{ color: '#cf1322' }}>¥{price}</span>,
    },
    {
      title: '库存价值',
      key: 'value',
      render: (_: any, record: any) => (
        <span style={{ color: '#3f8600', fontWeight: 500 }}>
          ¥{(Number(record.price) * Number(record.stock)).toFixed(2)}
        </span>
      ),
    },
    {
      title: '店铺',
      dataIndex: ['shop', 'name'],
      key: 'shop',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button 
            type="primary" 
            icon={<InboxOutlined />} 
            onClick={() => {
              setAdjustType('in');
              adjustForm.setFieldsValue({ productId: record.id, shopId: record.shopId });
              setAdjustModalVisible(true);
            }}
          >
            入库
          </Button>
          <Button 
            danger 
            icon={<ExportOutlined />} 
            onClick={() => {
              setAdjustType('out');
              adjustForm.setFieldsValue({ productId: record.id, shopId: record.shopId });
              setAdjustModalVisible(true);
            }}
          >
            出库
          </Button>
          <Button 
            icon={<HistoryOutlined />} 
            onClick={() => fetchLogs(record.id)}
          >
            查看日志
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="商品种类"
              value={products.length}
              prefix={<StockOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="库存总数"
              value={totalStock}
              prefix={<StockOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="库存价值"
              value={totalValue}
              precision={2}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="预警商品"
              value={lowStockProducts.length}
              valueStyle={{ color: lowStockProducts.length > 0 ? '#cf1322' : '#52c41a' }}
              prefix={lowStockProducts.length > 0 ? <WarningOutlined /> : <CheckCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card title="库存管理" extra={<div>共 {products.length} 个商品</div>}>
        <Table
          columns={columns}
          dataSource={products}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={adjustType === 'in' ? '商品入库' : '商品出库'}
        open={adjustModalVisible}
        onCancel={() => setAdjustModalVisible(false)}
        footer={null}
      >
        <Form
          form={adjustForm}
          layout="vertical"
          onFinish={handleAdjustment}
        >
          <Form.Item
            name="productId"
            label="商品"
            rules={[{ required: true, message: '请选择商品' }]}
          >
            <Select placeholder="选择商品">
              {products.map(product => (
                <Select.Option key={product.id} value={product.id}>
                  {product.name} - {product.brand?.name || ''} - {product.category?.name || ''}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="shopId"
            label="店铺"
            rules={[{ required: true, message: '请选择店铺' }]}
          >
            <Select placeholder="选择店铺">
              {shops.map(shop => (
                <Select.Option key={shop.id} value={shop.id}>
                  {shop.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="quantity"
            label="数量"
            rules={[{ required: true, message: '请输入数量' }, { type: 'number', min: 1 }]}
          >
            <Input type="number" placeholder="输入数量" />
          </Form.Item>
          <Form.Item
            name="reason"
            label="原因"
            rules={[{ required: true, message: '请输入原因' }]}
          >
            <Input.TextArea placeholder="输入操作原因" />
          </Form.Item>
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setAdjustModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                {adjustType === 'in' ? '确认入库' : '确认出库'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="库存变动日志"
        open={logsModalVisible}
        onCancel={() => setLogsModalVisible(false)}
        width={800}
      >
        <Table
          columns={[
            {
              title: '操作时间',
              dataIndex: 'createdAt',
              key: 'createdAt',
            },
            {
              title: '操作类型',
              dataIndex: 'type',
              key: 'type',
              render: (type: string) => (
                <Tag color={type === 'in' ? 'green' : 'red'}>
                  {type === 'in' ? '入库' : '出库'}
                </Tag>
              ),
            },
            {
              title: '数量',
              dataIndex: 'quantity',
              key: 'quantity',
            },
            {
              title: '原因',
              dataIndex: 'reason',
              key: 'reason',
            },
            {
              title: '店铺',
              dataIndex: 'shopId',
              key: 'shopId',
              render: (shopId: string) => {
                const shop = shops.find(s => s.id === shopId);
                return shop?.name || shopId;
              },
            },
          ]}
          dataSource={logs}
          rowKey="id"
          loading={logsLoading}
          pagination={{ pageSize: 10 }}
        />
      </Modal>
    </div>
  );
};

export default InventoryPage;
