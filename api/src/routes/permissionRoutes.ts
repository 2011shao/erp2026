import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { getPermissions, assignPermissions, removePermission } from '../controllers/permissionController';

const router = express.Router();

// 权限管理API
router.get('/permissions', authenticate, getPermissions);
router.post('/roles/:id/permissions', authenticate, authorize(['admin']), assignPermissions);
router.delete('/roles/:id/permissions/:permissionId', authenticate, authorize(['admin']), removePermission);

export default router;