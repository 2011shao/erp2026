import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Statistic, Row, Col } from 'antd';
import { DollarOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { financialApi } from '../api';
import { useAuthStore } from '../store/authStore';

const FinancialPage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const response = await financialApi.getAll();
      setRecords(response.data || []);
    } catch (error) {
      console.error('Error fetching financial records:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isAuthenticated]);

  const incomeRecords = records.filter(r => r.type === 'income');
  const expenseRecords = records.filter(r => r.type === 'expense');
  const totalIncome = incomeRecords.reduce((sum, r) => sum + Number(r.amount), 0);
  const totalExpense = expenseRecords.reduce((sum, r) => sum + Number(r.amount), 0);
  const netProfit = totalIncome - totalExpense;

  const columns = [
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag icon={type === 'income' ? <ArrowUpOutlined /> : <ArrowDownOutlined />} color={type === 'income' ? 'green' : 'red'}>
          {type === 'income' ? '收入' : '支出'}
        </Tag>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: string, record: any) => (
        <span style={{ 
          color: record.type === 'income' ? '#3f8600' : '#cf1322', 
          fontWeight: 500 
        }}>
          {record.type === 'income' ? '+' : '-'}¥{amount}
        </span>
      ),
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
  ];

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总收入"
              value={totalIncome}
              precision={2}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总支出"
              value={totalExpense}
              precision={2}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="净利润"
              value={netProfit}
              precision={2}
              prefix={<DollarOutlined />}
              valueStyle={{ color: netProfit >= 0 ? '#3f8600' : '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="记录条数"
              value={records.length}
            />
          </Card>
        </Col>
      </Row>

      <Card title="财务管理" extra={<div>共 {records.length} 条记录</div>}>
        <Table
          columns={columns}
          dataSource={records}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default FinancialPage;
