import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Button, Space, Statistic, Row, Col } from 'antd';
import { StockOutlined, WarningOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { inventoryApi } from '../api';

const InventoryPage: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
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

  useEffect(() => {
    fetchData();
  }, []);

  const lowStockProducts = products.filter(p => Number(p.stock) <= 10);
  const totalStock = products.reduce((sum, p) => sum + Number(p.stock), 0);
  const totalValue = products.reduce((sum, p) => sum + Number(p.price) * Number(p.stock), 0);

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
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => <Tag color="blue">{category}</Tag>,
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
    </div>
  );
};

export default InventoryPage;
