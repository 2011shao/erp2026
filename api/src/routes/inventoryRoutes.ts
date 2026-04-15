import express from 'express';
import prisma from '../lib/prisma';
import { ApiError } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const shopId = req.query.shopId as string;
    const lowStock = req.query.lowStock === 'true';
    const skip = (page - 1) * limit;

    const where: any = {};
    if (shopId) where.shopId = shopId;

    let products = await prisma.product.findMany({
      where,
      skip,
      take: limit,
      include: { shop: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    if (lowStock) {
      products = products.filter((p) => p.stock < 10);
    }

    const total = await prisma.product.count({ where });

    res.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/alerts', authenticate, async (req, res, next) => {
  try {
    const shopId = req.query.shopId as string;

    const where: any = {};
    if (shopId) where.shopId = shopId;

    const lowStockProducts = await prisma.product.findMany({
      where: {
        ...where,
        stock: { lt: 10 },
      },
      include: { shop: { select: { id: true, name: true } } },
    });

    res.json({
      success: true,
      data: lowStockProducts,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/logs', authenticate, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const productId = req.query.productId as string;
    const shopId = req.query.shopId as string;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (productId) where.productId = productId;
    if (shopId) where.shopId = shopId;

    const [logs, total] = await Promise.all([
      prisma.inventoryLog.findMany({
        where,
        skip,
        take: limit,
        include: { product: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.inventoryLog.count({ where }),
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/adjust', authenticate, async (req, res, next) => {
  try {
    const { productId, quantity, type, reason, shopId } = req.body;

    if (!productId || !quantity || !type || !reason || !shopId) {
      throw new ApiError(400, 'Missing required fields');
    }

    if (type !== 'in' && type !== 'out') {
      throw new ApiError(400, 'Type must be either "in" or "out"');
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });

    if (!product) {
      throw new ApiError(404, 'Product not found');
    }

    const newStock = type === 'in' ? product.stock + quantity : product.stock - quantity;

    if (newStock < 0) {
      throw new ApiError(400, 'Insufficient stock');
    }

    const [updatedProduct, log] = await Promise.all([
      prisma.product.update({
        where: { id: productId },
        data: { stock: newStock },
      }),
      prisma.inventoryLog.create({
        data: {
          productId,
          quantity,
          type,
          reason,
          shopId,
        },
      }),
    ]);

    res.json({
      success: true,
      data: { product: updatedProduct, log },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/stocktake', authenticate, async (req, res, next) => {
  try {
    const { items, shopId } = req.body;

    if (!items || !Array.isArray(items) || !shopId) {
      throw new ApiError(400, 'Items array and shopId are required');
    }

    const results = await Promise.all(
      items.map(async (item: any) => {
        const product = await prisma.product.findUnique({ where: { id: item.productId } });

        if (!product) {
          return { productId: item.productId, success: false, error: 'Product not found' };
        }

        const quantityDiff = item.actualStock - product.stock;
        const type = quantityDiff > 0 ? 'in' : 'out';

        const [updatedProduct, log] = await Promise.all([
          prisma.product.update({
            where: { id: item.productId },
            data: { stock: item.actualStock },
          }),
          prisma.inventoryLog.create({
            data: {
              productId: item.productId,
              quantity: Math.abs(quantityDiff),
              type,
              reason: 'Stocktake adjustment',
              shopId,
            },
          }),
        ]);

        return { productId: item.productId, success: true, product: updatedProduct, log };
      })
    );

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
