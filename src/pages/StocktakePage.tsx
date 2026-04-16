import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Input, Select, message, Modal, Form, DatePicker } from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';
import { stocktakeApi } from '../api';

const { Option } = Select;
const { RangePicker } = DatePicker;

interface Stocktake {
  id: string;
  shopId: string;
  warehouseId: string;
  operatorId: string;
  status: 'in_progress' | 'completed' | 'cancelled';
  startDate: string;
  endDate?: string;
  totalItems: number;
  variance: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  warehouse?: {
    id: string;
    name: string;
    code: string;
  };
  shop?: {
    id: string;
    name: string;
  };
  operator?: {
    id: string;
    username: string;
  };
}

const StocktakePage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const [stocktakes, setStocktakes] = useState<Stocktake[]>([]);
  const [warehouses, setWarehouses] = useState<{ id: string; name: string; code: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingStocktake, setEditingStocktake] = useState<Stocktake | null>(null);
  const [form] = Form.useForm();

  const fetchStocktakes = async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    try {
      const response = await stocktakeApi.getAll();
      setStocktakes(response.data);
    } catch (error) {
      message.error('获取库存盘点列表失败');
      console.error('获取库存盘点列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouses = async () => {
    if (!isAuthenticated) return;
    
    try {
      // 这里应该调用warehouseApi获取仓库列表，暂时使用空数组
      setWarehouses([]);
    } catch (error) {
      message.error('获取仓库列表失败');
      console.error('获取仓库列表失败:', error);
    }
  };

  useEffect(() => {
    fetchStocktakes();
    fetchWarehouses();
  }, [isAuthenticated]);

  const handleSearch = () => {
    // 实现搜索逻辑
    fetchStocktakes();
  };

  const handleAdd = () => {
    setEditingStocktake(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (stocktake: Stocktake) => {
    setEditingStocktake(stocktake);
    form.setFieldsValue({
      warehouseId: stocktake.warehouseId,
      notes: stocktake.notes,
      status: stocktake.status,
    });
    setIsModalVisible(true);
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个库存盘点单吗？',
      onOk: async () => {
        if (!isAuthenticated) return;
        
        try {
          await stocktakeApi.delete(id);
          message.success('删除成功');
          fetchStocktakes();
        } catch (error) {
          message.error('删除失败');
          console.error('删除库存盘点单失败:', error);
        }
      },
    });
  };

  const handleOk = async () => {
    if (!isAuthenticated) return;
    
    try {
      const values = await form.validateFields();
      
      if (editingStocktake) {
        if (values.status === 'completed') {
          await stocktakeApi.complete(editingStocktake.id, { reason: values.notes });
        } else if (values.status === 'cancelled') {
          await stocktakeApi.cancel(editingStocktake.id, { reason: values.notes });
        }
        message.success('更新成功');
      } else {
        await stocktakeApi.create(values);
        message.success('创建成功');
      }
      
      setIsModalVisible(false);
      fetchStocktakes();
    } catch (error) {
      message.error('操作失败');
      console.error('操作库存盘点单失败:', error);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const columns = [
    {
      title: '盘点单ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '仓库',
      dataIndex: 'warehouse',
      key: 'warehouse',
      render: (warehouse: any) => warehouse?.name || '未知',
    },
    {
      title: '操作人',
      dataIndex: 'operator',
      key: 'operator',
      render: (operator: any) => operator?.username || '未知',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap: Record<string, string> = {
          'in_progress': '进行中',
          'completed': '已完成',
          'cancelled': '已取消',
        };
        return statusMap[status] || status;
      },
    },
    {
      title: '开始日期',
      dataIndex: 'startDate',
      key: 'startDate',
      render: (text: string) => new Date(text).toLocaleString(),
    },
    {
      title: '结束日期',
      dataIndex: 'endDate',
      key: 'endDate',
      render: (text: string | undefined) => text ? new Date(text).toLocaleString() : '未结束',
    },
    {
      title: '盘点商品数',
      dataIndex: 'totalItems',
      key: 'totalItems',
    },
    {
      title: '差异金额',
      dataIndex: 'variance',
      key: 'variance',
      render: (text: number) => `¥${text.toFixed(2)}`,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Stocktake) => (
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
      title="库存盘点"
      extra={
        <div style={{ display: 'flex', gap: 8 }}>
          <Input
            placeholder="搜索盘点单"
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
            <Option value="in_progress">进行中</Option>
            <Option value="completed">已完成</Option>
            <Option value="cancelled">已取消</Option>
          </Select>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchStocktakes}
          >
            刷新
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            新增盘点
          </Button>
        </div>
      }
    >
      <Table
        columns={columns}
        dataSource={stocktakes}
        loading={loading}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
      />

      <Modal
        title={editingStocktake ? '编辑盘点单' : '新增盘点单'}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="warehouseId"
            label="仓库"
            rules={[{ required: true, message: '请选择仓库' }]}
          >
            <Select placeholder="选择仓库">
              {warehouses.map(warehouse => (
                <Option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name} ({warehouse.code})
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="notes"
            label="备注"
          >
            <Input.TextArea placeholder="输入备注信息" rows={3} />
          </Form.Item>
          {editingStocktake && (
            <Form.Item
              name="status"
              label="状态"
              rules={[{ required: true, message: '请选择状态' }]}
            >
              <Select placeholder="选择状态">
                <Option value="in_progress">进行中</Option>
                <Option value="completed">已完成</Option>
                <Option value="cancelled">已取消</Option>
              </Select>
            </Form.Item>
          )}
        </Form>
      </Modal>
    </Card>
  );
};

export default StocktakePage;