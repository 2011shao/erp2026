import React, { useState, useEffect } from 'react';
import { Card, Button, Select, DatePicker, message, Tabs, Typography } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';
import { reportApi, salesApi, financialApi, inventoryApi } from '../api';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;
const { Title, Text } = Typography;

const ReportPage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [selectedShop, setSelectedShop] = useState<string>('');
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [salesTrend, setSalesTrend] = useState<any[]>([]);
  const [inventoryStatus, setInventoryStatus] = useState<any[]>([]);
  const [financialAnalysis, setFinancialAnalysis] = useState<any[]>([]);
  const [shopComparison, setShopComparison] = useState<any[]>([]);

  const fetchSalesTrend = async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    try {
      const response = await reportApi.getSalesTrend({ shopId: selectedShop });
      setSalesTrend(response.data);
    } catch (error) {
      message.error('获取销售趋势失败');
      console.error('获取销售趋势失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInventoryStatus = async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    try {
      const response = await reportApi.getInventoryStatus({ shopId: selectedShop });
      setInventoryStatus(response.data);
    } catch (error) {
      message.error('获取库存状态失败');
      console.error('获取库存状态失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFinancialAnalysis = async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    try {
      const response = await reportApi.getFinancialAnalysis({ shopId: selectedShop });
      setFinancialAnalysis(response.data);
    } catch (error) {
      message.error('获取财务分析失败');
      console.error('获取财务分析失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchShopComparison = async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    try {
      const response = await reportApi.getShopComparison();
      setShopComparison(response.data);
    } catch (error) {
      message.error('获取店铺对比失败');
      console.error('获取店铺对比失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchSalesTrend();
      fetchInventoryStatus();
      fetchFinancialAnalysis();
      fetchShopComparison();
    }
  }, [isAuthenticated, selectedShop]);

  const handleRefresh = () => {
    fetchSalesTrend();
    fetchInventoryStatus();
    fetchFinancialAnalysis();
    fetchShopComparison();
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 筛选条件 */}
      <Card
        title="报表筛选"
        extra={
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
          >
            刷新
          </Button>
        }
      >
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <div>
            <Text strong>店铺:</Text>
            <Select
              placeholder="选择店铺"
              value={selectedShop}
              onChange={setSelectedShop}
              style={{ width: 200, marginLeft: 8 }}
            >
              {/* 这里应该从shopApi获取店铺列表，暂时使用空选项 */}
            </Select>
          </div>
          <div>
            <Text strong>日期范围:</Text>
            <RangePicker
              onChange={(dates) => {
                if (dates) {
                  setDateRange([dates[0].toISOString(), dates[1].toISOString()]);
                } else {
                  setDateRange(null);
                }
              }}
              style={{ marginLeft: 8 }}
            />
          </div>
        </div>
      </Card>

      {/* 报表内容 */}
      <Tabs defaultActiveKey="sales">
        <TabPane tab="销售趋势" key="sales">
          <Card title="销售趋势分析">
            <div style={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={salesTrend}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="sales" stroke="#8884d8" activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="orders" stroke="#82ca9d" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabPane>

        <TabPane tab="库存状态" key="inventory">
          <Card title="库存状态分析">
            <div style={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={inventoryStatus}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="stock" fill="#8884d8" />
                  <Bar dataKey="lowStock" fill="#ff8042" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabPane>

        <TabPane tab="财务分析" key="financial">
          <Card title="财务分析">
            <div style={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={financialAnalysis}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={150}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {financialAnalysis.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabPane>

        <TabPane tab="店铺对比" key="comparison">
          <Card title="店铺销售对比">
            <div style={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={shopComparison}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="shop" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="sales" fill="#8884d8" />
                  <Bar dataKey="profit" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default ReportPage;