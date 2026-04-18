import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Space,
  InputNumber,
  Card,
  Descriptions,
  Tag,
  Tooltip,
} from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, EyeOutlined } from '@ant-design/icons';
import { supplierApi, Supplier } from '../api';

const { Option } = Select;
const { TextArea } = Input;

const SupplierPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [form] = Form.useForm();
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const response = await supplierApi.getAll();
      if (response.success) {
        setSuppliers(response.data || []);
      } else {
        message.error('获取供货商列表失败');
      }
    } catch (error) {
      message.error('获取供货商列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleAdd = () => {
    form.resetFields();
    setEditingSupplier(null);
    setVisible(true);
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    form.setFieldsValue(supplier);
    setVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await supplierApi.delete(id);
      if (response.success) {
        message.success('删除成功');
        fetchSuppliers();
      } else {
        message.error('删除失败');
      }
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleView = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setDetailVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      let response;
      if (editingSupplier) {
        response = await supplierApi.update(editingSupplier.id, values);
      } else {
        response = await supplierApi.create(values);
      }
      if (response.success) {
        message.success(editingSupplier ? '更新成功' : '创建成功');
        setVisible(false);
        fetchSuppliers();
      } else {
        message.error(editingSupplier ? '更新失败' : '创建失败');
      }
    } catch (error) {
      message.error('表单验证失败');
    }
  };

  const columns = [
    {
      title: '编号',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: '供货商名称',
      dataIndex: 'name',
      key: 'name',
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
      title: '公司名称',
      dataIndex: 'companyName',
      key: 'companyName',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? '活跃' : '停用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Supplier) => (
        <Space size="middle">
          <Tooltip title="查看详情">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleView(record)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Popconfirm
              title="确定要删除这个供货商吗？"
              onConfirm={() => handleDelete(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">供货商管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增供货商
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={suppliers}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
        />
      </Card>

      <Modal
        title={editingSupplier ? '编辑供货商' : '新增供货商'}
        open={visible}
        onOk={handleSubmit}
        onCancel={() => setVisible(false)}
        width={800}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="code"
            label="供货商编号"
            rules={[{ required: true, message: '请输入供货商编号' }]}
          >
            <Input placeholder="请输入供货商编号" />
          </Form.Item>
          <Form.Item
            name="name"
            label="供货商名称"
            rules={[{ required: true, message: '请输入供货商名称' }]}
          >
            <Input placeholder="请输入供货商名称" />
          </Form.Item>
          <Form.Item
            name="contactName"
            label="联系人"
            rules={[{ required: true, message: '请输入联系人' }]}
          >
            <Input placeholder="请输入联系人" />
          </Form.Item>
          <Form.Item
            name="contactPhone"
            label="联系电话"
            rules={[{ required: true, message: '请输入联系电话' }]}
          >
            <Input placeholder="请输入联系电话" />
          </Form.Item>
          <Form.Item
            name="contactEmail"
            label="联系邮箱"
          >
            <Input placeholder="请输入联系邮箱" />
          </Form.Item>
          <Form.Item
            name="companyName"
            label="公司名称"
            rules={[{ required: true, message: '请输入公司名称' }]}
          >
            <Input placeholder="请输入公司名称" />
          </Form.Item>
          <Form.Item
            name="taxNumber"
            label="税号"
          >
            <Input placeholder="请输入税号" />
          </Form.Item>
          <Form.Item
            name="bankName"
            label="银行名称"
          >
            <Input placeholder="请输入银行名称" />
          </Form.Item>
          <Form.Item
            name="bankAccount"
            label="银行账号"
          >
            <Input placeholder="请输入银行账号" />
          </Form.Item>
          <Form.Item
            name="address"
            label="地址"
          >
            <TextArea rows={3} placeholder="请输入地址" />
          </Form.Item>
          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select placeholder="请选择状态">
              <Option value="active">活跃</Option>
              <Option value="inactive">停用</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="供货商详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>,
        ]}
        width={800}
      >
        {selectedSupplier && (
          <Descriptions column={1}>
            <Descriptions.Item label="供货商编号">{selectedSupplier.code}</Descriptions.Item>
            <Descriptions.Item label="供货商名称">{selectedSupplier.name}</Descriptions.Item>
            <Descriptions.Item label="联系人">{selectedSupplier.contactName}</Descriptions.Item>
            <Descriptions.Item label="联系电话">{selectedSupplier.contactPhone}</Descriptions.Item>
            <Descriptions.Item label="联系邮箱">{selectedSupplier.contactEmail}</Descriptions.Item>
            <Descriptions.Item label="公司名称">{selectedSupplier.companyName}</Descriptions.Item>
            <Descriptions.Item label="税号">{selectedSupplier.taxNumber}</Descriptions.Item>
            <Descriptions.Item label="银行名称">{selectedSupplier.bankName}</Descriptions.Item>
            <Descriptions.Item label="银行账号">{selectedSupplier.bankAccount}</Descriptions.Item>
            <Descriptions.Item label="地址">{selectedSupplier.address}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={selectedSupplier.status === 'active' ? 'green' : 'red'}>
                {selectedSupplier.status === 'active' ? '活跃' : '停用'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">{selectedSupplier.createdAt}</Descriptions.Item>
            <Descriptions.Item label="更新时间">{selectedSupplier.updatedAt}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default SupplierPage;