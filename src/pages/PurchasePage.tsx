import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Input, Select, DatePicker, message, Modal, Form, InputNumber } from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';
import { purchaseApi } from '../api';

const { Option } = Select;
const { RangePicker } = DatePicker;

interface Purchase {
  id: string;
  supplierId: string;
  supplierName: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface Supplier {
  id: string;
  name: string;
}

const PurchasePage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [form] = Form.useForm();

  const fetchPurchases = async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    try {
      const response = await purchaseApi.getPurchases();
      setPurchases(response.data);
    } catch (error) {
      message.error('获取采购记录失败');
      console.error('获取采购记录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await purchaseApi.getSuppliers();
      setSuppliers(response.data);
    } catch (error) {
      message.error('获取供应商列表失败');
      console.error('获取供应商列表失败:', error);
    }
  };

  useEffect(() => {
    fetchPurchases();
    fetchSuppliers();
  }, [isAuthenticated]);

  const handleSearch = () => {
    // 实现搜索逻辑
    fetchPurchases();
  };

  const handleAdd = () => {
    setEditingPurchase(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (purchase: Purchase) => {
    setEditingPurchase(purchase);
    form.setFieldsValue({
      supplierId: purchase.supplierId,
      totalAmount: purchase.totalAmount,
      status: purchase.status,
    });
    setIsModalVisible(true);
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条采购记录吗？',
      onOk: async () => {
        if (!isAuthenticated) return;
        
        try {
          await purchaseApi.deletePurchase(id);
          message.success('删除成功');
          fetchPurchases();
        } catch (error) {
          message.error('删除失败');
          console.error('删除采购记录失败:', error);
        }
      },
    });
  };

  const handleOk = async () => {
    if (!isAuthenticated) return;
    
    try {
      const values = await form.validateFields();
      
      if (editingPurchase) {
        await purchaseApi.updatePurchase(editingPurchase.id, values);
        message.success('更新成功');
      } else {
        await purchaseApi.createPurchase(values);
        message.success('创建成功');
      }
      
      setIsModalVisible(false);
      fetchPurchases();
    } catch (error) {
      message.error('操作失败');
      console.error('操作采购记录失败:', error);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const columns = [
    {
      title: '采购编号',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '供应商',
      dataIndex: 'supplierName',
      key: 'supplierName',
    },
    {
      title: '总金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (text: number) => `¥${text.toFixed(2)}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap: Record<string, string> = {
          'pending': '待处理',
          'completed': '已完成',
          'cancelled': '已取消',
        };
        return statusMap[status] || status;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text: string) => new Date(text).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Purchase) => (
        <>
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            style={{ marginRight: 8 }}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </>
      ),
    },
  ];

  return (
    <Card
      title="采购管理"
      extra={
        <div style={{ display: 'flex', gap: 8 }}>
          <Input
            placeholder="搜索采购记录"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 200 }}
          />
          <Select
            placeholder="状态筛选"
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 120 }}
          >
            <Option value="">全部</Option>
            <Option value="pending">待处理</Option>
            <Option value="completed">已完成</Option>
            <Option value="cancelled">已取消</Option>
          </Select>
          <RangePicker
            onChange={(dates) => {
              if (dates) {
                setDateRange([dates[0].toISOString(), dates[1].toISOString()]);
              } else {
                setDateRange(null);
              }
            }}
            style={{ width: 200 }}
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchPurchases}
          >
            刷新
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            新增采购
          </Button>
        </div>
      }
    >
      <Table
        columns={columns}
        dataSource={purchases}
        loading={loading}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
      />

      <Modal
        title={editingPurchase ? '编辑采购记录' : '新增采购记录'}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="supplierId"
            label="供应商"
            rules={[{ required: true, message: '请选择供应商' }]}
          >
            <Select placeholder="选择供应商">
              {suppliers.map(supplier => (
                <Option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="totalAmount"
            label="总金额"
            rules={[{ required: true, message: '请输入总金额' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="输入总金额"
              min={0}
              step={0.01}
              precision={2}
            />
          </Form.Item>
          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select placeholder="选择状态">
              <Option value="pending">待处理</Option>
              <Option value="completed">已完成</Option>
              <Option value="cancelled">已取消</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default PurchasePage;