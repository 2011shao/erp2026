import express from 'express';
import { getSuppliers, getSupplierById, createSupplier, updateSupplier, deleteSupplier, getSuppliersSimple } from '../controllers/supplierController';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// 获取供货商列表
router.get('/', authenticate, getSuppliers);

// 获取简化版供货商列表（用于下拉选择）
router.get('/simple', authenticate, getSuppliersSimple);

// 获取单个供货商详情
router.get('/:id', authenticate, getSupplierById);

// 创建供货商
router.post('/', authenticate, authorize(['admin', 'manager']), createSupplier);

// 更新供货商
router.put('/:id', authenticate, authorize(['admin', 'manager']), updateSupplier);

// 删除供货商
router.delete('/:id', authenticate, authorize(['admin']), deleteSupplier);

export default router;
