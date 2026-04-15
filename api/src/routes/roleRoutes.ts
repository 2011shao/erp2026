import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { createRole, getRoles, getRole, updateRole, deleteRole } from '../controllers/roleController';

const router = express.Router();

// 角色管理API
router.get('/roles', authenticate, authorize(['admin']), getRoles);
router.get('/roles/:id', authenticate, authorize(['admin']), getRole);
router.post('/roles', authenticate, authorize(['admin']), createRole);
router.put('/roles/:id', authenticate, authorize(['admin']), updateRole);
router.delete('/roles/:id', authenticate, authorize(['admin']), deleteRole);

export default router;