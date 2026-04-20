import { Router, type Request, type Response } from 'express';
import { Prisma } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import { logSerialNumberStatusChange } from '../utils/serialNumberUtils';
import prisma from '../lib/prisma';

const router = Router();

// 应用认证中间件
router.use(authenticate);

// 获取库存盘点列表
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10, status, warehouseId, shopId, search } = req.query;
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (warehouseId) {
      where.warehouseId = warehouseId;
    }

    if (shopId) {
      where.shopId = shopId;
    }

    if (search) {
      where.OR = [
        { notes: { contains: search as string, mode: 'insensitive' } },
        { warehouse: { name: { contains: search as string, mode: 'insensitive' } } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [stocktakes, total] = await Promise.all([
      prisma.stocktake.findMany({
        where,
        include: {
          warehouse: { select: { id: true, name: true, code: true } },
          shop: { select: { id: true, name: true } },
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
      prisma.stocktake.count({ where })
    ]);

    res.json({
      success: true,
      data: stocktakes,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching stocktakes:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch stocktakes' });
  }
});

// 获取库存盘点详情
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const stocktake = await prisma.stocktake.findUnique({
      where: { id },
      include: {
        warehouse: { select: { id: true, name: true, code: true, address: true } },
        shop: { select: { id: true, name: true } },
        operator: { select: { id: true, username: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, brand: true, model: true, price: true } },
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

    if (!stocktake) {
      res.status(404).json({ success: false, error: 'Stocktake not found' });
      return;
    }

    res.json({ success: true, data: stocktake });
  } catch (error) {
    console.error('Error fetching stocktake details:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch stocktake details' });
  }
});

// 创建库存盘点
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { warehouseId, notes } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    if (!warehouseId) {
      res.status(400).json({ success: false, error: 'Warehouse ID is required' });
      return;
    }

    // 开始事务
    const stocktake = await prisma.$transaction(async (prisma) => {
      // 检查仓库是否存在
      const warehouse = await prisma.warehouse.findUnique({ where: { id: warehouseId } });
      if (!warehouse) {
        throw new Error('Warehouse not found');
      }

      // 获取仓库中的所有商品
      const products = await prisma.product.findMany({
        where: { warehouseId },
        include: {
          serialNumbers: {
            where: { status: 'in_stock' }
          }
        }
      });

      // 创建库存盘点
      const newStocktake = await prisma.stocktake.create({
        data: {
          warehouseId,
          shopId: warehouse.shopId,
          operatorId: userId,
          status: 'in_progress',
          totalItems: products.length,
          variance: 0,
          notes
        }
      });

      // 创建库存盘点详情
      for (const product of products) {
        const expectedStock = product.serialNumbers.length;
        await prisma.stocktakeItem.create({
          data: {
            stocktakeId: newStocktake.id,
            productId: product.id,
            expectedStock,
            actualStock: 0,
            variance: -expectedStock,
            unitPrice: product.price,
            varianceValue: product.price.mul(expectedStock).negate()
          }
        });
      }

      // 记录盘点日志
      await prisma.stocktakeLog.create({
        data: {
          stocktakeId: newStocktake.id,
          oldStatus: 'none',
          newStatus: 'in_progress',
          reason: 'Stocktake created',
          operatorId: userId
        }
      });

      return newStocktake;
    });

    res.status(201).json({ success: true, data: stocktake });
  } catch (error: any) {
    console.error('Error creating stocktake:', error);
    res.status(400).json({ success: false, error: error.message || 'Failed to create stocktake' });
  }
});

// 更新库存盘点项目
router.put('/:id/items/:itemId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, itemId } = req.params;
    const { actualStock, notes } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    if (actualStock === undefined) {
      res.status(400).json({ success: false, error: 'Actual stock is required' });
      return;
    }

    // 开始事务
    await prisma.$transaction(async (prisma) => {
      // 检查库存盘点是否存在
      const stocktake = await prisma.stocktake.findUnique({ where: { id } });
      if (!stocktake) {
        throw new Error('Stocktake not found');
      }

      // 检查库存盘点状态
      if (stocktake.status !== 'in_progress') {
        throw new Error('Cannot update completed or cancelled stocktake');
      }

      // 检查库存盘点项目是否存在
      const stocktakeItem = await prisma.stocktakeItem.findUnique({ 
        where: { id: itemId },
        include: { product: true }
      });
      if (!stocktakeItem || stocktakeItem.stocktakeId !== id) {
        throw new Error('Stocktake item not found');
      }

      // 计算差异
      const variance = actualStock - stocktakeItem.expectedStock;
      const varianceValue = stocktakeItem.unitPrice.mul(variance);

      // 更新库存盘点项目
      await prisma.stocktakeItem.update({
        where: { id: itemId },
        data: {
          actualStock,
          variance,
          varianceValue,
          notes
        }
      });

      // 重新计算总差异
      const items = await prisma.stocktakeItem.findMany({ where: { stocktakeId: id } });
      const totalVariance = items.reduce((sum, item) => sum.add(item.varianceValue), new Prisma.Decimal(0));

      // 更新库存盘点
      await prisma.stocktake.update({
        where: { id },
        data: { variance: totalVariance }
      });
    });

    res.json({ success: true, message: 'Stocktake item updated successfully' });
  } catch (error: any) {
    console.error('Error updating stocktake item:', error);
    res.status(400).json({ success: false, error: error.message || 'Failed to update stocktake item' });
  }
});

// 绑定串号到库存盘点项目
router.post('/:id/items/:itemId/serial-numbers', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, itemId } = req.params;
    const { serialNumberIds } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    if (!serialNumberIds || !Array.isArray(serialNumberIds) || serialNumberIds.length === 0) {
      res.status(400).json({ success: false, error: 'Serial numbers are required' });
      return;
    }

    // 开始事务
    await prisma.$transaction(async (prisma) => {
      // 检查库存盘点是否存在
      const stocktake = await prisma.stocktake.findUnique({ where: { id } });
      if (!stocktake) {
        throw new Error('Stocktake not found');
      }

      // 检查库存盘点状态
      if (stocktake.status !== 'in_progress') {
        throw new Error('Cannot add serial numbers to completed or cancelled stocktake');
      }

      // 检查库存盘点项目是否存在
      const stocktakeItem = await prisma.stocktakeItem.findUnique({ where: { id: itemId } });
      if (!stocktakeItem || stocktakeItem.stocktakeId !== id) {
        throw new Error('Stocktake item not found');
      }

      // 检查串号是否存在且状态为库存中
      const serialNumbers = await prisma.serialNumber.findMany({
        where: {
          id: { in: serialNumberIds },
          status: 'in_stock',
          warehouseId: stocktake.warehouseId,
          productId: stocktakeItem.productId
        }
      });

      if (serialNumbers.length !== serialNumberIds.length) {
        throw new Error('Some serial numbers are not found or not in stock');
      }

      // 绑定串号到库存盘点项目
      for (const serialNumber of serialNumbers) {
        await prisma.serialNumber.update({
          where: { id: serialNumber.id },
          data: {
            status: 'stocktaking',
            stocktakeId: stocktake.id,
            stocktakeItemId: itemId
          }
        });

        // 记录串号状态变更日志
        await logSerialNumberStatusChange(
          serialNumber.id,
          'in_stock',
          'stocktaking',
          `Stocktaking in warehouse ${stocktake.warehouseId}`,
          userId
        );
      }

      // 更新库存盘点项目的实际库存
      const currentItem = await prisma.stocktakeItem.findUnique({ where: { id: itemId } });
      if (currentItem) {
        const newActualStock = currentItem.actualStock + serialNumbers.length;
        const variance = newActualStock - currentItem.expectedStock;
        const varianceValue = currentItem.unitPrice.mul(variance);

        await prisma.stocktakeItem.update({
          where: { id: itemId },
          data: {
            actualStock: newActualStock,
            variance,
            varianceValue
          }
        });

        // 重新计算总差异
        const items = await prisma.stocktakeItem.findMany({ where: { stocktakeId: id } });
        const totalVariance = items.reduce((sum, item) => sum.add(item.varianceValue), new Prisma.Decimal(0));

        // 更新库存盘点
        await prisma.stocktake.update({
          where: { id },
          data: { variance: totalVariance }
        });
      }
    });

    res.json({ success: true, message: 'Serial numbers bound to stocktake item successfully' });
  } catch (error: any) {
    console.error('Error binding serial numbers to stocktake item:', error);
    res.status(400).json({ success: false, error: error.message || 'Failed to bind serial numbers' });
  }
});

// 解绑串号从库存盘点项目
router.delete('/:id/items/:itemId/serial-numbers/:serialNumberId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, itemId, serialNumberId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    // 开始事务
    await prisma.$transaction(async (prisma) => {
      // 检查库存盘点是否存在
      const stocktake = await prisma.stocktake.findUnique({ where: { id } });
      if (!stocktake) {
        throw new Error('Stocktake not found');
      }

      // 检查库存盘点状态
      if (stocktake.status !== 'in_progress') {
        throw new Error('Cannot remove serial numbers from completed or cancelled stocktake');
      }

      // 检查串号是否存在且属于该库存盘点项目
      const serialNumber = await prisma.serialNumber.findUnique({ where: { id: serialNumberId } });
      if (!serialNumber || serialNumber.stocktakeId !== id || serialNumber.stocktakeItemId !== itemId) {
        throw new Error('Serial number not found in this stocktake item');
      }

      // 解绑串号
      await prisma.serialNumber.update({
        where: { id: serialNumberId },
        data: {
          status: 'in_stock',
          stocktakeId: null,
          stocktakeItemId: null
        }
      });

      // 记录串号状态变更日志
      await logSerialNumberStatusChange(
        serialNumberId,
        'stocktaking',
        'in_stock',
        'Removed from stocktake',
        userId
      );

      // 更新库存盘点项目的实际库存
      const stocktakeItem = await prisma.stocktakeItem.findUnique({ where: { id: itemId } });
      if (stocktakeItem) {
        const newActualStock = Math.max(0, stocktakeItem.actualStock - 1);
        const variance = newActualStock - stocktakeItem.expectedStock;
        const varianceValue = stocktakeItem.unitPrice.mul(variance);

        await prisma.stocktakeItem.update({
          where: { id: itemId },
          data: {
            actualStock: newActualStock,
            variance,
            varianceValue
          }
        });

        // 重新计算总差异
        const items = await prisma.stocktakeItem.findMany({ where: { stocktakeId: id } });
        const totalVariance = items.reduce((sum, item) => sum.add(item.varianceValue), new Prisma.Decimal(0));

        // 更新库存盘点
        await prisma.stocktake.update({
          where: { id },
          data: { variance: totalVariance }
        });
      }
    });

    res.json({ success: true, message: 'Serial number removed from stocktake item successfully' });
  } catch (error: any) {
    console.error('Error removing serial number from stocktake item:', error);
    res.status(400).json({ success: false, error: error.message || 'Failed to remove serial number' });
  }
});

// 完成库存盘点
router.put('/:id/complete', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    // 开始事务
    await prisma.$transaction(async (prisma) => {
      // 检查库存盘点是否存在
      const stocktake = await prisma.stocktake.findUnique({ where: { id } });
      if (!stocktake) {
        throw new Error('Stocktake not found');
      }

      // 检查库存盘点状态
      if (stocktake.status !== 'in_progress') {
        throw new Error('Stocktake is not in progress');
      }

      // 获取库存盘点项目
      const items = await prisma.stocktakeItem.findMany({ where: { stocktakeId: id } });

      // 更新商品库存
      for (const item of items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: item.actualStock }
        });
      }

      // 获取库存盘点中的串号
      const serialNumbers = await prisma.serialNumber.findMany({ where: { stocktakeId: id } });

      // 更新串号状态
      for (const serialNumber of serialNumbers) {
        await prisma.serialNumber.update({
          where: { id: serialNumber.id },
          data: {
            status: 'in_stock',
            stocktakeId: null,
            stocktakeItemId: null
          }
        });

        // 记录串号状态变更日志
        await logSerialNumberStatusChange(
          serialNumber.id,
          'stocktaking',
          'in_stock',
          'Stocktake completed',
          userId
        );
      }

      // 更新库存盘点状态
      await prisma.stocktake.update({
        where: { id },
        data: {
          status: 'completed',
          endDate: new Date()
        }
      });

      // 记录盘点日志
      await prisma.stocktakeLog.create({
        data: {
          stocktakeId: id,
          oldStatus: 'in_progress',
          newStatus: 'completed',
          reason: reason || 'Stocktake completed',
          operatorId: userId
        }
      });
    });

    res.json({ success: true, message: 'Stocktake completed successfully' });
  } catch (error: any) {
    console.error('Error completing stocktake:', error);
    res.status(400).json({ success: false, error: error.message || 'Failed to complete stocktake' });
  }
});

// 取消库存盘点
router.put('/:id/cancel', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    // 开始事务
    await prisma.$transaction(async (prisma) => {
      // 检查库存盘点是否存在
      const stocktake = await prisma.stocktake.findUnique({ where: { id } });
      if (!stocktake) {
        throw new Error('Stocktake not found');
      }

      // 检查库存盘点状态
      if (stocktake.status !== 'in_progress') {
        throw new Error('Stocktake is not in progress');
      }

      // 获取库存盘点中的串号
      const serialNumbers = await prisma.serialNumber.findMany({ where: { stocktakeId: id } });

      // 更新串号状态
      for (const serialNumber of serialNumbers) {
        await prisma.serialNumber.update({
          where: { id: serialNumber.id },
          data: {
            status: 'in_stock',
            stocktakeId: null,
            stocktakeItemId: null
          }
        });

        // 记录串号状态变更日志
        await logSerialNumberStatusChange(
          serialNumber.id,
          'stocktaking',
          'in_stock',
          'Stocktake cancelled',
          userId
        );
      }

      // 更新库存盘点状态
      await prisma.stocktake.update({
        where: { id },
        data: {
          status: 'cancelled',
          endDate: new Date()
        }
      });

      // 记录盘点日志
      await prisma.stocktakeLog.create({
        data: {
          stocktakeId: id,
          oldStatus: 'in_progress',
          newStatus: 'cancelled',
          reason: reason || 'Stocktake cancelled',
          operatorId: userId
        }
      });
    });

    res.json({ success: true, message: 'Stocktake cancelled successfully' });
  } catch (error: any) {
    console.error('Error cancelling stocktake:', error);
    res.status(400).json({ success: false, error: error.message || 'Failed to cancel stocktake' });
  }
});

// 删除库存盘点
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
      // 检查库存盘点是否存在
      const stocktake = await prisma.stocktake.findUnique({ where: { id } });
      if (!stocktake) {
        throw new Error('Stocktake not found');
      }

      // 检查库存盘点状态
      if (stocktake.status === 'completed') {
        throw new Error('Cannot delete completed stocktake');
      }

      // 获取库存盘点中的串号
      const serialNumbers = await prisma.serialNumber.findMany({ where: { stocktakeId: id } });

      // 恢复串号状态
      for (const serialNumber of serialNumbers) {
        await prisma.serialNumber.update({
          where: { id: serialNumber.id },
          data: {
            status: 'in_stock',
            stocktakeId: null,
            stocktakeItemId: null
          }
        });

        // 记录串号状态变更日志
        await logSerialNumberStatusChange(
          serialNumber.id,
          'stocktaking',
          'in_stock',
          'Stocktake deleted',
          userId
        );
      }

      // 删除库存盘点详情
      await prisma.stocktakeItem.deleteMany({ where: { stocktakeId: id } });

      // 删除库存盘点日志
      await prisma.stocktakeLog.deleteMany({ where: { stocktakeId: id } });

      // 删除库存盘点
      await prisma.stocktake.delete({ where: { id } });
    });

    res.json({ success: true, message: 'Stocktake deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting stocktake:', error);
    res.status(400).json({ success: false, error: error.message || 'Failed to delete stocktake' });
  }
});

export default router;