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

// 获取库存预警列表
router.get('/alerts', authenticate, async (req, res, next) => {
  try {
    const shopId = req.query.shopId as string;
    const alertLevel = req.query.alertLevel as string;

    const where: any = {
      alertEnabled: true,
    };
    
    if (shopId) where.shopId = shopId;
    if (alertLevel) where.alertLevel = alertLevel;

    // 查找所有启用预警的商品
    const products = await prisma.product.findMany({
      where,
      include: { 
        shop: { select: { id: true, name: true } },
        warehouse: { select: { id: true, name: true } }
      },
      orderBy: { stock: 'asc' },
    });

    // 过滤出库存低于最小库存阈值的商品
    const alertProducts = products.filter(product => {
      const minStock = product.minStock || 10;
      return product.stock < minStock;
    });

    // 计算预警级别
    const processedAlertProducts = alertProducts.map(product => {
      const minStock = product.minStock || 10;
      const stockRatio = product.stock / minStock;
      let level = 'low';
      
      if (stockRatio <= 0.2) {
        level = 'high';
      } else if (stockRatio <= 0.5) {
        level = 'medium';
      }
      
      return {
        ...product,
        calculatedAlertLevel: level,
        minStock,
        stockRatio: parseFloat(stockRatio.toFixed(2))
      };
    });

    res.json({
      success: true,
      data: processedAlertProducts,
      total: processedAlertProducts.length,
    });
  } catch (error) {
    next(error);
  }
});

// 更新商品库存预警规则
router.put('/:id/alert-rule', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { minStock, alertEnabled, alertLevel } = req.body;

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new ApiError(404, 'Product not found');
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        minStock,
        alertEnabled,
        alertLevel
      }
    });

    res.json({
      success: true,
      data: updatedProduct,
    });
  } catch (error) {
    next(error);
  }
});

// 批量更新库存预警规则
router.put('/batch/alert-rules', authenticate, async (req, res, next) => {
  try {
    const { products } = req.body;
    
    if (!products || !Array.isArray(products)) {
      throw new ApiError(400, 'Products array is required');
    }

    const results = await Promise.all(
      products.map(async (item: any) => {
        try {
          const updatedProduct = await prisma.product.update({
            where: { id: item.productId },
            data: {
              minStock: item.minStock,
              alertEnabled: item.alertEnabled,
              alertLevel: item.alertLevel
            }
          });
          return { productId: item.productId, success: true, product: updatedProduct };
        } catch (error) {
          return { productId: item.productId, success: false, error: (error as any).message };
        }
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

// 获取库存预警统计
router.get('/alert-stats', authenticate, async (req, res, next) => {
  try {
    const shopId = req.query.shopId as string;

    const where: any = {
      alertEnabled: true,
    };
    
    if (shopId) where.shopId = shopId;

    const products = await prisma.product.findMany({
      where,
      select: { id: true, stock: true, minStock: true },
    });

    // 统计预警级别
    let highAlert = 0;
    let mediumAlert = 0;
    let lowAlert = 0;
    let totalProducts = products.length;

    products.forEach(product => {
      const minStock = product.minStock || 10;
      const stockRatio = product.stock / minStock;
      
      if (stockRatio <= 0.2) {
        highAlert++;
      } else if (stockRatio <= 0.5) {
        mediumAlert++;
      } else if (stockRatio <= 0.8) {
        lowAlert++;
      }
    });

    res.json({
      success: true,
      data: {
        highAlert,
        mediumAlert,
        lowAlert,
        totalProducts,
        alertCount: highAlert + mediumAlert + lowAlert,
        alertRate: totalProducts > 0 ? parseFloat(((highAlert + mediumAlert + lowAlert) / totalProducts * 100).toFixed(2)) : 0
      },
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
