import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Input, Select, message, Modal, Form, Switch } from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';
import { warehouseApi } from '../api';

const { Option } = Select;

interface Warehouse {
  id: string;
  name: string;
  code: string;
  address: string;
  contactName: string;
  contactPhone: string;
  status: 'active' | 'inactive';
  shopId: string;
  createdAt: string;
  updatedAt: string;
  shop?: {
    id: string;
    name: string;
  };
}

const WarehousePage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [shops, setShops] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [form] = Form.useForm();

  const fetchWarehouses = async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    try {
      const response = await warehouseApi.getAll();
      setWarehouses(response.data);
    } catch (error) {
      message.error('获取仓库列表失败');
      console.error('获取仓库列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchShops = async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await warehouseApi.getAll();
      // 这里应该调用shopApi获取店铺列表，暂时使用空数组
      setShops([]);
    } catch (error) {
      message.error('获取店铺列表失败');
      console.error('获取店铺列表失败:', error);
    }
  };

  useEffect(() => {
    fetchWarehouses();
    fetchShops();
  }, [isAuthenticated]);

  const handleSearch = () => {
    // 实现搜索逻辑
    fetchWarehouses();
  };

  const handleAdd = () => {
    setEditingWarehouse(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse);
    form.setFieldsValue({
      name: warehouse.name,
      code: warehouse.code,
      address: warehouse.address,
      contactName: warehouse.contactName,
      contactPhone: warehouse.contactPhone,
      status: warehouse.status,
      shopId: warehouse.shopId,
    });
    setIsModalVisible(true);
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个仓库吗？',
      onOk: async () => {
        if (!isAuthenticated) return;
        
        try {
          await warehouseApi.delete(id);
          message.success('删除成功');
          fetchWarehouses();
        } catch (error) {
          message.error('删除失败');
          console.error('删除仓库失败:', error);
        }
      },
    });
  };

  const handleOk = async () => {
    if (!isAuthenticated) return;
    
    try {
      const values = await form.validateFields();
      
      if (editingWarehouse) {
        await warehouseApi.update(editingWarehouse.id, values);
        message.success('更新成功');
      } else {
        await warehouseApi.create(values);
        message.success('创建成功');
      }
      
      setIsModalVisible(false);
      fetchWarehouses();
    } catch (error) {
      message.error('操作失败');
      console.error('操作仓库失败:', error);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const columns = [
    {
      title: '仓库ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '仓库名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '仓库编码',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: '地址',
      dataIndex: 'address',
      key: 'address',
    },
    {
      title: '联系人',
      dataIndex: 'contactName',
      key: 'contactName',
    },
    {
      title: '联系电话',
      dataIndex: 'contactPhone',
      key: 'contactPhone',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Switch 
          checked={status === 'active'} 
          disabled 
          checkedChildren="启用" 
          unCheckedChildren="禁用"
        />
      ),
    },
    {
      title: '所属店铺',
      dataIndex: 'shop',
      key: 'shop',
      render: (shop: any) => shop?.name || '未知',
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
      render: (_: any, record: Warehouse) => (
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
      title="仓库管理"
      extra={
        <div style={{ display: 'flex', gap: 8 }}>
          <Input
            placeholder="搜索仓库"
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
            <Option value="active">启用</Option>
            <Option value="inactive">禁用</Option>
          </Select>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchWarehouses}
          >
            刷新
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            新增仓库
          </Button>
        </div>
      }
    >
      <Table
        columns={columns}
        dataSource={warehouses}
        loading={loading}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
      />

      <Modal
        title={editingWarehouse ? '编辑仓库' : '新增仓库'}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="仓库名称"
            rules={[{ required: true, message: '请输入仓库名称' }]}
          >
            <Input placeholder="输入仓库名称" />
          </Form.Item>
          <Form.Item
            name="code"
            label="仓库编码"
            rules={[{ required: true, message: '请输入仓库编码' }]}
          >
            <Input placeholder="输入仓库编码" />
          </Form.Item>
          <Form.Item
            name="address"
            label="地址"
            rules={[{ required: true, message: '请输入仓库地址' }]}
          >
            <Input placeholder="输入仓库地址" />
          </Form.Item>
          <Form.Item
            name="contactName"
            label="联系人"
            rules={[{ required: true, message: '请输入联系人' }]}
          >
            <Input placeholder="输入联系人" />
          </Form.Item>
          <Form.Item
            name="contactPhone"
            label="联系电话"
            rules={[{ required: true, message: '请输入联系电话' }]}
          >
            <Input placeholder="输入联系电话" />
          </Form.Item>
          <Form.Item
            name="shopId"
            label="所属店铺"
            rules={[{ required: true, message: '请选择所属店铺' }]}
          >
            <Select placeholder="选择所属店铺">
              {shops.map(shop => (
                <Option key={shop.id} value={shop.id}>
                  {shop.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="status"
            label="状态"
            valuePropName="checked"
            getValueFromEvent={(e) => e ? 'active' : 'inactive'}
            initialValue={true}
          >
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default WarehousePage;