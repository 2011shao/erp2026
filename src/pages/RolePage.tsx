import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Input, message, Modal, Form, Checkbox, Tree } from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';
import { roleApi } from '../api';

interface Role {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface Permission {
  id: string;
  name: string;
  code: string;
  parentId: string | null;
  children?: Permission[];
}

const RolePage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [form] = Form.useForm();

  const fetchRoles = async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    try {
      const response = await roleApi.getRoles();
      setRoles(response.data);
    } catch (error) {
      message.error('获取角色列表失败');
      console.error('获取角色列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await roleApi.getPermissions();
      setPermissions(response.data);
    } catch (error) {
      message.error('获取权限列表失败');
      console.error('获取权限列表失败:', error);
    }
  };

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, [isAuthenticated]);

  const handleSearch = () => {
    // 实现搜索逻辑
    fetchRoles();
  };

  const handleAdd = () => {
    setEditingRole(null);
    form.resetFields();
    setSelectedPermissions([]);
    setIsModalVisible(true);
  };

  const handleEdit = async (role: Role) => {
    setEditingRole(role);
    form.setFieldsValue({
      name: role.name,
      description: role.description,
    });
    
    // 获取角色的权限
    try {
      const response = await roleApi.getRolePermissions(role.id);
      setSelectedPermissions(response.data);
    } catch (error) {
      message.error('获取角色权限失败');
      console.error('获取角色权限失败:', error);
      setSelectedPermissions([]);
    }
    
    setIsModalVisible(true);
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个角色吗？',
      onOk: async () => {
        if (!isAuthenticated) return;
        
        try {
          await roleApi.deleteRole(id);
          message.success('删除成功');
          fetchRoles();
        } catch (error) {
          message.error('删除失败');
          console.error('删除角色失败:', error);
        }
      },
    });
  };

  const handleOk = async () => {
    if (!isAuthenticated) return;
    
    try {
      const values = await form.validateFields();
      
      if (editingRole) {
        await roleApi.updateRole(editingRole.id, values);
        await roleApi.updateRolePermissions(editingRole.id, selectedPermissions);
        message.success('更新成功');
      } else {
        const role = await roleApi.createRole(values);
        await roleApi.updateRolePermissions(role.id, selectedPermissions);
        message.success('创建成功');
      }
      
      setIsModalVisible(false);
      fetchRoles();
    } catch (error) {
      message.error('操作失败');
      console.error('操作角色失败:', error);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const onPermissionChange = (checkedValues: string[]) => {
    setSelectedPermissions(checkedValues);
  };

  const columns = [
    {
      title: '角色ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '角色名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
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
      render: (_: any, record: Role) => (
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

  const generateTreeData = (permissions: Permission[]): any[] => {
    return permissions.map(permission => ({
      title: permission.name,
      value: permission.id,
      children: permission.children ? generateTreeData(permission.children) : undefined,
    }));
  };

  return (
    <Card
      title="角色管理"
      extra={
        <div style={{ display: 'flex', gap: 8 }}>
          <Input
            placeholder="搜索角色"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 200 }}
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchRoles}
          >
            刷新
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            新增角色
          </Button>
        </div>
      }
    >
      <Table
        columns={columns}
        dataSource={roles}
        loading={loading}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
      />

      <Modal
        title={editingRole ? '编辑角色' : '新增角色'}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="角色名称"
            rules={[{ required: true, message: '请输入角色名称' }]}
          >
            <Input placeholder="输入角色名称" />
          </Form.Item>
          <Form.Item
            name="description"
            label="描述"
          >
            <Input.TextArea placeholder="输入角色描述" rows={3} />
          </Form.Item>
          <Form.Item
            label="权限分配"
          >
            <Checkbox.Group
              value={selectedPermissions}
              onChange={onPermissionChange}
            >
              <Tree
                checkable
                treeData={generateTreeData(permissions)}
                checkedKeys={selectedPermissions}
                onCheck={(_, info) => {
                  setSelectedPermissions(info.checkedNodes.map(node => node.value));
                }}
              />
            </Checkbox.Group>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default RolePage;