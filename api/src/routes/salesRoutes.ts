import express from 'express';
import prisma from '../lib/prisma';
import { ApiError } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.salesOrder.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.salesOrder.count()
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

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await prisma.salesOrder.findUnique({
      where: { id }
    });

    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    const { shopId, items, status } = req.body;

    if (!shopId || !items || !Array.isArray(items) || items.length === 0) {
      throw new ApiError(400, 'ShopId and items array are required');
    }

    let totalAmount = 0;

    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) {
        throw new ApiError(404, `Product ${item.productId} not found`);
      }
      if (product.stock < item.quantity) {
        throw new ApiError(400, `Insufficient stock for product ${product.name}`);
      }
      totalAmount += item.price * item.quantity;
    }

    const newOrder = await prisma.salesOrder.create({
      data: {
        shopId,
        totalAmount,
        status: status || 'pending'
      }
    });

    for (const item of items) {
      await prisma.salesOrderItem.create({
        data: {
          orderId: newOrder.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price
        }
      });

      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } }
      });

      await prisma.inventoryLog.create({
        data: {
          productId: item.productId,
          quantity: item.quantity,
          type: 'out',
          reason: 'Sale',
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

router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await prisma.salesOrder.update({
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

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.salesOrder.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
