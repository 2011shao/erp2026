import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { getPermissions, getPermission, createPermission, updatePermission, deletePermission, assignPermissions, removePermission } from '../controllers/permissionController';

const router = express.Router();

// 权限管理API
router.get('/permissions', authenticate, getPermissions);
router.get('/permissions/:id', authenticate, getPermission);
router.post('/permissions', authenticate, authorize(['admin']), createPermission);
router.put('/permissions/:id', authenticate, authorize(['admin']), updatePermission);
router.delete('/permissions/:id', authenticate, authorize(['admin']), deletePermission);
router.post('/roles/:id/permissions', authenticate, authorize(['admin']), assignPermissions);
router.delete('/roles/:id/permissions/:permissionId', authenticate, authorize(['admin']), removePermission);

export default router;