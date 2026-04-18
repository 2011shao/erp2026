import React, { useState, useEffect, useRef } from 'react';
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
  Divider,
  Badge,
  AutoComplete,
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  CheckOutlined, 
  CloseOutlined, 
  EyeOutlined 
} from '@ant-design/icons';
import { stockInApi, supplierApi, productApi, categoryApi, brandApi, StockInOrder, Supplier, Product } from '../api';

const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

const StockInPage: React.FC = () => {
  const [orders, setOrders] = useState<StockInOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [form] = Form.useForm();
  const [selectedOrder, setSelectedOrder] = useState<StockInOrder | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await stockInApi.getAll();
      if (response.success) {
        setOrders(response.data || []);
      } else {
        message.error('获取入库单列表失败');
      }
    } catch (error) {
      message.error('获取入库单列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await supplierApi.getAll({ status: 'active' });
      if (response.success) {
        setSuppliers(response.data || []);
      }
    } catch (error) {
      console.error('获取供货商列表失败', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoryApi.getTree();
      if (response.success) {
        setCategories(response.data || []);
      }
    } catch (error) {
      console.error('获取分类列表失败', error);
    }
  };

  const fetchBrands = async () => {
    try {
      const response = await brandApi.getAll();
      if (response.success) {
        setBrands(response.data || []);
      }
    } catch (error) {
      console.error('获取品牌列表失败', error);
    }
  };

  const searchProducts = async (brand: string, category: string, model: string) => {
    if (!model) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const response = await productApi.getAll({
        brand,
        categoryId: category,
        model,
      });
      if (response.success) {
        setSearchResults(response.data || []);
      }
    } catch (error) {
      console.error('搜索商品失败', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchSuppliers();
    fetchCategories();
    fetchBrands();
  }, []);

  const handleAdd = () => {
    form.resetFields();
    setSelectedProducts([]);
    setSearchResults([]);
    setVisible(true);
  };

  const handleView = (order: StockInOrder) => {
    setSelectedOrder(order);
    setDetailVisible(true);
  };

  const handleComplete = async (id: string) => {
    try {
      const response = await stockInApi.complete(id);
      if (response.success) {
        message.success('入库成功');
        fetchOrders();
      } else {
        message.error('入库失败');
      }
    } catch (error) {
      message.error('入库失败');
    }
  };

  const handleCancel = async (id: string) => {
    try {
      const response = await stockInApi.cancel(id);
      if (response.success) {
        message.success('取消成功');
        fetchOrders();
      } else {
        message.error('取消失败');
      }
    } catch (error) {
      message.error('取消失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await stockInApi.delete(id);
      if (response.success) {
        message.success('删除成功');
        fetchOrders();
      } else {
        message.error('删除失败');
      }
    } catch (error) {
      message.error('删除失败');
    }
  };



  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      const items = (values.products || []).map((product: any) => ({
        productId: product.productId || '',
        quantity: product.quantity,
        price: product.price,
        costPrice: product.costPrice,
        serialNumbers: product.serialNumbers
          ? product.serialNumbers
              .split(/[,;\s]+/)
              .filter((s: string) => s.trim() !== '')
          : [],
        generateSerialNumbers: false,
      }));

      const response = await stockInApi.create({
        supplierId: values.supplierId,
        notes: values.notes,
        items,
      });

      if (response.success) {
        message.success('创建入库单成功');
        setVisible(false);
        fetchOrders();
      } else {
        message.error('创建入库单失败');
      }
    } catch (error) {
      message.error('表单验证失败');
    }
  };

  const columns = [
    {
      title: '入库单号',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '供货商',
      dataIndex: 'supplier',
      key: 'supplier',
      render: (supplier: any) => supplier?.name || '-',
    },
    {
      title: '总金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number) => `¥${amount.toFixed(2)}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = '';
        let text = '';
        switch (status) {
          case 'pending':
            color = 'blue';
            text = '待处理';
            break;
          case 'completed':
            color = 'green';
            text = '已完成';
            break;
          case 'cancelled':
            color = 'red';
            text = '已取消';
            break;
          default:
            color = 'default';
            text = status;
        }
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: StockInOrder) => (
        <Space size="middle">
          <Tooltip title="查看详情">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleView(record)}
            />
          </Tooltip>
          {record.status === 'pending' && (
            <>
              <Tooltip title="完成入库">
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={() => handleComplete(record.id)}
                />
              </Tooltip>
              <Tooltip title="取消入库">
                <Button
                  danger
                  icon={<CloseOutlined />}
                  onClick={() => handleCancel(record.id)}
                />
              </Tooltip>
            </>
          )}
          <Tooltip title="删除">
            <Popconfirm
              title="确定要删除这个入库单吗？"
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
        <h1 className="text-2xl font-bold">入库管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增入库单
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={orders}
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
        title="新增入库单"
        open={visible}
        onOk={handleSubmit}
        onCancel={() => setVisible(false)}
        width={1000}
        footer={[
          <Button key="back" onClick={() => setVisible(false)}>
            取消
          </Button>,
          <Button key="submit" type="primary" onClick={handleSubmit}>
            提交
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="supplierId"
            label="选择供货商"
            rules={[{ required: true, message: '请选择供货商' }]}
          >
            <Select
              placeholder="请选择供货商"
              style={{ width: '100%' }}
            >
              {suppliers.map((supplier) => (
                <Option key={supplier.id} value={supplier.id}>
                  {supplier.name} - {supplier.contactName} {supplier.contactPhone}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="notes"
            label="备注"
          >
            <TextArea rows={3} placeholder="请输入备注信息" />
          </Form.Item>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">商品信息</h3>
            
            <div className="mb-4">
              <h4 className="font-medium mb-2">添加商品</h4>
              <Form.List name="products">
                {(fields, { add, remove }) => (
                  <div>
                    {fields.map((field, index) => (
                      <Card key={field.key} className="mb-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Form.Item
                            {...field}
                            name={[field.name, 'categoryId']}
                            label="分类"
                            rules={[{ required: true, message: '请选择分类' }]}
                          >
                            <Select placeholder="选择分类" style={{ width: '100%' }} allowClear>
                              {categories.map(category => (
                                <React.Fragment key={category.id}>
                                  <Option value={category.id}>{category.name}</Option>
                                  {category.children?.map(child => (
                                    <Option key={child.id} value={child.id}>
                                      &nbsp;&nbsp;└ {child.name}
                                    </Option>
                                  ))}
                                </React.Fragment>
                              ))}
                            </Select>
                          </Form.Item>
                          
                          <Form.Item
                            {...field}
                            name={[field.name, 'brandId']}
                            label="品牌"
                            rules={[{ required: true, message: '请选择品牌' }]}
                          >
                            <Select placeholder="选择品牌" style={{ width: '100%' }} allowClear>
                              {brands.map(brand => (
                                <Option key={brand.id} value={brand.id}>{brand.name}</Option>
                              ))}
                            </Select>
                          </Form.Item>
                          
                          <Form.Item
                            {...field}
                            name={[field.name, 'model']}
                            label="型号"
                            rules={[{ required: true, message: '请输入型号' }]}
                          >
                            <AutoComplete
                              options={searchResults.map(product => ({
                                value: product.model,
                                label: `${product.name} - ${brands.find(b => b.id === product.brandId)?.name} - ${product.model}`,
                              }))}
                              onSelect={(value, option) => {
                                const selectedProduct = searchResults.find(p => p.model === value);
                                if (selectedProduct) {
                                  form.setFieldsValue({
                                    products: fields.map((f, i) => {
                                      if (i === index) {
                                        return {
                                          ...fields[i].value,
                                          productId: selectedProduct.id,
                                          productName: selectedProduct.name,
                                          price: selectedProduct.price,
                                          costPrice: selectedProduct.costPrice || selectedProduct.price,
                                        };
                                      }
                                      return f.value;
                                    }),
                                  });
                                }
                              }}
                              onSearch={(value) => {
                                const currentField = fields[index].value;
                                const brandId = currentField?.brandId || '';
                                const categoryId = currentField?.categoryId || '';
                                
                                if (searchTimeoutRef.current) {
                                  clearTimeout(searchTimeoutRef.current);
                                }
                                searchTimeoutRef.current = setTimeout(() => {
                                  searchProducts(brandId, categoryId, value);
                                }, 300);
                              }}
                            >
                              <Input placeholder="输入型号" />
                            </AutoComplete>
                          </Form.Item>
                          
                          <Form.Item
                            {...field}
                            name={[field.name, 'productName']}
                            label="商品名称"
                          >
                            <Input placeholder="商品名称" />
                          </Form.Item>
                          
                          <Form.Item
                            {...field}
                            name={[field.name, 'quantity']}
                            label="数量"
                            rules={[{ required: true, message: '请输入数量' }, { type: 'number', min: 1 }]}
                          >
                            <InputNumber min={1} placeholder="输入数量" style={{ width: '100%' }} />
                          </Form.Item>
                          
                          <Form.Item
                            {...field}
                            name={[field.name, 'costPrice']}
                            label="成本价"
                            rules={[{ required: true, message: '请输入成本价' }, { type: 'number', min: 0 }]}
                          >
                            <InputNumber min={0} placeholder="输入成本价" style={{ width: '100%' }} />
                          </Form.Item>
                          
                          <Form.Item
                            {...field}
                            name={[field.name, 'price']}
                            label="售价"
                            rules={[{ required: true, message: '请输入售价' }, { type: 'number', min: 0 }]}
                          >
                            <InputNumber min={0} placeholder="输入售价" style={{ width: '100%' }} />
                          </Form.Item>
                          
                          <Form.Item
                            {...field}
                            name={[field.name, 'serialNumbers']}
                            label="串码"
                            rules={[{ required: true, message: '请输入串码' }]}
                          >
                            <TextArea 
                              rows={2} 
                              placeholder="请输入串码，多个串码用逗号、分号或空格分隔" 
                            />
                          </Form.Item>
                        </div>
                        <div className="mt-3 text-right">
                          <Button danger onClick={() => remove(field.name)}>
                            删除商品
                          </Button>
                        </div>
                      </Card>
                    ))}
                    <Button type="dashed" onClick={() => add()} block>
                      <PlusOutlined /> 添加商品
                    </Button>
                  </div>
                )}
              </Form.List>
            </div>
          </div>
        </Form>
      </Modal>

      <Modal
        title="入库单详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>,
        ]}
        width={1000}
      >
        {selectedOrder && (
          <div>
            <Descriptions column={2}>
              <Descriptions.Item label="入库单号">{selectedOrder.id}</Descriptions.Item>
              <Descriptions.Item label="供货商">{selectedOrder.supplier?.name || '-'}</Descriptions.Item>
              <Descriptions.Item label="总金额">¥{selectedOrder.totalAmount.toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={
                  selectedOrder.status === 'completed' ? 'green' : 
                  selectedOrder.status === 'cancelled' ? 'red' : 'blue'
                }>
                  {selectedOrder.status === 'pending' ? '待处理' : 
                   selectedOrder.status === 'completed' ? '已完成' : '已取消'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="备注">{selectedOrder.notes || '-'}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{selectedOrder.createdAt}</Descriptions.Item>
              <Descriptions.Item label="更新时间">{selectedOrder.updatedAt}</Descriptions.Item>
            </Descriptions>
            
            <Divider>商品清单</Divider>
            <Table
              columns={[
                { title: '商品名称', dataIndex: 'product', key: 'product', render: (product: any) => product?.name || '-' },
                { title: '品牌', dataIndex: 'product', key: 'brand', render: (product: any) => product?.brand?.name || '-' },
                { title: '型号', dataIndex: 'product', key: 'model', render: (product: any) => product?.model || '-' },
                { title: '数量', dataIndex: 'quantity', key: 'quantity' },
                { title: '单价', dataIndex: 'price', key: 'price', render: (price: number) => `¥${price.toFixed(2)}` },
                { title: '串码数量', key: 'serialNumbersCount', render: (_, record: any) => record.serialNumbers.length },
              ]}
              dataSource={selectedOrder.items}
              rowKey="id"
            />
            
            {selectedOrder.logs && selectedOrder.logs.length > 0 && (
              <>
                <Divider>操作日志</Divider>
                <Table
                  columns={[
                    { title: '操作时间', dataIndex: 'createdAt', key: 'createdAt' },
                    { title: '操作类型', dataIndex: 'type', key: 'type' },
                    { title: '操作内容', dataIndex: 'description', key: 'description' },
                  ]}
                  dataSource={selectedOrder.logs}
                  rowKey="id"
                />
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default StockInPage;