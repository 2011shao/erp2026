import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Button, Space, Input, Select, Modal, Form, message, Descriptions } from 'antd';
import { SearchOutlined, EditOutlined, DeleteOutlined, PlusOutlined, EyeOutlined } from '@ant-design/icons';
import { salesApi, productApi, shopApi } from '../api';
import { useAuthStore } from '../store/authStore';

const { Option } = Select;

const SalesPage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [form] = Form.useForm();

  const fetchData = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const [ordersRes, productsRes, shopsRes] = await Promise.all([
        salesApi.getAll(),
        productApi.getAll(),
        shopApi.getAllSimple(),
      ]);
      setOrders(ordersRes.data?.data || []);
      setProducts(productsRes.data?.data || []);
      setShops(shopsRes.data?.data || []);
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

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchText.toLowerCase()) ||
      (order.shop?.name && order.shop.name.toLowerCase().includes(searchText.toLowerCase()));
    const matchesStatus = !statusFilter || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAdd = () => {
    setEditingOrder(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (order: any) => {
    setEditingOrder(order);
    form.setFieldsValue(order);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个销售订单吗？',
      onOk: async () => {
        try {
          message.loading('删除中...');
          await salesApi.delete(id);
          message.success('删除成功');
          fetchData();
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  const handleViewDetail = (order: any) => {
    setCurrentOrder(order);
    setDetailModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      message.loading('保存中...');
      
      if (editingOrder) {
        await salesApi.update(editingOrder.id, values);
      } else {
        await salesApi.create(values);
      }
      
      message.success('保存成功');
      setModalVisible(false);
      fetchData();
    } catch (error) {
      message.error('保存失败');
    }
  };

  const columns = [
    {
      title: '订单编号',
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => <span style={{ fontWeight: 500 }}>{id}</span>,
    },
    {
      title: '店铺',
      dataIndex: ['shop', 'name'],
      key: 'shop',
    },
    {
      title: '订单金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: string) => <span style={{ color: '#cf1322', fontWeight: 500 }}>¥{amount}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'blue';
        let text = status;
        
        switch (status) {
          case 'pending':
            color = 'orange';
            text = '待处理';
            break;
          case 'completed':
            color = 'green';
            text = '已完成';
            break;
          case 'cancelled':
            color = 'red';
            text = '已取消';
            break;
        }
        
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '商品数量',
      key: 'itemCount',
      render: (_: any, record: any) => record.items?.length || 0,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
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

  const statusOptions = [
    { value: '', label: '全部状态' },
    { value: 'pending', label: '待处理' },
    { value: 'completed', label: '已完成' },
    { value: 'cancelled', label: '已取消' },
  ];

  return (
    <div>
      <Card
        title="销售管理"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加订单
          </Button>
        }
      >
        <div style={{ marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Input
            placeholder="搜索订单编号或店铺名称"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />
          <Select
            placeholder="筛选状态"
            style={{ width: 200 }}
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusOptions}
          />
        </div>

        <Table
          columns={columns}
          dataSource={filteredOrders}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingOrder ? '编辑订单' : '添加订单'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={700}
      >
        <Form form={form} layout="vertical">
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
          <Form.Item
            name="items"
            label="商品"
            rules={[{ required: true, message: '请添加商品' }]}
          >
            {/* 这里可以实现更复杂的商品选择和数量输入 */}
            <div style={{ padding: '16px', border: '1px dashed #d9d9d9', borderRadius: 4 }}>
              <p>商品选择功能待实现</p>
            </div>
          </Form.Item>
          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select placeholder="请选择状态">
              {statusOptions.filter(option => option.value).map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="订单详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={700}
      >
        {currentOrder && (
          <div>
            <Descriptions bordered>
              <Descriptions.Item label="订单编号">{currentOrder.id}</Descriptions.Item>
              <Descriptions.Item label="店铺">{currentOrder.shop?.name}</Descriptions.Item>
              <Descriptions.Item label="订单金额">¥{currentOrder.totalAmount}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={
                  currentOrder.status === 'completed' ? 'green' :
                  currentOrder.status === 'pending' ? 'orange' : 'red'
                }>
                  {currentOrder.status === 'completed' ? '已完成' :
                   currentOrder.status === 'pending' ? '待处理' : '已取消'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {new Date(currentOrder.createdAt).toLocaleString('zh-CN')}
              </Descriptions.Item>
              {currentOrder.updatedAt && (
                <Descriptions.Item label="更新时间">
                  {new Date(currentOrder.updatedAt).toLocaleString('zh-CN')}
                </Descriptions.Item>
              )}
            </Descriptions>
            
            <div style={{ marginTop: 24 }}>
              <h3 style={{ marginBottom: 16 }}>商品明细</h3>
              <Table
                columns={[
                  {
                    title: '商品名称',
                    dataIndex: ['product', 'name'],
                    key: 'name',
                  },
                  {
                    title: '数量',
                    dataIndex: 'quantity',
                    key: 'quantity',
                  },
                  {
                    title: '单价',
                    dataIndex: 'price',
                    key: 'price',
                    render: (price: string) => `¥${price}`,
                  },
                  {
                    title: '小计',
                    key: 'subtotal',
                    render: (_: any, record: any) => `¥${(Number(record.price) * record.quantity).toFixed(2)}`,
                  },
                ]}
                dataSource={currentOrder.items || []}
                rowKey="id"
                pagination={false}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SalesPage;