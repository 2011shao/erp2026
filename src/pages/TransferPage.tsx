import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Input, Select, message, Modal, Form, DatePicker } from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';
import { transferApi } from '../api';

const { Option } = Select;
const { RangePicker } = DatePicker;

interface TransferOrder {
  id: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  shopId: string;
  operatorId: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  reason: string;
  totalItems: number;
  createdAt: string;
  updatedAt: string;
  fromWarehouse?: {
    id: string;
    name: string;
    code: string;
  };
  toWarehouse?: {
    id: string;
    name: string;
    code: string;
  };
  operator?: {
    id: string;
    username: string;
  };
}

const TransferPage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const [transfers, setTransfers] = useState<TransferOrder[]>([]);
  const [warehouses, setWarehouses] = useState<{ id: string; name: string; code: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState<TransferOrder | null>(null);
  const [form] = Form.useForm();

  const fetchTransfers = async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    try {
      const response = await transferApi.getAll();
      setTransfers(response.data);
    } catch (error) {
      message.error('获取调拨单列表失败');
      console.error('获取调拨单列表失败:', error);
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
    fetchTransfers();
    fetchWarehouses();
  }, [isAuthenticated]);

  const handleSearch = () => {
    // 实现搜索逻辑
    fetchTransfers();
  };

  const handleAdd = () => {
    setEditingTransfer(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (transfer: TransferOrder) => {
    setEditingTransfer(transfer);
    form.setFieldsValue({
      fromWarehouseId: transfer.fromWarehouseId,
      toWarehouseId: transfer.toWarehouseId,
      reason: transfer.reason,
      status: transfer.status,
    });
    setIsModalVisible(true);
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个调拨单吗？',
      onOk: async () => {
        if (!isAuthenticated) return;
        
        try {
          await transferApi.delete(id);
          message.success('删除成功');
          fetchTransfers();
        } catch (error) {
          message.error('删除失败');
          console.error('删除调拨单失败:', error);
        }
      },
    });
  };

  const handleOk = async () => {
    if (!isAuthenticated) return;
    
    try {
      const values = await form.validateFields();
      
      if (editingTransfer) {
        await transferApi.updateStatus(editingTransfer.id, { status: values.status, reason: values.reason });
        message.success('更新成功');
      } else {
        await transferApi.create(values);
        message.success('创建成功');
      }
      
      setIsModalVisible(false);
      fetchTransfers();
    } catch (error) {
      message.error('操作失败');
      console.error('操作调拨单失败:', error);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const columns = [
    {
      title: '调拨单ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '调出仓库',
      dataIndex: 'fromWarehouse',
      key: 'fromWarehouse',
      render: (warehouse: any) => warehouse?.name || '未知',
    },
    {
      title: '调入仓库',
      dataIndex: 'toWarehouse',
      key: 'toWarehouse',
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
          'pending': '待处理',
          'processing': '处理中',
          'completed': '已完成',
          'cancelled': '已取消',
        };
        return statusMap[status] || status;
      },
    },
    {
      title: '调拨原因',
      dataIndex: 'reason',
      key: 'reason',
    },
    {
      title: '调拨数量',
      dataIndex: 'totalItems',
      key: 'totalItems',
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
      render: (_: any, record: TransferOrder) => (
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
      title="调拨管理"
      extra={
        <div style={{ display: 'flex', gap: 8 }}>
          <Input
            placeholder="搜索调拨单"
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
            <Option value="processing">处理中</Option>
            <Option value="completed">已完成</Option>
            <Option value="cancelled">已取消</Option>
          </Select>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchTransfers}
          >
            刷新
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            新增调拨
          </Button>
        </div>
      }
    >
      <Table
        columns={columns}
        dataSource={transfers}
        loading={loading}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
      />

      <Modal
        title={editingTransfer ? '编辑调拨单' : '新增调拨单'}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="fromWarehouseId"
            label="调出仓库"
            rules={[{ required: true, message: '请选择调出仓库' }]}
          >
            <Select placeholder="选择调出仓库">
              {warehouses.map(warehouse => (
                <Option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name} ({warehouse.code})
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="toWarehouseId"
            label="调入仓库"
            rules={[{ required: true, message: '请选择调入仓库' }]}
          >
            <Select placeholder="选择调入仓库">
              {warehouses.map(warehouse => (
                <Option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name} ({warehouse.code})
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="reason"
            label="调拨原因"
            rules={[{ required: true, message: '请输入调拨原因' }]}
          >
            <Input.TextArea placeholder="输入调拨原因" rows={3} />
          </Form.Item>
          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select placeholder="选择状态">
              <Option value="pending">待处理</Option>
              <Option value="processing">处理中</Option>
              <Option value="completed">已完成</Option>
              <Option value="cancelled">已取消</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="items"
            label="调拨商品"
            rules={[{ required: true, message: '请添加调拨商品' }]}
          >
            <Input.TextArea placeholder="输入调拨商品，格式：商品ID,数量;商品ID,数量" rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default TransferPage;