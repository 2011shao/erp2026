import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { createRole, getRoles, getRole, updateRole, deleteRole, getRolePermissions, updateRolePermissions } from '../controllers/roleController';

const router = express.Router();

// 角色管理API
router.get('/roles', authenticate, authorize(['admin']), getRoles);
router.get('/roles/:id', authenticate, authorize(['admin']), getRole);
router.post('/roles', authenticate, authorize(['admin']), createRole);
router.put('/roles/:id', authenticate, authorize(['admin']), updateRole);
router.delete('/roles/:id', authenticate, authorize(['admin']), deleteRole);

// 角色权限管理API
router.get('/roles/:id/permissions', authenticate, authorize(['admin']), getRolePermissions);
router.put('/roles/:id/permissions', authenticate, authorize(['admin']), updateRolePermissions);

export default router;