import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Input, Select, message, Modal, Form, InputNumber, Switch } from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';
import { userApi } from '../api';

const { Option } = Select;

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

const UserPage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();

  const fetchUsers = async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    try {
      const response = await userApi.getUsers();
      setUsers(response.data);
    } catch (error) {
      message.error('获取用户列表失败');
      console.error('获取用户列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await userApi.getRoles();
      setRoles(response.data);
    } catch (error) {
      message.error('获取角色列表失败');
      console.error('获取角色列表失败:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [isAuthenticated]);

  const handleSearch = () => {
    // 实现搜索逻辑
    fetchUsers();
  };

  const handleAdd = () => {
    setEditingUser(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue({
      username: user.username,
      email: user.email,
      role: user.role,
      active: user.active,
    });
    setIsModalVisible(true);
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个用户吗？',
      onOk: async () => {
        if (!isAuthenticated) return;
        
        try {
          await userApi.deleteUser(id);
          message.success('删除成功');
          fetchUsers();
        } catch (error) {
          message.error('删除失败');
          console.error('删除用户失败:', error);
        }
      },
    });
  };

  const handleOk = async () => {
    if (!isAuthenticated) return;
    
    try {
      const values = await form.validateFields();
      
      if (editingUser) {
        await userApi.updateUser(editingUser.id, values);
        message.success('更新成功');
      } else {
        await userApi.createUser(values);
        message.success('创建成功');
      }
      
      setIsModalVisible(false);
      fetchUsers();
    } catch (error) {
      message.error('操作失败');
      console.error('操作用户失败:', error);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const columns = [
    {
      title: '用户ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
    },
    {
      title: '状态',
      dataIndex: 'active',
      key: 'active',
      render: (active: boolean) => (
        <Switch checked={active} disabled />
      ),
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
      render: (_: any, record: User) => (
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
      title="用户管理"
      extra={
        <div style={{ display: 'flex', gap: 8 }}>
          <Input
            placeholder="搜索用户"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 200 }}
          />
          <Select
            placeholder="角色筛选"
            value={roleFilter}
            onChange={setRoleFilter}
            style={{ width: 120 }}
          >
            <Option value="">全部</Option>
            {roles.map(role => (
              <Option key={role} value={role}>
                {role}
              </Option>
            ))}
          </Select>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchUsers}
          >
            刷新
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            新增用户
          </Button>
        </div>
      }
    >
      <Table
        columns={columns}
        dataSource={users}
        loading={loading}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
      />

      <Modal
        title={editingUser ? '编辑用户' : '新增用户'}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="输入用户名" />
          </Form.Item>
          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input placeholder="输入邮箱" />
          </Form.Item>
          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: !editingUser, message: '请输入密码' }]}
          >
            <Input.Password placeholder="输入密码" />
          </Form.Item>
          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="选择角色">
              {roles.map(role => (
                <Option key={role} value={role}>
                  {role}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="active"
            label="状态"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default UserPage;