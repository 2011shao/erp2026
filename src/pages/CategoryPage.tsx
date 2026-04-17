import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Button, Space, Modal, Form, Input, InputNumber, Switch, Select, message, Checkbox, Upload, Alert } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import { categoryApi, Category } from '../api';
import { useAuthStore } from '../store/authStore';

const { Option } = Select;

const CategoryPage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  const fetchCategories = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const response = await categoryApi.getAll();
      const data = response.data || [];
      setCategories(data);
      setFilteredCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      message.error('获取分类列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    if (value) {
      const filtered = categories.filter(category => 
        category.name.toLowerCase().includes(value.toLowerCase()) ||
        category.code.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredCategories(filtered);
    } else {
      setFilteredCategories(categories);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [isAuthenticated]);

  const handleAdd = () => {
    setEditingCategory(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    form.setFieldsValue(category);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个分类吗？',
      onOk: async () => {
        try {
          message.loading('删除中...');
          await categoryApi.delete(id);
          message.success('删除成功');
          fetchCategories();
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的分类');
      return;
    }

    Modal.confirm({
      title: '确认批量删除',
      content: `确定要删除选中的 ${selectedRowKeys.length} 个分类吗？`,
      onOk: async () => {
        try {
          message.loading('删除中...');
          await Promise.all(selectedRowKeys.map(id => categoryApi.delete(id)));
          message.success('批量删除成功');
          setSelectedRowKeys([]);
          fetchCategories();
        } catch (error) {
          message.error('批量删除失败');
        }
      },
    });
  };

  const handleExport = async () => {
    try {
      const response = await categoryApi.export();
      // 创建下载链接
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `categories-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      message.success('导出成功');
    } catch (error) {
      message.error('导出失败');
    }
  };

  const handleImport = async (categories: any[]) => {
    setImporting(true);
    setImportResult(null);
    try {
      const response = await categoryApi.import({ categories });
      setImportResult(response.data);
      message.success('导入完成');
      fetchCategories();
    } catch (error) {
      message.error('导入失败');
    } finally {
      setImporting(false);
    }
  };

  const handleFileUpload = (file: any) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',');
      const categories: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (values.length >= headers.length) {
          const category: any = {};
          headers.forEach((header, index) => {
            category[header.trim()] = values[index]?.trim();
          });
          // 转换数据类型
          if (category['排序']) category.sortOrder = parseInt(category['排序']);
          if (category['状态']) category.isActive = category['状态'] === '启用';
          if (category['上级分类']) category.parentName = category['上级分类'];
          categories.push(category);
        }
      }

      handleImport(categories);
    };
    reader.readAsText(file);
    return false; // 阻止默认上传
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      message.loading('保存中...');
      
      if (editingCategory) {
        await categoryApi.update(editingCategory.id, values);
      } else {
        await categoryApi.create(values);
      }
      
      message.success('保存成功');
      setModalVisible(false);
      fetchCategories();
    } catch (error) {
      message.error('保存失败');
    }
  };

  const topLevelCategories = categories.filter(c => !c.parentId);

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: string[]) => setSelectedRowKeys(keys),
  };

  const columns = [
    {
      title: '分类名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Category) => (
        <span style={{ fontWeight: 500, paddingLeft: record.parentId ? 20 : 0 }}>
          {record.parentId && '└ '}{name}
        </span>
      ),
    },
    {
      title: '编码',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: '排序',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? '启用' : '禁用'}
        </Tag>
      ),
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
      render: (_: any, record: Category) => (
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
        title="分类管理"
        extra={
          <Space>
            <Input
              placeholder="搜索分类名称或编码"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => handleSearch(e.target.value)}
              style={{ width: 200 }}
            />
            {selectedRowKeys.length > 0 && (
              <Button danger icon={<DeleteOutlined />} onClick={handleBatchDelete}>
                批量删除 ({selectedRowKeys.length})
              </Button>
            )}
            <Button icon={<DownloadOutlined />} onClick={handleExport}>
              导出
            </Button>
            <Button icon={<UploadOutlined />} onClick={() => setImportModalVisible(true)}>
              导入
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              添加分类
            </Button>
          </Space>
        }
      >
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={filteredCategories}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingCategory ? '编辑分类' : '添加分类'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="parentId"
            label="上级分类"
          >
            <Select placeholder="无（作为顶级分类）" allowClear>
              {topLevelCategories.map(category => (
                <Option key={category.id} value={category.id}>
                  {category.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="name"
            label="分类名称"
            rules={[{ required: true, message: '请输入分类名称' }]}
          >
            <Input placeholder="请输入分类名称" />
          </Form.Item>
          <Form.Item
            name="code"
            label="分类编码"
            rules={[{ required: true, message: '请输入分类编码' }]}
          >
            <Input placeholder="请输入分类编码" />
          </Form.Item>
          <Form.Item
            name="sortOrder"
            label="排序"
            initialValue={0}
          >
            <InputNumber style={{ width: '100%' }} placeholder="请输入排序" min={0} />
          </Form.Item>
          <Form.Item
            name="isActive"
            label="状态"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 导入模态框 */}
      <Modal
        title="导入分类"
        open={importModalVisible}
        onCancel={() => {
          setImportModalVisible(false);
          setImportResult(null);
        }}
        footer={null}
      >
        <div style={{ padding: '20px 0' }}>
          <Upload.Dragger
            name="file"
            beforeUpload={handleFileUpload}
            multiple={false}
            disabled={importing}
          >
            <p className="ant-upload-drag-icon">
              <UploadOutlined />
            </p>
            <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
            <p className="ant-upload-hint">
              支持 CSV 格式文件，包含分类名称、编码、上级分类、排序、状态等字段
            </p>
          </Upload.Dragger>
        </div>

        {importing && (
          <div style={{ marginTop: 20 }}>
            <Alert message="导入中..." type="info" showIcon />
          </div>
        )}

        {importResult && (
          <div style={{ marginTop: 20 }}>
            <Alert
              message={`导入完成：成功 ${importResult.imported} 条，失败 ${importResult.failed} 条`}
              type={importResult.failed > 0 ? 'warning' : 'success'}
              showIcon
            />
            {importResult.failed > 0 && (
              <div style={{ marginTop: 10 }}>
                <h4>失败原因：</h4>
                <ul style={{ maxHeight: 200, overflowY: 'auto' }}>
                  {importResult.errors.map((error: any, index: number) => (
                    <li key={index} style={{ color: 'red' }}>
                      {error.error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CategoryPage;
