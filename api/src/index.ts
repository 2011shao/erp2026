import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './routes/userRoutes.ts';
import shopRoutes from './routes/shopRoutes.ts';
import productRoutes from './routes/productRoutes.ts';
import inventoryRoutes from './routes/inventoryRoutes.ts';
import salesRoutes from './routes/salesRoutes.ts';
import financialRoutes from './routes/financialRoutes.ts';
import reportRoutes from './routes/reportRoutes.ts';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.BACKEND_PORT || 8000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend server is running' });
});

// API 路由
app.use('/api/users', userRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/products', productRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/financial', financialRoutes);
app.use('/api/reports', reportRoutes);

// 404 处理
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// 错误处理中间件
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
