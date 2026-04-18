import express from 'express';
import { 
  getStockInOrders, 
  getStockInOrderById, 
  createStockInOrder, 
  addSerialNumbers, 
  confirmStockInOrder, 
  cancelStockInOrder, 
  deleteStockInOrder,
  searchProducts
} from '../controllers/stockInController';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// 获取入库单列表
router.get('/', authenticate, getStockInOrders);

// 搜索商品（用于入库单选择）
router.get('/search-products', authenticate, searchProducts);

// 获取单个入库单详情
router.get('/:id', authenticate, getStockInOrderById);

// 创建入库单
router.post('/', authenticate, authorize(['admin', 'manager', 'staff']), createStockInOrder);

// 添加串号
router.post('/add-serial-numbers', authenticate, authorize(['admin', 'manager', 'staff']), addSerialNumbers);

// 确认入库
router.put('/:id/confirm', authenticate, authorize(['admin', 'manager']), confirmStockInOrder);

// 取消入库
router.put('/:id/cancel', authenticate, authorize(['admin', 'manager']), cancelStockInOrder);

// 删除入库单
router.delete('/:id', authenticate, authorize(['admin']), deleteStockInOrder);

export default router;
