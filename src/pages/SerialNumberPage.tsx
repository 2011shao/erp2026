import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Button, Space, Input, Select, Modal, Form, message } from 'antd';
import { SearchOutlined, EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { serialNumberApi, productApi, shopApi } from '../api';
import { useAuthStore } from '../store/authStore';

const { Option } = Select;

const SerialNumberPage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const [serialNumbers, setSerialNumbers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSerialNumber, setEditingSerialNumber] = useState<any>(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedSerialNumbers, setSelectedSerialNumbers] = useState<string[]>([]);
  const [labelModalVisible, setLabelModalVisible] = useState(false);
  const [form] = Form.useForm();

  const fetchData = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const [serialNumbersRes, productsRes, shopsRes] = await Promise.all([
        serialNumberApi.getAll(),
        productApi.getAll(),
        shopApi.getAllSimple(),
      ]);
      setSerialNumbers(serialNumbersRes.data || []);
      setProducts(productsRes.data || []);
      setShops(shopsRes.data || []);
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

  const filteredSerialNumbers = serialNumbers.filter(sn => {
    const matchesSearch = sn.serialNumber.toLowerCase().includes(searchText.toLowerCase()) ||
      (sn.product?.name && sn.product.name.toLowerCase().includes(searchText.toLowerCase()));
    const matchesStatus = !statusFilter || sn.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAdd = () => {
    setEditingSerialNumber(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (serialNumber: any) => {
    setEditingSerialNumber(serialNumber);
    form.setFieldsValue(serialNumber);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个串号吗？',
      onOk: async () => {
        try {
          message.loading('删除中...');
          await serialNumberApi.delete(id);
          message.success('删除成功');
          fetchData();
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      message.loading('保存中...');
      
      if (editingSerialNumber) {
        await serialNumberApi.update(editingSerialNumber.id, values);
      } else {
        await serialNumberApi.create(values);
      }
      
      message.success('保存成功');
      setModalVisible(false);
      fetchData();
    } catch (error) {
      message.error('保存失败');
    }
  };

  const handlePrint = () => {
    // 打印选中的串号
    const selectedItems = serialNumbers.filter(sn => selectedSerialNumbers.includes(sn.id));
    const printContent = selectedItems.map(sn => {
      return `串号: ${sn.serialNumber}\n商品: ${sn.product?.name || '未知'}\n状态: ${getStatusText(sn.status)}\n\n`;
    }).join('');
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write('<html><head><title>串号打印</title></head><body>');
      printWindow.document.write('<pre>' + printContent + '</pre>');
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.print();
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      in_stock: '在库',
      sold: '已售出',
      repairing: '维修中',
      returned: '已退货',
      scrapped: '已报废',
      locked: '锁定',
      returned_to_supplier: '退回供应商',
      transferring: '调拨中',
      stocktaking: '盘点中'
    };
    return statusMap[status] || status;
  };

  const handleGenerateLabels = () => {
    // 生成标签
    const selectedItems = serialNumbers.filter(sn => selectedSerialNumbers.includes(sn.id));
    
    // 生成HTML格式的标签
    let labelHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          .label {
            border: 1px solid #000;
            padding: 10px;
            margin: 10px;
            width: 200px;
            float: left;
            font-family: Arial, sans-serif;
          }
          .label h3 {
            margin: 0 0 10px 0;
            text-align: center;
            border-bottom: 1px solid #000;
            padding-bottom: 5px;
          }
          .label p {
            margin: 5px 0;
            font-size: 12px;
          }
          .clear {
            clear: both;
          }
        </style>
      </head>
      <body>
    `;
    
    selectedItems.forEach(sn => {
      labelHtml += `
        <div class="label">
          <h3>串号标签</h3>
          <p><strong>串号:</strong> ${sn.serialNumber}</p>
          <p><strong>商品:</strong> ${sn.product?.name || '未知'}</p>
          <p><strong>品牌:</strong> ${sn.product?.brand || '未知'}</p>
          <p><strong>型号:</strong> ${sn.product?.model || '未知'}</p>
          <p><strong>状态:</strong> ${getStatusText(sn.status)}</p>
          <p><strong>创建时间:</strong> ${new Date(sn.createdAt).toLocaleString('zh-CN')}</p>
        </div>
      `;
    });
    
    labelHtml += `
        <div class="clear"></div>
      </body>
      </html>
    `;
    
    // 创建下载链接
    const blob = new Blob([labelHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `串号标签_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    message.success('标签生成成功');
    setLabelModalVisible(false);
  };

  const columns = [
    {
      title: '串号',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      render: (serialNumber: string) => <span style={{ fontWeight: 500 }}>{serialNumber}</span>,
    },
    {
      title: '商品',
      dataIndex: ['product', 'name'],
      key: 'product',
      render: (name: string, record: any) => (
        <div>
          <div>{name}</div>
          {record.product?.brand && record.product?.model && (
            <div style={{ fontSize: '12px', color: '#999' }}>
              {record.product.brand} {record.product.model}
            </div>
          )}
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'blue';
        let text = status;
        
        switch (status) {
          case 'in_stock':
            color = 'green';
            text = '在库';
            break;
          case 'sold':
            color = 'red';
            text = '已售出';
            break;
          case 'repairing':
            color = 'orange';
            text = '维修中';
            break;
          case 'returned':
            color = 'purple';
            text = '已退货';
            break;
          case 'scrapped':
            color = 'gray';
            text = '已报废';
            break;
        }
        
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '店铺',
      dataIndex: ['shop', 'name'],
      key: 'shop',
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
    { value: 'in_stock', label: '在库' },
    { value: 'sold', label: '已售出' },
    { value: 'repairing', label: '维修中' },
    { value: 'returned', label: '已退货' },
    { value: 'scrapped', label: '已报废' },
    { value: 'locked', label: '锁定' },
    { value: 'returned_to_supplier', label: '退回供应商' },
    { value: 'transferring', label: '调拨中' },
    { value: 'stocktaking', label: '盘点中' },
  ];

  return (
    <div>
      <Card
        title="串号管理"
        extra={
          <Space>
            <Button 
              type="default" 
              disabled={selectedSerialNumbers.length === 0}
              onClick={() => setLabelModalVisible(true)}
            >
              批量生成标签
            </Button>
            <Button 
              type="default" 
              disabled={selectedSerialNumbers.length === 0}
              onClick={() => handlePrint()}
            >
              批量打印
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              添加串号
            </Button>
          </Space>
        }
      >
        <div style={{ marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Input
            placeholder="搜索串号或商品名称"
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
          dataSource={filteredSerialNumbers}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          rowSelection={{
            selectedRowKeys: selectedSerialNumbers,
            onChange: (selectedKeys: React.Key[]) => {
              setSelectedSerialNumbers(selectedKeys as string[]);
            },
          }}
        />
      </Card>

      <Modal
        title={editingSerialNumber ? '编辑串号' : '添加串号'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="serialNumber"
            label="串号"
            rules={[{ required: true, message: '请输入串号' }]}
          >
            <Input placeholder="请输入串号" />
          </Form.Item>
          <Form.Item
            name="productId"
            label="商品"
            rules={[{ required: true, message: '请选择商品' }]}
          >
            <Select placeholder="请选择商品">
              {products.map(product => (
                <Option key={product.id} value={product.id}>
                  {product.name} ({product.brand} {product.model})
                </Option>
              ))}
            </Select>
          </Form.Item>
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
        title="批量生成标签"
        open={labelModalVisible}
        onOk={() => handleGenerateLabels()}
        onCancel={() => setLabelModalVisible(false)}
        width={500}
      >
        <div style={{ padding: '20px 0' }}>
          <p>已选择 {selectedSerialNumbers.length} 个串号</p>
          <p>标签将包含以下信息：</p>
          <ul>
            <li>串号</li>
            <li>商品名称</li>
            <li>状态</li>
            <li>创建时间</li>
          </ul>
          <p>点击确定后将生成标签并下载</p>
        </div>
      </Modal>
    </div>
  );
};

export default SerialNumberPage;