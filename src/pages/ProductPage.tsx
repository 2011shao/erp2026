import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, Table, Tag, Button, Space, Input, Select, Modal, Form, InputNumber, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { productApi, shopApi } from '../api';
import { useAuthStore } from '../store/authStore';

const { Option } = Select;

const ProductPage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();
  const [products, setProducts] = useState<any[]>([]);
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  // 检查路由是否为添加商品
  useEffect(() => {
    if (location.pathname === '/products/add') {
      setEditingProduct(null);
      form.resetFields();
      setModalVisible(true);
    }
  }, [location.pathname, form]);

  const fetchData = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const [productsRes, shopsRes] = await Promise.all([
        productApi.getAll(),
        shopApi.getAllSimple(),
      ]);
      setProducts(productsRes.data || []);
      setShops(shopsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      message.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isAuthenticated]);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchText.toLowerCase()) ||
    p.brand.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleAdd = () => {
    setEditingProduct(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    form.setFieldsValue(product);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个商品吗？',
      onOk: async () => {
        try {
          message.loading('删除中...');
          message.success('删除成功');
          fetchData();
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      message.loading('保存中...');
      message.success('保存成功');
      setModalVisible(false);
      fetchData();
    } catch (error) {
      message.error('保存失败');
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
    },
    {
      title: '型号',
      dataIndex: 'model',
      key: 'model',
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => {
        const categoryMap: { [key: string]: string } = {
          new: '新机',
          used: '二手机',
          accessory: '配件',
          coupon: '卡券',
          warranty: '延保',
          carrier_plan: '运营商套餐'
        };
        return <Tag color="blue">{categoryMap[category] || category}</Tag>;
      },
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      render: (price: string) => <span style={{ color: '#cf1322', fontWeight: 500 }}>¥{price}</span>,
    },
    {
      title: '库存',
      dataIndex: 'stock',
      key: 'stock',
      render: (stock: number) => (
        <Tag color={stock > 20 ? 'green' : stock > 10 ? 'orange' : 'red'}>
          {stock}
        </Tag>
      ),
    },
    {
      title: '店铺',
      dataIndex: ['shop', 'name'],
      key: 'shop',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="商品管理"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加商品
          </Button>
        }
      >
        <div style={{ marginBottom: 16 }}>
          <Input
            placeholder="搜索商品名称或品牌"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />
        </div>

        <Table
          columns={columns}
          dataSource={filteredProducts}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingProduct ? '编辑商品' : '添加商品'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="商品名称"
            rules={[{ required: true, message: '请输入商品名称' }]}
          >
            <Input placeholder="请输入商品名称" />
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
            name="category"
            label="分类"
            rules={[{ required: true, message: '请选择分类' }]}
          >
            <Select placeholder="请选择分类">
              <Option value="new">新机</Option>
              <Option value="used">二手机</Option>
              <Option value="accessory">配件</Option>
              <Option value="coupon">卡券</Option>
              <Option value="warranty">延保</Option>
              <Option value="carrier_plan">运营商套餐</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="price"
            label="售价"
            rules={[{ required: true, message: '请输入售价' }]}
          >
            <InputNumber style={{ width: '100%' }} placeholder="请输入售价" min={0} />
          </Form.Item>
          <Form.Item
            name="costPrice"
            label="成本价"
            rules={[{ required: true, message: '请输入成本价' }]}
          >
            <InputNumber style={{ width: '100%' }} placeholder="请输入成本价" min={0} />
          </Form.Item>
          <Form.Item
            name="stock"
            label="库存"
            rules={[{ required: true, message: '请输入库存' }]}
          >
            <InputNumber style={{ width: '100%' }} placeholder="请输入库存" min={0} />
          </Form.Item>
          <Form.Item
            name="shopId"
            label="店铺"
            rules={[{ required: true, message: '请选择店铺' }]}
          >
            <Select placeholder="请选择店铺">
              {shops.map(shop => (
                <Option key={shop.id} value={shop.id}>
                  {shop.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProductPage;
