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
  Tabs,
  Divider,
  Badge,
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
  const [products, setProducts] = useState<Product[]>([]);
  const [form] = Form.useForm();
  const [selectedOrder, setSelectedOrder] = useState<StockInOrder | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');
  const [searchParams, setSearchParams] = useState({
    brand: '',
    category: '',
    model: '',
  });
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [serialNumberMethod, setSerialNumberMethod] = useState<'manual' | 'auto'>('manual');
  const [serialNumbers, setSerialNumbers] = useState<string>('');
  const [quantity, setQuantity] = useState(1);

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

  const searchProducts = async () => {
    try {
      const response = await productApi.getAll({
        brand: searchParams.brand,
        categoryId: searchParams.category,
        model: searchParams.model,
      });
      if (response.success) {
        setProducts(response.data || []);
      }
    } catch (error) {
      console.error('搜索商品失败', error);
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
    setCurrentStep(1);
    setSelectedSupplier('');
    setSearchParams({ brand: '', category: '', model: '' });
    setSelectedProducts([]);
    setSerialNumberMethod('manual');
    setSerialNumbers('');
    setQuantity(1);
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

  const handleProductSelect = (product: Product) => {
    const brand = brands.find(b => b.id === product.brandId);
    setSelectedProducts([...selectedProducts, {
      productId: product.id,
      productName: product.name,
      brand: brand?.name || '',
      model: product.model,
      quantity: 1,
      price: product.price,
      costPrice: product.costPrice || product.price,
      serialNumbers: [],
    }]);
  };

  const handleRemoveProduct = (index: number) => {
    const newProducts = [...selectedProducts];
    newProducts.splice(index, 1);
    setSelectedProducts(newProducts);
  };

  const handleSerialNumberChange = (e: any, index: number) => {
    const newProducts = [...selectedProducts];
    newProducts[index].serialNumbers = e.target.value
      .split(/[,;\s]+/)
      .filter((s: string) => s.trim() !== '');
    setSelectedProducts(newProducts);
  };

  const handleQuantityChange = (value: number, index: number) => {
    const newProducts = [...selectedProducts];
    newProducts[index].quantity = value;
    setSelectedProducts(newProducts);
  };

  const handlePriceChange = (value: number, index: number) => {
    const newProducts = [...selectedProducts];
    newProducts[index].price = value;
    setSelectedProducts(newProducts);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      const items = selectedProducts.map(product => ({
        productId: product.productId,
        quantity: product.quantity,
        price: product.price,
        costPrice: product.costPrice,
        serialNumbers: product.serialNumbers,
        generateSerialNumbers: serialNumberMethod === 'auto',
      }));

      const response = await stockInApi.create({
        supplierId: selectedSupplier,
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
        <Tabs activeKey={currentStep.toString()} onChange={(key) => setCurrentStep(Number(key))}>
          <TabPane tab="步骤 1: 选择供货商" key="1">
            <Form form={form} layout="vertical">
              <Form.Item
                name="supplierId"
                label="选择供货商"
                rules={[{ required: true, message: '请选择供货商' }]}
              >
                <Select
                  placeholder="请选择供货商"
                  style={{ width: '100%' }}
                  onChange={setSelectedSupplier}
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
            </Form>
            <div className="mt-4">
              <Button type="primary" onClick={() => setCurrentStep(2)}>
                下一步
              </Button>
            </div>
          </TabPane>
          
          <TabPane tab="步骤 2: 选择商品" key="2">
            <div className="mb-4">
              <h3 className="mb-2">搜索商品</h3>
              <Space>
                <Select
                  placeholder="选择分类"
                  value={searchParams.category}
                  onChange={(value) => setSearchParams({ ...searchParams, category: value })}
                  style={{ width: 150 }}
                  allowClear
                >
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
                <Select
                  placeholder="选择品牌"
                  value={searchParams.brand}
                  onChange={(value) => setSearchParams({ ...searchParams, brand: value })}
                  style={{ width: 150 }}
                  allowClear
                >
                  {brands.map(brand => (
                    <Option key={brand.id} value={brand.id}>{brand.name}</Option>
                  ))}
                </Select>
                <Input
                  placeholder="型号"
                  value={searchParams.model}
                  onChange={(e) => setSearchParams({ ...searchParams, model: e.target.value })}
                  style={{ width: 150 }}
                />
                <Button type="primary" onClick={searchProducts}>
                  搜索
                </Button>
              </Space>
            </div>
            
            <div className="mb-4">
              <h3 className="mb-2">搜索结果</h3>
              <Table
                columns={[
                  { title: '商品名称', dataIndex: 'name', key: 'name' },
                  { 
                    title: '品牌', 
                    dataIndex: 'brandId', 
                    key: 'brand', 
                    render: (brandId: string) => {
                      const brand = brands.find(b => b.id === brandId);
                      return brand?.name || '-';
                    }
                  },
                  { title: '型号', dataIndex: 'model', key: 'model' },
                  { title: '价格', dataIndex: 'price', key: 'price', render: (price: number) => `¥${price.toFixed(2)}` },
                  { 
                    title: '操作', 
                    key: 'action', 
                    render: (_: any, record: Product) => (
                      <Button type="link" onClick={() => handleProductSelect(record)}>
                        选择
                      </Button>
                    ) 
                  },
                ]}
                dataSource={products}
                rowKey="id"
                pagination={{ pageSize: 5 }}
              />
            </div>
            
            <div className="mb-4">
              <h3 className="mb-2">已选商品</h3>
              <Table
                columns={[
                  { title: '商品名称', dataIndex: 'productName', key: 'productName' },
                  { title: '品牌', dataIndex: 'brand', key: 'brand' },
                  { title: '型号', dataIndex: 'model', key: 'model' },
                  { 
                    title: '数量', 
                    key: 'quantity', 
                    render: (_: any, record: any, index: number) => (
                      <InputNumber 
                        min={1} 
                        value={record.quantity} 
                        onChange={(value) => handleQuantityChange(value || 1, index)} 
                      />
                    ) 
                  },
                  { 
                    title: '成本价', 
                    key: 'costPrice', 
                    render: (_: any, record: any, index: number) => (
                      <InputNumber 
                        min={0} 
                        value={record.costPrice} 
                        onChange={(value) => {
                          const newProducts = [...selectedProducts];
                          newProducts[index].costPrice = value || 0;
                          setSelectedProducts(newProducts);
                        }} 
                      />
                    ) 
                  },
                  { 
                    title: '售价', 
                    key: 'price', 
                    render: (_: any, record: any, index: number) => (
                      <InputNumber 
                        min={0} 
                        value={record.price} 
                        onChange={(value) => handlePriceChange(value || 0, index)} 
                      />
                    ) 
                  },
                  { 
                    title: '串码', 
                    key: 'serialNumbers', 
                    render: (_: any, record: any, index: number) => (
                      <TextArea 
                        rows={2} 
                        placeholder="请输入串码，多个串码用逗号、分号或空格分隔" 
                        value={record.serialNumbers.join('\n')} 
                        onChange={(e) => handleSerialNumberChange(e, index)} 
                      />
                    ) 
                  },
                  { 
                    title: '操作', 
                    key: 'action', 
                    render: (_: any, record: any, index: number) => (
                      <Button type="link" danger onClick={() => handleRemoveProduct(index)}>
                        删除
                      </Button>
                    ) 
                  },
                ]}
                dataSource={selectedProducts}
                rowKey={(record, index) => index}
              />
            </div>
            
            <div className="mt-4">
              <Space>
                <Button onClick={() => setCurrentStep(1)}>
                  上一步
                </Button>
                <Button type="primary" onClick={() => setCurrentStep(3)}>
                  下一步
                </Button>
              </Space>
            </div>
          </TabPane>
          
          <TabPane tab="步骤 3: 确认信息" key="3">
            <Descriptions column={1}>
              <Descriptions.Item label="供货商">
                {suppliers.find(s => s.id === selectedSupplier)?.name || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="商品清单">
                <Table
                  columns={[
                    { title: '商品名称', dataIndex: 'productName', key: 'productName' },
                    { title: '品牌', dataIndex: 'brand', key: 'brand' },
                    { title: '型号', dataIndex: 'model', key: 'model' },
                    { title: '数量', dataIndex: 'quantity', key: 'quantity' },
                    { title: '单价', dataIndex: 'price', key: 'price', render: (price: number) => `¥${price.toFixed(2)}` },
                    { 
                      title: '串码数量', 
                      key: 'serialNumbersCount', 
                      render: (_, record: any) => record.serialNumbers.length 
                    },
                  ]}
                  dataSource={selectedProducts}
                  rowKey={(record, index) => index}
                  pagination={false}
                />
              </Descriptions.Item>
              <Descriptions.Item label="总金额">
                ¥{selectedProducts.reduce((total, product) => total + product.quantity * product.price, 0).toFixed(2)}
              </Descriptions.Item>
            </Descriptions>
            
            <div className="mt-4">
              <Space>
                <Button onClick={() => setCurrentStep(2)}>
                  上一步
                </Button>
                <Button type="primary" onClick={handleSubmit}>
                  确认创建
                </Button>
              </Space>
            </div>
          </TabPane>
        </Tabs>
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