import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Input, Select, message, Modal, Form, TreeSelect } from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';
import { permissionApi } from '../api';

const { Option } = Select;

interface Permission {
  id: string;
  name: string;
  code: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  children?: Permission[];
}

const PermissionPage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
  const [form] = Form.useForm();

  const fetchPermissions = async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    try {
      const response = await permissionApi.getPermissions();
      setPermissions(response.data);
    } catch (error) {
      message.error('获取权限列表失败');
      console.error('获取权限列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, [isAuthenticated]);

  const handleSearch = () => {
    // 实现搜索逻辑
    fetchPermissions();
  };

  const handleAdd = () => {
    setEditingPermission(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (permission: Permission) => {
    setEditingPermission(permission);
    form.setFieldsValue({
      name: permission.name,
      code: permission.code,
      parentId: permission.parentId,
    });
    setIsModalVisible(true);
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个权限吗？',
      onOk: async () => {
        if (!isAuthenticated) return;
        
        try {
          await permissionApi.deletePermission(id);
          message.success('删除成功');
          fetchPermissions();
        } catch (error) {
          message.error('删除失败');
          console.error('删除权限失败:', error);
        }
      },
    });
  };

  const handleOk = async () => {
    if (!isAuthenticated) return;
    
    try {
      const values = await form.validateFields();
      
      if (editingPermission) {
        await permissionApi.updatePermission(editingPermission.id, values);
        message.success('更新成功');
      } else {
        await permissionApi.createPermission(values);
        message.success('创建成功');
      }
      
      setIsModalVisible(false);
      fetchPermissions();
    } catch (error) {
      message.error('操作失败');
      console.error('操作权限失败:', error);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const columns = [
    {
      title: '权限ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '权限名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '权限编码',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: '父级权限',
      dataIndex: 'parentId',
      key: 'parentId',
      render: (parentId: string | null) => {
        if (!parentId) return '无';
        const parent = findPermissionById(permissions, parentId);
        return parent?.name || '未知';
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
      render: (_: any, record: Permission) => (
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

  const findPermissionById = (permissions: Permission[], id: string): Permission | undefined => {
    for (const permission of permissions) {
      if (permission.id === id) {
        return permission;
      }
      if (permission.children) {
        const found = findPermissionById(permission.children, id);
        if (found) {
          return found;
        }
      }
    }
    return undefined;
  };

  const generateTreeData = (permissions: Permission[]): any[] => {
    return permissions.map(permission => ({
      title: permission.name,
      value: permission.id,
      children: permission.children ? generateTreeData(permission.children) : undefined,
    }));
  };

  return (
    <Card
      title="权限管理"
      extra={
        <div style={{ display: 'flex', gap: 8 }}>
          <Input
            placeholder="搜索权限"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 200 }}
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchPermissions}
          >
            刷新
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            新增权限
          </Button>
        </div>
      }
    >
      <Table
        columns={columns}
        dataSource={permissions.flatMap(permission => [
          permission,
          ...(permission.children || []),
        ])}
        loading={loading}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
      />

      <Modal
        title={editingPermission ? '编辑权限' : '新增权限'}
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
            label="权限名称"
            rules={[{ required: true, message: '请输入权限名称' }]}
          >
            <Input placeholder="输入权限名称" />
          </Form.Item>
          <Form.Item
            name="code"
            label="权限编码"
            rules={[{ required: true, message: '请输入权限编码' }]}
          >
            <Input placeholder="输入权限编码" />
          </Form.Item>
          <Form.Item
            name="parentId"
            label="父级权限"
          >
            <TreeSelect
              placeholder="选择父级权限"
              treeData={generateTreeData(permissions)}
              treeDefaultExpandAll
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default PermissionPage;