import express from 'express';
import prisma from '../lib/prisma';
import { ApiError } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// 获取采购订单列表
router.get('/', authenticate, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true
        }
      }),
      prisma.purchaseOrder.count()
    ]);

    res.json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// 获取采购订单详情
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        items: true
      }
    });

    if (!order) {
      throw new ApiError(404, 'Purchase order not found');
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
});

// 创建采购订单
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { shopId, supplierId, items, status } = req.body;

    if (!shopId || !supplierId || !items || !Array.isArray(items) || items.length === 0) {
      throw new ApiError(400, 'ShopId, supplierId, and items array are required');
    }

    let totalAmount = 0;

    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) {
        throw new ApiError(404, `Product ${item.productId} not found`);
      }
      totalAmount += item.price * item.quantity;
    }

    const newOrder = await prisma.purchaseOrder.create({
      data: {
        shopId,
        supplierId,
        totalAmount,
        status: status || 'pending'
      }
    });

    for (const item of items) {
      const orderItem = await prisma.purchaseOrderItem.create({
        data: {
          orderId: newOrder.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price
        }
      });

      // 处理串号绑定
      if (item.serialNumbers && Array.isArray(item.serialNumbers)) {
        for (const serialNumberId of item.serialNumbers) {
          const serialNumber = await prisma.serialNumber.findUnique({
            where: { id: serialNumberId }
          });
          
          if (!serialNumber) {
            throw new ApiError(404, `Serial number ${serialNumberId} not found`);
          }
          
          // 检查串号是否已绑定到其他采购订单
          if (serialNumber.purchaseOrderId && serialNumber.purchaseOrderId !== newOrder.id) {
            throw new ApiError(400, `Serial number ${serialNumberId} is already bound to another purchase order`);
          }
          
          await prisma.serialNumber.update({
            where: { id: serialNumberId },
            data: {
              status: 'in_stock',
              purchaseOrderId: newOrder.id,
              purchaseOrderItemId: orderItem.id
            }
          });
          
          await prisma.serialNumberLog.create({
            data: {
              serialNumberId: serialNumberId,
              oldStatus: serialNumber.status,
              newStatus: 'in_stock',
              reason: 'Purchase',
              operatorId: req.user.id
            }
          });
        }
      }

      // 更新商品库存
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } }
      });

      // 创建库存日志
      await prisma.inventoryLog.create({
        data: {
          productId: item.productId,
          quantity: item.quantity,
          type: 'in',
          reason: 'Purchase',
          shopId
        }
      });
    }

    res.json({
      success: true,
      data: newOrder
    });
  } catch (error) {
    next(error);
  }
});

// 绑定串号到采购订单
router.post('/:id/serial-numbers', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { itemId, serialNumbers } = req.body;

    if (!itemId || !serialNumbers || !Array.isArray(serialNumbers)) {
      throw new ApiError(400, 'ItemId and serialNumbers array are required');
    }

    const order = await prisma.purchaseOrder.findUnique({
      where: { id }
    });

    if (!order) {
      throw new ApiError(404, 'Purchase order not found');
    }

    const orderItem = await prisma.purchaseOrderItem.findUnique({
      where: { id: itemId }
    });

    if (!orderItem || orderItem.orderId !== id) {
      throw new ApiError(404, 'Purchase order item not found');
    }

    const boundSerialNumbers = [];

    for (const serialNumberId of serialNumbers) {
      const serialNumber = await prisma.serialNumber.findUnique({
        where: { id: serialNumberId }
      });
      
      if (!serialNumber) {
        throw new ApiError(404, `Serial number ${serialNumberId} not found`);
      }
      
      // 检查串号是否已绑定到其他采购订单
      if (serialNumber.purchaseOrderId && serialNumber.purchaseOrderId !== id) {
        throw new ApiError(400, `Serial number ${serialNumberId} is already bound to another purchase order`);
      }
      
      const updatedSerialNumber = await prisma.serialNumber.update({
        where: { id: serialNumberId },
        data: {
          status: 'in_stock',
          purchaseOrderId: id,
          purchaseOrderItemId: itemId
        }
      });
      
      await prisma.serialNumberLog.create({
        data: {
          serialNumberId: serialNumberId,
          oldStatus: serialNumber.status,
          newStatus: 'in_stock',
          reason: 'Purchase',
          operatorId: req.user.id
        }
      });

      boundSerialNumbers.push(updatedSerialNumber);
    }

    res.json({
      success: true,
      data: boundSerialNumbers
    });
  } catch (error) {
    next(error);
  }
});

// 解除串号与采购订单的绑定
router.delete('/:id/serial-numbers/:serialNumberId', authenticate, async (req, res, next) => {
  try {
    const { id, serialNumberId } = req.params;

    const serialNumber = await prisma.serialNumber.findUnique({
      where: { id: serialNumberId }
    });

    if (!serialNumber) {
      throw new ApiError(404, 'Serial number not found');
    }

    if (serialNumber.purchaseOrderId !== id) {
      throw new ApiError(400, 'Serial number is not bound to this purchase order');
    }

    const updatedSerialNumber = await prisma.serialNumber.update({
      where: { id: serialNumberId },
      data: {
        status: 'in_stock',
        purchaseOrderId: null,
        purchaseOrderItemId: null
      }
    });

    await prisma.serialNumberLog.create({
      data: {
        serialNumberId: serialNumberId,
        oldStatus: serialNumber.status,
        newStatus: 'in_stock',
        reason: 'Cancel purchase binding',
        operatorId: req.user.id
      }
    });

    res.json({
      success: true,
      data: updatedSerialNumber
    });
  } catch (error) {
    next(error);
  }
});

// 获取采购订单的串号
router.get('/:id/serial-numbers', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const serialNumbers = await prisma.serialNumber.findMany({
      where: { purchaseOrderId: id },
      include: {
        product: true,
        purchaseOrderItem: true
      }
    });

    res.json({
      success: true,
      data: serialNumbers
    });
  } catch (error) {
    next(error);
  }
});

// 更新采购订单状态
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await prisma.purchaseOrder.update({
      where: { id },
      data: { status }
    });

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
});

// 删除采购订单
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.purchaseOrder.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Purchase order deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// 获取商品的采购价格历史记录
router.get('/product/:productId/price-history', authenticate, async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const [priceHistory, total] = await Promise.all([
      prisma.purchaseOrderItem.findMany({
        where: { productId },
        include: {
          order: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.purchaseOrderItem.count({ where: { productId } })
    ]);

    // 转换数据格式，只返回需要的字段
    const formattedHistory = priceHistory.map(item => ({
      id: item.id,
      purchaseOrderId: item.orderId,
      orderDate: item.order.createdAt,
      price: item.price,
      quantity: item.quantity,
      totalAmount: item.price * item.quantity
    }));

    res.json({
      success: true,
      data: formattedHistory,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
});

// 采购退货相关路由

// 获取采购退货单列表
router.get('/returns', authenticate, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [returns, total] = await Promise.all([
      prisma.purchaseReturn.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
          order: true
        }
      }),
      prisma.purchaseReturn.count()
    ]);

    res.json({
      success: true,
      data: returns,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// 获取采购退货单详情
router.get('/returns/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const returnOrder = await prisma.purchaseReturn.findUnique({
      where: { id },
      include: {
        items: true,
        order: true
      }
    });

    if (!returnOrder) {
      throw new ApiError(404, 'Purchase return not found');
    }

    res.json({
      success: true,
      data: returnOrder
    });
  } catch (error) {
    next(error);
  }
});

// 创建采购退货单
router.post('/returns', authenticate, async (req, res, next) => {
  try {
    const { orderId, shopId, reason, items } = req.body;

    if (!orderId || !shopId || !reason || !items || !Array.isArray(items) || items.length === 0) {
      throw new ApiError(400, 'OrderId, shopId, reason, and items array are required');
    }

    const order = await prisma.purchaseOrder.findUnique({ where: { id: orderId } });
    if (!order) {
      throw new ApiError(404, 'Purchase order not found');
    }

    let totalAmount = 0;

    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) {
        throw new ApiError(404, `Product ${item.productId} not found`);
      }
      totalAmount += item.price * item.quantity;
    }

    const newReturn = await prisma.purchaseReturn.create({
      data: {
        orderId,
        shopId,
        reason,
        totalAmount,
        status: 'pending'
      }
    });

    for (const item of items) {
      const returnItem = await prisma.purchaseReturnItem.create({
        data: {
          returnId: newReturn.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price
        }
      });

      // 处理串号绑定
      if (item.serialNumbers && Array.isArray(item.serialNumbers)) {
        for (const serialNumberId of item.serialNumbers) {
          const serialNumber = await prisma.serialNumber.findUnique({
            where: { id: serialNumberId }
          });
          
          if (!serialNumber) {
            throw new ApiError(404, `Serial number ${serialNumberId} not found`);
          }
          
          await prisma.serialNumber.update({
            where: { id: serialNumberId },
            data: {
              status: 'returned_to_supplier',
              purchaseReturnId: newReturn.id,
              purchaseReturnItemId: returnItem.id
            }
          });
          
          await prisma.serialNumberLog.create({
            data: {
              serialNumberId: serialNumberId,
              oldStatus: serialNumber.status,
              newStatus: 'returned_to_supplier',
              reason: 'Purchase return',
              operatorId: req.user.id
            }
          });
        }
      }

      // 更新商品库存
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } }
      });

      // 创建库存日志
      await prisma.inventoryLog.create({
        data: {
          productId: item.productId,
          quantity: item.quantity,
          type: 'out',
          reason: 'Purchase return',
          shopId
        }
      });
    }

    res.json({
      success: true,
      data: newReturn
    });
  } catch (error) {
    next(error);
  }
});

// 绑定串号到采购退货单
router.post('/returns/:id/serial-numbers', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { itemId, serialNumbers } = req.body;

    if (!itemId || !serialNumbers || !Array.isArray(serialNumbers)) {
      throw new ApiError(400, 'ItemId and serialNumbers array are required');
    }

    const returnOrder = await prisma.purchaseReturn.findUnique({ where: { id } });
    if (!returnOrder) {
      throw new ApiError(404, 'Purchase return not found');
    }

    const returnItem = await prisma.purchaseReturnItem.findUnique({ where: { id: itemId } });
    if (!returnItem || returnItem.returnId !== id) {
      throw new ApiError(404, 'Purchase return item not found');
    }

    const boundSerialNumbers = [];

    for (const serialNumberId of serialNumbers) {
      const serialNumber = await prisma.serialNumber.findUnique({ where: { id: serialNumberId } });
      
      if (!serialNumber) {
        throw new ApiError(404, `Serial number ${serialNumberId} not found`);
      }
      
      const updatedSerialNumber = await prisma.serialNumber.update({
        where: { id: serialNumberId },
        data: {
          status: 'returned_to_supplier',
          purchaseReturnId: id,
          purchaseReturnItemId: itemId
        }
      });
      
      await prisma.serialNumberLog.create({
        data: {
          serialNumberId: serialNumberId,
          oldStatus: serialNumber.status,
          newStatus: 'returned_to_supplier',
          reason: 'Purchase return',
          operatorId: req.user.id
        }
      });

      boundSerialNumbers.push(updatedSerialNumber);
    }

    res.json({
      success: true,
      data: boundSerialNumbers
    });
  } catch (error) {
    next(error);
  }
});

// 解除串号与采购退货单的绑定
router.delete('/returns/:id/serial-numbers/:serialNumberId', authenticate, async (req, res, next) => {
  try {
    const { id, serialNumberId } = req.params;

    const serialNumber = await prisma.serialNumber.findUnique({ where: { id: serialNumberId } });
    if (!serialNumber) {
      throw new ApiError(404, 'Serial number not found');
    }

    if (serialNumber.purchaseReturnId !== id) {
      throw new ApiError(400, 'Serial number is not bound to this purchase return');
    }

    const updatedSerialNumber = await prisma.serialNumber.update({
      where: { id: serialNumberId },
      data: {
        status: 'in_stock',
        purchaseReturnId: null,
        purchaseReturnItemId: null
      }
    });

    await prisma.serialNumberLog.create({
      data: {
        serialNumberId: serialNumberId,
        oldStatus: serialNumber.status,
        newStatus: 'in_stock',
        reason: 'Cancel purchase return binding',
        operatorId: req.user.id
      }
    });

    res.json({
      success: true,
      data: updatedSerialNumber
    });
  } catch (error) {
    next(error);
  }
});

// 获取采购退货单的串号
router.get('/returns/:id/serial-numbers', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const serialNumbers = await prisma.serialNumber.findMany({
      where: { purchaseReturnId: id },
      include: {
        product: true,
        purchaseReturnItem: true
      }
    });

    res.json({
      success: true,
      data: serialNumbers
    });
  } catch (error) {
    next(error);
  }
});

// 更新采购退货单状态
router.put('/returns/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const returnOrder = await prisma.purchaseReturn.update({
      where: { id },
      data: { status }
    });

    res.json({
      success: true,
      data: returnOrder
    });
  } catch (error) {
    next(error);
  }
});

export default router;