import { Router, type Request, type Response } from 'express';
import { authenticate } from '../middleware/auth';
import { validateTransferOrder } from '../utils/validators';
import { logSerialNumberStatusChange } from '../utils/serialNumberUtils';
import prisma from '../lib/prisma';

const router = Router();

// 应用认证中间件
router.use(authenticate);

// 获取调拨订单列表
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10, status, fromWarehouseId, toWarehouseId, search } = req.query;
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (fromWarehouseId) {
      where.fromWarehouseId = fromWarehouseId;
    }

    if (toWarehouseId) {
      where.toWarehouseId = toWarehouseId;
    }

    if (search) {
      where.OR = [
        { reason: { contains: search as string, mode: 'insensitive' } },
        { fromWarehouse: { name: { contains: search as string, mode: 'insensitive' } } },
        { toWarehouse: { name: { contains: search as string, mode: 'insensitive' } } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [transferOrders, total] = await Promise.all([
      prisma.transferOrder.findMany({
        where,
        include: {
          fromWarehouse: { select: { id: true, name: true, code: true } },
          toWarehouse: { select: { id: true, name: true, code: true } },
          operator: { select: { id: true, username: true } },
          items: {
            include: {
              product: { select: { id: true, name: true, brand: true, model: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.transferOrder.count({ where })
    ]);

    res.json({
      success: true,
      data: transferOrders,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching transfer orders:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch transfer orders' });
  }
});

// 获取调拨订单详情
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const transferOrder = await prisma.transferOrder.findUnique({
      where: { id },
      include: {
        fromWarehouse: { select: { id: true, name: true, code: true, address: true } },
        toWarehouse: { select: { id: true, name: true, code: true, address: true } },
        operator: { select: { id: true, username: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, brand: true, model: true } },
            serialNumbers: {
              select: { id: true, serialNumber: true, status: true }
            }
          }
        },
        logs: {
          include: {
            operator: { select: { id: true, username: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!transferOrder) {
      res.status(404).json({ success: false, error: 'Transfer order not found' });
      return;
    }

    res.json({ success: true, data: transferOrder });
  } catch (error) {
    console.error('Error fetching transfer order details:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch transfer order details' });
  }
});

// 创建调拨订单
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { fromWarehouseId, toWarehouseId, reason, items } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    // 验证请求数据
    const validationError = validateTransferOrder(req.body);
    if (validationError) {
      res.status(400).json({ success: false, error: validationError });
      return;
    }

    // 开始事务
    const transferOrder = await prisma.$transaction(async (prisma) => {
      // 检查仓库是否存在
      const fromWarehouse = await prisma.warehouse.findUnique({ where: { id: fromWarehouseId } });
      const toWarehouse = await prisma.warehouse.findUnique({ where: { id: toWarehouseId } });

      if (!fromWarehouse || !toWarehouse) {
        throw new Error('Warehouse not found');
      }

      // 检查两个仓库是否属于同一个店铺
      if (fromWarehouse.shopId !== toWarehouse.shopId) {
        throw new Error('Both warehouses must belong to the same shop');
      }

      // 创建调拨订单
      const order = await prisma.transferOrder.create({
        data: {
          fromWarehouseId,
          toWarehouseId,
          shopId: fromWarehouse.shopId,
          operatorId: userId,
          reason,
          status: 'pending',
          totalItems: items.reduce((sum: number, item: any) => sum + item.quantity, 0)
        }
      });

      // 创建调拨订单详情
      for (const item of items) {
        await prisma.transferOrderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity
          }
        });
      }

      // 记录调拨日志
      await prisma.transferLog.create({
        data: {
          transferOrderId: order.id,
          oldStatus: 'none',
          newStatus: 'pending',
          reason: 'Transfer order created',
          operatorId: userId
        }
      });

      return order;
    });

    res.status(201).json({ success: true, data: transferOrder });
  } catch (error: any) {
    console.error('Error creating transfer order:', error);
    res.status(400).json({ success: false, error: error.message || 'Failed to create transfer order' });
  }
});

// 绑定串号到调拨订单
router.post('/:id/serial-numbers', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { serialNumberIds, itemId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    if (!serialNumberIds || !Array.isArray(serialNumberIds) || serialNumberIds.length === 0) {
      res.status(400).json({ success: false, error: 'Serial numbers are required' });
      return;
    }

    if (!itemId) {
      res.status(400).json({ success: false, error: 'Transfer order item ID is required' });
      return;
    }

    // 开始事务
    await prisma.$transaction(async (prisma) => {
      // 检查调拨订单是否存在
      const transferOrder = await prisma.transferOrder.findUnique({ where: { id } });
      if (!transferOrder) {
        throw new Error('Transfer order not found');
      }

      // 检查调拨订单状态
      if (transferOrder.status !== 'pending' && transferOrder.status !== 'processing') {
        throw new Error('Cannot add serial numbers to this transfer order');
      }

      // 检查调拨订单详情是否存在
      const transferOrderItem = await prisma.transferOrderItem.findUnique({ where: { id: itemId } });
      if (!transferOrderItem || transferOrderItem.orderId !== id) {
        throw new Error('Transfer order item not found');
      }

      // 检查串号是否存在且状态为库存中
      const serialNumbers = await prisma.serialNumber.findMany({
        where: {
          id: { in: serialNumberIds },
          status: 'in_stock',
          warehouseId: transferOrder.fromWarehouseId
        }
      });

      if (serialNumbers.length !== serialNumberIds.length) {
        throw new Error('Some serial numbers are not found or not in stock');
      }

      // 绑定串号到调拨订单
      for (const serialNumber of serialNumbers) {
        await prisma.serialNumber.update({
          where: { id: serialNumber.id },
          data: {
            status: 'transferring',
            transferOrderId: transferOrder.id,
            transferOrderItemId: itemId
          }
        });

        // 记录串号状态变更日志
        await logSerialNumberStatusChange(
          serialNumber.id,
          'in_stock',
          'transferring',
          `Transferring to warehouse ${transferOrder.toWarehouseId}`,
          userId
        );
      }
    });

    res.json({ success: true, message: 'Serial numbers bound to transfer order successfully' });
  } catch (error: any) {
    console.error('Error binding serial numbers to transfer order:', error);
    res.status(400).json({ success: false, error: error.message || 'Failed to bind serial numbers' });
  }
});

// 解绑串号从调拨订单
router.delete('/:id/serial-numbers/:serialNumberId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, serialNumberId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    // 开始事务
    await prisma.$transaction(async (prisma) => {
      // 检查调拨订单是否存在
      const transferOrder = await prisma.transferOrder.findUnique({ where: { id } });
      if (!transferOrder) {
        throw new Error('Transfer order not found');
      }

      // 检查调拨订单状态
      if (transferOrder.status !== 'pending' && transferOrder.status !== 'processing') {
        throw new Error('Cannot remove serial numbers from this transfer order');
      }

      // 检查串号是否存在且属于该调拨订单
      const serialNumber = await prisma.serialNumber.findUnique({ where: { id: serialNumberId } });
      if (!serialNumber || serialNumber.transferOrderId !== id) {
        throw new Error('Serial number not found in this transfer order');
      }

      // 解绑串号
      await prisma.serialNumber.update({
        where: { id: serialNumberId },
        data: {
          status: 'in_stock',
          transferOrderId: null,
          transferOrderItemId: null
        }
      });

      // 记录串号状态变更日志
      await logSerialNumberStatusChange(
        serialNumberId,
        'transferring',
        'in_stock',
        'Removed from transfer order',
        userId
      );
    });

    res.json({ success: true, message: 'Serial number removed from transfer order successfully' });
  } catch (error: any) {
    console.error('Error removing serial number from transfer order:', error);
    res.status(400).json({ success: false, error: error.message || 'Failed to remove serial number' });
  }
});

// 获取调拨订单的串号
router.get('/:id/serial-numbers', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // 检查调拨订单是否存在
    const transferOrder = await prisma.transferOrder.findUnique({ where: { id } });
    if (!transferOrder) {
      res.status(404).json({ success: false, error: 'Transfer order not found' });
      return;
    }

    // 获取调拨订单的串号
    const serialNumbers = await prisma.serialNumber.findMany({
      where: { transferOrderId: id },
      include: {
        product: { select: { id: true, name: true, brand: true, model: true } }
      }
    });

    res.json({ success: true, data: serialNumbers });
  } catch (error) {
    console.error('Error fetching transfer order serial numbers:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch serial numbers' });
  }
});

// 更新调拨订单状态
router.put('/:id/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    if (!status) {
      res.status(400).json({ success: false, error: 'Status is required' });
      return;
    }

    // 开始事务
    await prisma.$transaction(async (prisma) => {
      // 检查调拨订单是否存在
      const transferOrder = await prisma.transferOrder.findUnique({ where: { id } });
      if (!transferOrder) {
        throw new Error('Transfer order not found');
      }

      // 检查状态是否有效
      const validStatuses = ['pending', 'processing', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        throw new Error('Invalid status');
      }

      // 检查状态流转是否有效
      const statusFlow: Record<string, string[]> = {
        pending: ['processing', 'cancelled'],
        processing: ['completed', 'cancelled'],
        completed: [],
        cancelled: []
      };

      if (!statusFlow[transferOrder.status]?.includes(status)) {
        throw new Error('Invalid status transition');
      }

      // 如果状态变为已完成，需要更新串号的仓库和状态
      if (status === 'completed') {
        // 获取调拨订单的所有串号
        const serialNumbers = await prisma.serialNumber.findMany({
          where: { transferOrderId: id }
        });

        // 更新串号的仓库和状态
        for (const serialNumber of serialNumbers) {
          await prisma.serialNumber.update({
            where: { id: serialNumber.id },
            data: {
              status: 'in_stock',
              warehouseId: transferOrder.toWarehouseId,
              transferOrderId: null,
              transferOrderItemId: null
            }
          });

          // 记录串号状态变更日志
          await logSerialNumberStatusChange(
            serialNumber.id,
            'transferring',
            'in_stock',
            `Transferred to warehouse ${transferOrder.toWarehouseId}`,
            userId
          );
        }
      }

      // 如果状态变为已取消，需要将串号状态改回库存中
      if (status === 'cancelled') {
        // 获取调拨订单的所有串号
        const serialNumbers = await prisma.serialNumber.findMany({
          where: { transferOrderId: id }
        });

        // 更新串号状态
        for (const serialNumber of serialNumbers) {
          await prisma.serialNumber.update({
            where: { id: serialNumber.id },
            data: {
              status: 'in_stock',
              transferOrderId: null,
              transferOrderItemId: null
            }
          });

          // 记录串号状态变更日志
          await logSerialNumberStatusChange(
            serialNumber.id,
            'transferring',
            'in_stock',
            'Transfer cancelled',
            userId
          );
        }
      }

      // 更新调拨订单状态
      await prisma.transferOrder.update({
        where: { id },
        data: { status }
      });

      // 记录调拨日志
      await prisma.transferLog.create({
        data: {
          transferOrderId: id,
          oldStatus: transferOrder.status,
          newStatus: status,
          reason: reason || `Status changed to ${status}`,
          operatorId: userId
        }
      });
    });

    res.json({ success: true, message: 'Transfer order status updated successfully' });
  } catch (error: any) {
    console.error('Error updating transfer order status:', error);
    res.status(400).json({ success: false, error: error.message || 'Failed to update status' });
  }
});

// 删除调拨订单
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    // 开始事务
    await prisma.$transaction(async (prisma) => {
      // 检查调拨订单是否存在
      const transferOrder = await prisma.transferOrder.findUnique({ where: { id } });
      if (!transferOrder) {
        throw new Error('Transfer order not found');
      }

      // 检查调拨订单状态
      if (transferOrder.status === 'completed') {
        throw new Error('Cannot delete completed transfer order');
      }

      // 获取调拨订单的所有串号
      const serialNumbers = await prisma.serialNumber.findMany({
        where: { transferOrderId: id }
      });

      // 恢复串号状态
      for (const serialNumber of serialNumbers) {
        await prisma.serialNumber.update({
          where: { id: serialNumber.id },
          data: {
            status: 'in_stock',
            transferOrderId: null,
            transferOrderItemId: null
          }
        });

        // 记录串号状态变更日志
        await logSerialNumberStatusChange(
          serialNumber.id,
          'transferring',
          'in_stock',
          'Transfer order deleted',
          userId
        );
      }

      // 删除调拨订单详情
      await prisma.transferOrderItem.deleteMany({ where: { orderId: id } });

      // 删除调拨日志
      await prisma.transferLog.deleteMany({ where: { transferOrderId: id } });

      // 删除调拨订单
      await prisma.transferOrder.delete({ where: { id } });
    });

    res.json({ success: true, message: 'Transfer order deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting transfer order:', error);
    res.status(400).json({ success: false, error: error.message || 'Failed to delete transfer order' });
  }
});

export default router;